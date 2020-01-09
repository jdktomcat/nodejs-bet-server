const db = require('./src/utils/utilMysql');
const modelCrash = require('./src/model/modelCrash');
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');
async function updateInfo(crashInfo) {
    let conn = null;
    try {
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();
        //写入tx
        // console.log("updateInfo",crashInfo.round, crashInfo.result, crashInfo.win_count, crashInfo.payout, crashInfo.end_ts, crashInfo.end_tx_id);
        await modelCrash.updateInfo(crashInfo.round, crashInfo.result, crashInfo.win_count, crashInfo.payout, crashInfo.end_ts, crashInfo.end_tx_id, conn);
        let all_players = crashInfo.players;
        for (let addr in all_players) {
            let player_info = all_players[addr];
            await modelCrash.updateLog(crashInfo.round, player_info.addr, player_info.out_ts || 0, player_info.cashed_out, player_info.profit, player_info.referral_sun || 0, conn);
        }
        conn.commit();
        conn.release();
    } catch (e) {
        if (conn) {
            conn.rollback();
            conn.release();
        }
        loggerError.error("OMG! ROLLBACK!!!", e);
        return false
    }
    return true;
}

async function getMyLogs(round, count, addr) {
    return await modelCrash.getMyLogs(round, count, addr);
}

async function getRoundInfo(round) {
    let roundInfo = await modelCrash.getLogByRound(round);
    let detailInfo = await modelCrash.getDetailByRound(round);
    return [roundInfo, detailInfo];
}

module.exports.getMyLogs = getMyLogs;
module.exports.getRoundInfo = getRoundInfo;