const db = require('../utils/utilMysql');
const _ = require('underscore')._;
const BigNumber = require('bignumber.js');
const config = require('../configs/config');
const log4js = require('../configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');

const MINE_REDIS_PREFIX_KEY='MINE:USER:player:logs';

const redis = require('ioredis').createClient(
    {
        host: config.redisConfig.host,
        port: config.redisConfig.port,
        password: config.redisConfig.pwd,
        db: config.redisConfig.db
    }
);

let DICE_PLAYERS = new Map();

async function init() {
    try {
        let sql = "select user_id,addr from dice_players";
        let allPlayers = await db.execTrans(sql);
        for (let playerInfo of allPlayers) {
            addPlayer(playerInfo.addr, playerInfo.user_id);
        }
    } catch (e) {
        throw new Error("can not init db service!");
    }
    loggerDefault.info("init DICE_PLAYERS", DICE_PLAYERS)
}

init();

function addPlayer(addr, user_id) {
    let userId = DICE_PLAYERS.get(addr);
    if (userId) {
        return userId;
    }
    DICE_PLAYERS.set(addr, user_id);
}

async function saveDB(blockInfo) {
    // loggerDefault.info(blockInfo);
    let begin_ts = Date.now();
    // loggerDefault.info("db save begin ==>", begin_ts);
    let txs = blockInfo.app_txs;
    let conn = null;
    try {
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();
        //写入tx
        let sqlTx = "insert into dice_txs (block_num,tx_id,tx_result,energy,net) values (?,?,?,?,?)";
        let sqlTransfer = "insert into ante_token_holder (addr,last_tx_id) values (?,?) ON DUPLICATE KEY UPDATE last_tx_id = ?";

        let block_num = blockInfo.block_num;
        let total_sun = 0;
        let payout_sun = 0;
        let play_times = 0;
        let win_times = 0;
        let txs_count = 0;
        let block_ts = blockInfo.block_ts;

        let playersThisBlock = new Map();

        for (let key in txs) {
            txs_count = txs_count + 1;
            let txInfo = txs[key];
            if (txInfo.state !== 1) {
                continue;
            }
            // loggerDefault.info("!!!!", txInfo.txID);
            let tx_id = txInfo.txID;

            //交易数据入库
            await db.execTrans(sqlTx, [txInfo.blockNumber, tx_id, (txInfo.result === "SUCCESS" ? 1 : 0), txInfo.energy_usage_total, txInfo.net_fee], conn);

            //日志入库
            let logs = txInfo.logs;
            if (logs) {
                for (let log of logs) {
                    // loggerDefault.info("log", log);
                    if (log._type === "bet_result") {
                        let _ver = log._ver;
                        let _addr = log._bettor;
                        let _order_id = log._orderId;
                        let _number = log._number;
                        let _direction = log._direction;
                        let _amount = log._amount;
                        let _payout = log._winAmount;
                        let _mentor = log._mentor;
                        let _referralAmount = log._referralAmount;

                        let _roll = log._roll;
                        if (_ver === 0 && _roll === 0) { //容错 roll === 0 的bug,只记录交易，不记录日志，不记入玩家统计，不记入区块统计
                            await db.execTrans(
                                "insert into dice_events_roll_0 (addr,order_id,direction,number,roll,amount_sun,payout_sun,mentor,referral_sun,tx_id) values (?,?,?,?,?,?,?,?,?,?)",
                                [_addr, _order_id, _direction, _number, _roll, _amount, _payout, _mentor, _referralAmount, tx_id], conn);
                            continue;
                        }

                        //日志数据入库
                        await db.execTrans(
                            "insert into dice_events_v" + _ver + " (addr,order_id,direction,number,roll,amount_sun,payout_sun,mentor,referral_sun,tx_id) values (?,?,?,?,?,?,?,?,?,?)",
                            [_addr, _order_id, _direction, _number, _roll, _amount, _payout, _mentor, _referralAmount, tx_id], conn);

                        //统计当前区块玩家数据
                        let p = playersThisBlock.get(_addr);
                        if (p) {
                            p.total = (new BigNumber(p.total)).plus(_amount).toString();
                            p.payout = (new BigNumber(p.payout)).plus(_payout).toString();
                            p.referral = (new BigNumber(p.referral)).plus(_referralAmount).toString();
                            p.play_times = p.play_times + 1;
                            p.win_times = p.win_times + (_payout > 0 ? 1 : 0);

                            if (_payout > 0 && _referralAmount > 0 && _mentor !== "") { //赢的记录了正确的推荐人,避免负的记录覆盖推荐人信息
                                p.mentor = _mentor;
                            }
                        } else {
                            playersThisBlock.set(_addr, {
                                total: _amount,
                                payout: _payout,
                                referral: _referralAmount,
                                play_times: 1,
                                win_times: (_payout > 0 ? 1 : 0),
                                mentor: _mentor
                            });
                        }
                    } else if (log._type === "bet_mine_result") {
                        // 扫雷下注信息解析保存
                        //日志数据入库
                        const insertSQL = 'insert into mine_event_log ' +
                            '(tx_id, addr, amount, win_amount, mentor_addr, mentor_rate, order_id, order_state, order_ts, ' +
                            ' order_block_height, order_finish_block_height, mode, mine_region_height, mine_region_width) ' +
                            " values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                        const params = [tx_id, log.addr, log.amount, log.win_amount, log.mentor_addr,
                            log.mentor_rate, log.order_id, log.order_state, log.order_ts, log.order_block_height,
                            log.order_finish_block_height, log.mode, log.mine_region_height, log.mine_region_width]
                        await db.execTrans(insertSQL, params, conn);
                        if(log.win_amount > 0){
                            let userMineContent = await redis.hget(MINE_REDIS_PREFIX_KEY+log.addr, log.order_id)
                            if(userMineContent && userMineContent.length !== 0){
                                let userMineObject = JSON.parse(userMineContent)
                                userMineObject.winAmount = log.win_amount
                                userMineContent = JSON.stringify(userMineObject)
                                await redis.hset(MINE_REDIS_PREFIX_KEY + log.addr, log.order_id, userMineContent)
                                console.log('update user:%s win amount:%s', log.addr, log.win_amount)
                            }
                        }

                        // 发送信息
                        sendGameMsg(log.addr, log.order_id, log.amount);
                        // 统计当前区块玩家数据
                        let playerInfo = playersThisBlock.get(log.addr);
                        if (playerInfo) {
                            playerInfo.total = (new BigNumber(playerInfo.total)).plus(log.amount).toString();
                            playerInfo.payout = (new BigNumber(playerInfo.payout)).plus(log.amount).toString();
                            playerInfo.play_times = playerInfo.play_times + 1;
                            playerInfo.win_times = playerInfo.win_times + (log.win_amount > 0 ? 1 : 0);
                            playerInfo.mentor = log.mentor_addr;
                        } else {
                            playersThisBlock.set(log.addr, {
                                total: log.amount,
                                payout: log.amount,
                                play_times: 1,
                                win_times: (log.win_amount > 0 ? 1 : 0)
                            })
                        }
                    } else if (log._type === "ante_transfer_log") {
                        //转账数据入库
                        await db.execTrans(sqlTransfer, [log._to, tx_id, tx_id], conn);
                    } else if (log._type === "DiceDivideCreate") {
                        if (txInfo.result === "SUCCESS") {
                            let sqlDividendsInsert = "insert into dice_ver_v1 (ver,total_dice,total_trx,send_ts,div_state) values (?,?,?,?,?) ON DUPLICATE KEY UPDATE total_dice = ?,total_trx=?,send_ts=?,div_state=?";
                            await db.execTrans(sqlDividendsInsert,
                                [log.round, log.diceAmountTotal, log.trxAmountTotal, log.tmCreate, 1, log.diceAmountTotal, log.trxAmountTotal, log.tmCreate, 1], conn);
                            console.log("DiceDivideCreate", log);
                            redis.publish("tron_bet_dividends", JSON.stringify(log));
                        }
                    } else if (log._type === "DiceDivideComplete") {
                        if (txInfo.result === "SUCCESS") {
                            let sqlDividendsUpdate = "update dice_ver_v1 set div_state = 2 where ver = ?;";
                            await db.execTrans(sqlDividendsUpdate,
                                [log.round], conn);
                            console.log("DiceDivideComplete", log);
                            redis.publish("tron_bet_dividends", JSON.stringify(log));
                        }
                    } else if (log._type === "DiceDivideStep") {
                        if (txInfo.result === "SUCCESS") {
                            let sqlDividendsDetail = "insert into dice_dividends_v1 (ver,addr,dice,trx,total_trx,total_dice,state,tx_id) values (?,?,?,?,?,?,?,?);";
                            await db.execTrans(sqlDividendsDetail,
                                [log.round, log.owner, log.diceAmount, log.trxAmount, log.trxAmountTotal, log.diceAmountTotal, 3, tx_id], conn);
                            console.log("DiceDivideStep", log);
                            redis.publish("tron_bet_dividends", JSON.stringify(log));
                        }
                    } else if (log._type === "DividePlusCreate") {
                        if (txInfo.result === "SUCCESS") {
                            let sqlDividendsInsert = "insert into win_ver_v1 (ver,total_win,total_trx,send_ts,div_state) values (?,?,?,?,?) ON DUPLICATE KEY UPDATE total_win = ?,total_trx=?,send_ts=?,div_state=?";
                            await db.execTrans(sqlDividendsInsert,
                                [log.round, log.winAmountTotal, log.trxAmountTotal, log.tmCreate, 1, log.winAmountTotal, log.trxAmountTotal, log.tmCreate, 1], conn);
                            console.log("DividePlusCreate", log);
                            redis.publish("tron_bet_dividends", JSON.stringify(log));
                        }
                    } else if (log._type === "DividePlusComplete") {
                        if (txInfo.result === "SUCCESS") {
                            let sqlDividendsUpdate = "update win_ver_v1 set div_state = 2 where ver = ?;";
                            await db.execTrans(sqlDividendsUpdate,
                                [log.round], conn);
                            console.log("DividePlusComplete", log);
                            redis.publish("tron_bet_dividends", JSON.stringify(log));
                        }
                    } else if (log._type === "DividePlusStep") {
                        if (txInfo.result === "SUCCESS") {
                            let sqlDividendsDetail = "insert into win_dividends_v1 (ver,addr,win,trx,total_trx,total_win,state,tx_id) values (?,?,?,?,?,?,?,?);";
                            await db.execTrans(sqlDividendsDetail,
                                [log.round, log.owner, log.winAmount, log.trxAmount, log.trxAmountTotal, log.winAmountTotal, 3, tx_id], conn);
                            console.log("DividePlusStep", log);
                            redis.publish("tron_bet_dividends", JSON.stringify(log));
                        }
                    }
                }
            }
        }

        for (let [k, p] of playersThisBlock) {
            let addr = k;

            //统计当前区块合计
            total_sun = (new BigNumber(total_sun)).plus(p.total).toString();
            payout_sun = (new BigNumber(payout_sun)).plus(p.payout).toString();
            play_times = play_times + p.play_times;
            win_times = win_times + p.win_times;
            //统计当前区块合计

            //玩家统计数据入库
            if (p.payout > 0 && p.referral > 0 && p.mentor !== "") { //赢的记录了正确的推荐人
                await db.execTrans("INSERT INTO dice_players (addr,total,payout,play_times,win_times,mentor,referral,first_ts,lastest_ts) VALUES (?,?,?,?,?,?,?,?,0) ON DUPLICATE KEY UPDATE total = total+?,payout=payout+?,mentor=?,referral=referral+?,play_times=play_times+?,win_times=win_times+?,lastest_ts=?;",
                    [addr, p.total, p.payout, p.play_times, p.win_times, p.mentor, p.referral, block_ts, p.total, p.payout, p.mentor, p.referral, p.play_times, p.win_times, block_ts]
                    , conn);
            } else {
                await db.execTrans("INSERT INTO dice_players (addr,total,payout,play_times,win_times,first_ts,lastest_ts) VALUES (?,?,?,?,?,?,0) ON DUPLICATE KEY UPDATE total = total+?,payout=payout+?,play_times=play_times+?,win_times=win_times+?,lastest_ts=?;",
                    [addr, p.total, p.payout, p.play_times, p.win_times, block_ts, p.total, p.payout, p.play_times, p.win_times, block_ts]
                    , conn);
            }
        }
        //区块统计数据入库
        let preBlock = await db.execTrans("SELECT * from dice_block order by block_num desc limit 1;", null, conn);
        preBlock = preBlock[0];
        if (preBlock == null) {
            preBlock = {block_num: 0, all_bet_sun: 0, all_payout_sun: 0, all_play_times: 0, all_win_times: 0}
        }
        // if (preBlock.block_num !== 0 && preBlock.block_num + 1 !== block_num) {
        //     throw new Error("block is not contiune! pre:" + preBlock.block_num + " now:" + block_num);
        // }
        let all_bet_sun = (new BigNumber(preBlock.all_bet_sun)).plus(total_sun).toString();
        let all_payout_sun = (new BigNumber(preBlock.all_payout_sun)).plus(payout_sun).toString();
        let all_play_times = preBlock.all_play_times + play_times;
        let all_win_times = preBlock.all_win_times + win_times;
        await db.execTrans("INSERT INTO dice_block (block_num,total_sun,payout_sun,play_times,win_times,txs_count,block_ts,all_bet_sun,all_payout_sun,all_play_times,all_win_times) values (?,?,?,?,?,?,?,?,?,?,?);",
            [block_num, total_sun, payout_sun, play_times, win_times, txs_count, block_ts, all_bet_sun, all_payout_sun, all_play_times, all_win_times], conn);

        loggerDefault.info("    >> db save end! ===> 数据库耗时:" + (Date.now() - begin_ts) + " ms");

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

async function getMaxBlockNum() {
    let preBlock = await db.exec("SELECT * from dice_block order by block_num desc limit 1;", null, null);
    return preBlock[0] ? preBlock[0].block_num : 0;
}

/**
 * 活动配置
 * @type {*|number}
 */
const ACTIVITY_START_TS = config.event.ACTIVITY_START_TS || 0
const ACTIVITY_END_TS = config.event.ACTIVITY_END_TS || 0
const sendGameMsg = function (addr, order_id, trxAmount) {
    let _now = _.now();
    if (_now < ACTIVITY_START_TS || _now > ACTIVITY_END_TS) return;
    console.log('发送消息：'+JSON.stringify({addr: addr, order_id: order_id, amount: trxAmount, game_type: 10}))
    redis.publish("game_message", JSON.stringify({addr: addr, order_id: order_id, amount: trxAmount, game_type: 10}));
}

const sendMsgToClient = function (ctx, errno, errmsg, data) {
    data = data || {};
    let params = ctx.request.body;
    let result = {
        ReturnCode: errno,
        ApiVersion: params.ApiVersion || "",
        Request: params.Request || "",
        Message: errmsg,
        ...data
    };
    ctx.body = result;
}


module.exports.getMaxBlockNum = getMaxBlockNum;
module.exports.saveDB = saveDB;
