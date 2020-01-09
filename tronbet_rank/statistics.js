const _ = require('lodash')._;
const config = require('./src/configs/config');
const modelRank = require('./src/models/modelRank');
const db = require('./src/utils/utilMysql');
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('default');
const loggerError = log4js.getLogger('error');

const TRX_RANK = config.award.TRX_RANK;//TRX奖励
const TRX_RANK_BASIC = config.award.TRX_RANK_BASIC;//TRX保底奖励
const ANTE_RANK = config.award.ANTE_RANK;//ANTE奖励
const RANK_SHOW_COUNT = config.award.RANK_SHOW_COUNT; //排行榜显示人数
const BEGIN_TS = config.award.BEGIN_TS;//统计开始时间(ms)
const RANK_DURATION = config.award.RANK_DURATION;//排名持续时间(ms)
const SCAN_INTERVAL = config.award.SCAN_INTERVAL;

const TronWeb = require('tronweb');
const defaultPk = config.tronConfig.defaultPk;
const defaultAddr = TronWeb.address.fromPrivateKey(defaultPk);

let app_start_ts = _.now();
loggerDefault.info("statistics --> >>>app_start_ts",app_start_ts);
async function calcTs(conn) {
    let newestRoundInfo = await modelRank.getNewestRoundInfo(conn);
    if (newestRoundInfo == null) {
        let round = 1;
        let b_ts = app_start_ts > BEGIN_TS ? BEGIN_TS : app_start_ts;
        let e_ts = BEGIN_TS + RANK_DURATION;
        return [round, b_ts, e_ts];
    } else {
        let _now = _.now();
        let round = newestRoundInfo.round;
        let b_ts = newestRoundInfo.start_ts;
        let e_ts = newestRoundInfo.end_ts;
        if (_now > e_ts) {
            round = round + 1;
            b_ts = e_ts;
            e_ts = b_ts + RANK_DURATION;
            while (e_ts < _now) {
                e_ts = e_ts + RANK_DURATION;
                e_ts = e_ts - e_ts % RANK_DURATION;
            }
        }
        return [round, b_ts, e_ts];
    }
}

async function refresh() {
    try {
        loggerDefault.info("statistics --> refresh ...");
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("conn is null");
        }
        conn.beginTransaction();
        let ret = await calcTs(conn);
        let round = ret[0]
        let begin_ts = ret[1];
        let end_ts = ret[2];
        loggerDefault.info("statistics --> round info:", round, begin_ts, end_ts);
        let isExist = await modelRank.isExistSnaphot(round, conn);
        loggerDefault.info("statistics --> isExistSnaphot", isExist);
        if (isExist) {
            let _x = await modelRank.laterSnaphot(round, begin_ts, end_ts, conn);
            let _y = await modelRank.updateSnaphot(round, conn);
            let all_users_bet_trx = Math.ceil(await modelRank.getAllBet(round,conn));
            let _z = await modelRank.updateAllBet(round,all_users_bet_trx,conn);
            loggerDefault.info("statistics --> new players join", _x);
            loggerDefault.info("statistics --> rank updated", _y);
            loggerDefault.info("statistics --> rank sum", _z);
        } else {
            let _z = await modelRank.insertSnaphot(round, begin_ts, end_ts, conn);
            loggerDefault.info("statistics --> rank inserted", _z);
        }
        // loggerDefault.info("statistics --> Async player data begin !!!", _.now());
        //
        await gotoNextRound(round, begin_ts, conn);
        //
        conn.commit();
        conn.release();
        // loggerDefault.info("statistics --> Async player data success !!!", _.now());
        return true;
    } catch (e) {
        if (conn) {
            conn.rollback();
            conn.release();
        }
        loggerDefault.error("statistics --> OMG! ROLLBACK!!!", e);
        loggerError.error("statistics --> OMG! ROLLBACK!!!", e);
        throw new Error("OMG! ROLLBACK!!!", e);
    }
}

async function gotoNextRound(round, ts, conn) {
    // loggerDefault.info("statistics --> gotoNextRound", round, ts);
    let roundInfo = await modelRank.getAwardRoundInfo(conn);
    let nextRound = 1;
    if (roundInfo != null) nextRound = roundInfo.round + 1;
    if (round <= nextRound) return;
    loggerDefault.info("statistics --> 发奖！！！ round:", nextRound);
    let rank_list = await modelRank.getRankInfo(nextRound, RANK_SHOW_COUNT, conn);
    let idx = 0;
    for (let obj of rank_list) {
        idx = idx + 1;
        if (idx > RANK_SHOW_COUNT) break;
        // let _trx = TRX_RANK[idx - 1] || 0;
        let _trx = Math.ceil(obj.all_users_bet_trx * 0.00068 * (TRX_RANK[idx - 1] || 0)) + (TRX_RANK_BASIC[idx - 1] || 0); //TODO:
        // let _trx = TRX_RANK_BASIC[idx - 1] || 0;
        let _trx_tx_status = _trx > 0 ? 1 : 0;
        let _ante = ANTE_RANK[idx - 1] || 0;
        let _ante_tx_status = _ante > 0 ? 1 : 0;
        if (obj.addr == defaultAddr) {
            _trx_tx_status = 0;
            _ante_tx_status = 0;
        }
        loggerDefault.info("statistics --> new award info:", nextRound, idx, obj.addr, obj.total_bet_sun, _trx, _ante, ts, _trx_tx_status, _ante_tx_status);
        await modelRank.insertAwardInfo(nextRound, idx, obj.addr, obj.total_bet_sun, _trx, _ante, ts, _trx_tx_status, _ante_tx_status, conn);
    }
}

// async function getRankList() {
//     let round = await calcTs()[0];
//     if (round == null || round < 0) return;
//     let ret = await modelRank.getRankInfo(round, RANK_SHOW_COUNT);
//     loggerDefault.info(ret);
//     return ret;
// }

async function init() {
    await refresh();
    setInterval(async () => {
        await refresh();
    }, SCAN_INTERVAL);
}

module.exports.init = init;