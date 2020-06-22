// const db = require('../utils/dbUtil');
const {rawQuery, updateQuery, sequelize} = require('../utils/mysqlUtils');
const redisUtil = require('../utils/redisUtil');
const _ = require('lodash')._;
const tranStatus = require('../configs/config').tranStatus;
const config = require('../configs/config');

async function getUserByKey(key) {
    let sql = 'select * from live_account where userKey = ? limit 1';
    let res = await rawQuery(sql, [key]);
    return res;
}

async function updateSportsSessionByKey(sessionId, key) {
    let now = new Date().getTime();
    let sql = 'update live_account set sportsSession = ? where userKey = ?';
    let res = await updateQuery(sql, [sessionId, key]);
    return res;
}

async function lockTxByKey(key) {
    // 并发限制
    let oneUserLimit = await redisUtil.hget(key, 'sportLimit');
    console.log("lock key is ", key)
    console.log("oneUserLimit is ", oneUserLimit)
    if (oneUserLimit === "true") {
        throw Error("this user is busy, call api later please!")
    } else {
        await redisUtil.hset(key, 'sportLimit', "true");
    }
}


async function freeLockTxByKey(key) {
    // 并发限制
    console.log("unlocklock key is ", key)
    await redisUtil.hset(key, 'sportLimit', "false");
}

async function userBet(tsp, blp) {
    /**
     * 开启事务 202020601
     */
    const key = "sport_user:bet:" + tsp.uid
    await lockTxByKey(key)
    //

    try {
        await sequelize.transaction(async (t) => {
            //update balance
            let updateSql = 'update live_balance set balance = balance - ? where uid = ? and currency = ?';
            await updateQuery(updateSql, [tsp.amount, tsp.uid, tsp.currency], t);

            let transSql =
                'insert into sports_transaction_log(addr, transactionId, betslipId, ts, status, amount, crossRateEuro, action, currency, adAmount) \
                                            values(?,?,?,?,?,?,?,?,?,?)';
            await updateQuery(
                transSql,
                [
                    tsp.addr,
                    tsp.transactionId,
                    tsp.betslipId,
                    tsp.ts,
                    tranStatus.bet,
                    tsp.amount,
                    tsp.crossRateEuro,
                    tsp.action,
                    tsp.currency,
                    tsp.adAmount
                ],
                t
            );

            // send game msg
            sendGameMsg(tsp.addr, tsp.betslipId, tsp.amount, tsp.currency)

            let betLogSql =
                'insert into sports_bet_detail_log(addr, transactionId, betslipId, currency, sumAmount, types, betK, betId, sportId, eventId, tournamentId, \
                    categoryId, live, competitorName, outcomeName, scheduled, odds) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

            // let blparmas = [];
            for (let one of blp) {
                const detail_params = [
                    one.addr,
                    one.transactionId,
                    one.betslipId,
                    one.currency,
                    one.sumAmount,
                    one.types,
                    one.betK,
                    one.betId,
                    one.sportId,
                    one.eventId,
                    one.tournamentId,
                    one.categoryId,
                    one.live,
                    one.competitorName,
                    one.outcomeName,
                    one.scheduled,
                    one.odds
                ]
                await updateQuery(betLogSql, detail_params, t);
            }
        })
    } catch (e) {
        await freeLockTxByKey(key)
        console.log(key + "_error : ", e.toString())
        throw e
    }
    // unlock key
    await freeLockTxByKey(key)
}

let ACTIVITY_START_TS = config.event.ACTIVITY_START_TS || 0;
let ACTIVITY_END_TS = config.event.ACTIVITY_END_TS || 0;
function sendGameMsg(addr, order_id, trxAmount, currency) {
    let _now = _.now();
    if (_now < ACTIVITY_START_TS || _now > ACTIVITY_END_TS || currency !== 'TRX') return;
    redisUtils.redis.publish("game_message", JSON.stringify({ addr: addr, order_id: order_id, amount: trxAmount / 1000000, game_type: 6 }));
}

async function userRefund(params) {
    /**
     * 开启事务 202020601
     */
    const key = "sport_user:refund:" + params.uid
    await lockTxByKey(key)
    //
    try {
        await sequelize.transaction(async (t) => {
            let updateSql = 'update live_balance set balance = balance + ? where uid = ? and currency = ?';
            await updateQuery(updateSql, [params.amount, params.uid, params.currency], t);

            let updateTransactionSql =
                'update sports_transaction_log set status = ? where transactionId = ? and addr = ? and status <> ? and status <> ?';
            await updateQuery(
                updateTransactionSql,
                [tranStatus.refund, params.betTransactionId, params.addr, tranStatus.refund, tranStatus.rollback],
                t
            );

            let addLogSql =
                'insert into sports_result_log(addr, transactionId, betTransactionId, betslipId, ts, status, amount, action, currency) values (?,?,?,?,?,?,?,?,?)';
            await updateQuery(
                addLogSql,
                [
                    params.addr,
                    params.transactionId,
                    params.betTransactionId,
                    params.betslipId,
                    params.ts,
                    tranStatus.refund,
                    params.amount,
                    params.action,
                    params.currency
                ],
                t
            );
        })
    } catch (e) {
        await freeLockTxByKey(key)
        console.log(key + "_error : ", e.toString())
        throw e
    }
    // unlock key
    await freeLockTxByKey(key)
}

async function userWin(params) {
    /**
     * 开启事务 202020601
     */
    const key = "sport_user:win:" + params.uid
    await lockTxByKey(key)
    try {
        await sequelize.transaction(async (t) => {
            let updateSql = 'update live_balance set balance = balance + ? where uid = ? and currency = ?';
            await updateQuery(updateSql, [params.amount, params.uid, params.currency], t);

            let updateTransactionSql =
                'update sports_transaction_log set status = ?, win = ? where transactionId = ? and addr = ?';
            await updateQuery(updateTransactionSql, [tranStatus.win, params.amount, params.betTransactionId, params.addr], t);

            let addLogSql =
                'insert into sports_result_log(addr, transactionId, betTransactionId, betslipId, ts, status, amount, action, currency) values (?,?,?,?,?,?,?,?,?)';
            await updateQuery(
                addLogSql,
                [
                    params.addr,
                    params.transactionId,
                    params.betTransactionId,
                    params.betslipId,
                    params.ts,
                    tranStatus.win,
                    params.amount,
                    params.action,
                    params.currency
                ],
                t
            );
        })
    } catch (e) {
        await freeLockTxByKey(key)
        console.log(key + "_error : ", e.toString())
        throw e
    }
    // unlock key
    await freeLockTxByKey(key)
}

async function userDiscard(params) {
    /**
     * 开启事务 202020601
     */
    const key = "sport_user:discard:" + params.uid
    await lockTxByKey(key)
    try {
        await sequelize.transaction(async (t) => {
            let updateSql = 'update live_balance set balance = balance + ? where uid = ? and currency = ?';
            await updateQuery(updateSql, [params.amount, params.uid, params.currency], t);

            let updateTransactionSql =
                'update sports_transaction_log set status = ?, win = ? where transactionId = ? and addr = ?';
            await updateQuery(updateTransactionSql, [53, params.amount, params.betTransactionId, params.addr], t);
        })
    } catch (e) {
        await freeLockTxByKey(key)
        console.log(key + "_error : ", e.toString())
        throw e
    }
    // unlock key
    await freeLockTxByKey(key)
}

async function userCancel(params) {
    /**
     * 开启事务 202020601
     */
    const key = "sport_user:cancel:" + params.uid
    await lockTxByKey(key)
    try {
        await sequelize.transaction(async (t) => {
            let updateSql = 'update live_balance set balance = balance - ? where uid = ? and currency = ?';
            await updateQuery(updateSql, [params.amount, params.uid, params.currency], t);

            let updateTransactionSql =
                'update sports_transaction_log set status = ? where transactionId = ? and addr = ? and status = ?';
            await updateQuery(
                updateTransactionSql,
                [tranStatus.cancel, params.betTransactionId, params.addr, tranStatus.win],
                t
            );

            let addLogSql =
                'insert into sports_result_log(addr, transactionId, betTransactionId, betslipId, ts, status, amount, action, currency, reason) values (?,?,?,?,?,?,?,?,?,?)';
            await updateQuery(
                addLogSql,
                [
                    params.addr,
                    params.transactionId,
                    params.betTransactionId,
                    params.betslipId,
                    params.ts,
                    tranStatus.cancel,
                    params.amount,
                    params.action,
                    params.currency,
                    params.reason
                ],
                t
            );
        })
    } catch (e) {
        await freeLockTxByKey(key)
        console.log(key + "_error : ", e.toString())
        throw e
    }
    // unlock key
    await freeLockTxByKey(key)
}

async function userBetSettle(tronsactionId, state) {
    await sequelize.transaction(async (t) => {
        let now = new Date().getTime();
        let sql = 'update sports_transaction_log set status = ?, ts = ? where transactionId = ?';
        let status = -1;
        if (state == 'win') {
            status = tranStatus.win;
        } else if (state == 'lost') {
            status = tranStatus.lost;
        } else if (state == 'refund') {
            status = tranStatus.refund;
        } else if (state == 'cancel') {
            status = tranStatus.cancel;
        } else if (state == 'rollback') {
            status = tranStatus.rollback;
        }
        await updateQuery(sql, [status, now, tronsactionId], t);
    })
}

async function userRollBack(params) {
    /**
     * 开启事务 202020601
     */
    const key = "sport_user:rollback:" + params.uid
    await lockTxByKey(key)
    try {
        await sequelize.transaction(async (t) => {
            let updateSql = 'update live_balance set balance = balance - ? where uid = ? and currency = ?';
            await updateQuery(updateSql, [params.amount, params.uid, params.currency], t);

            let updateTransactionSql = 'update sports_transaction_log set status = ? where transactionId = ? and addr = ?';
            await updateQuery(updateTransactionSql, [tranStatus.rollback, params.betTransactionId, params.addr], t);

            let addLogSql =
                'insert into sports_result_log(addr, transactionId, betTransactionId, betslipId, ts, status, amount, action, currency, reason) values (?,?,?,?,?,?,?,?,?,?)';
            await updateQuery(
                addLogSql,
                [
                    params.addr,
                    params.transactionId,
                    params.betTransactionId,
                    params.betslipId,
                    params.ts,
                    tranStatus.rollback,
                    params.amount,
                    params.action,
                    params.currency,
                    params.reason
                ],
                t
            );
        })
    } catch (e) {
        await freeLockTxByKey(key)
        console.log(key + "_error : ", e.toString())
        throw e
    }
    // unlock key
    await freeLockTxByKey(key)
}

async function getTransactionById(transactionId) {
    let sql = 'select * from sports_transaction_log where transactionId = ?';
    return await rawQuery(sql, [transactionId]);
}

async function getTransactionByIdAndStatus(transactionId, status) {
    let sql = 'select * from sports_transaction_log where transactionId = ? and status = ?';
    return await rawQuery(sql, [transactionId, status]);
}

async function getAccountBySportsSessionId(sessionId) {
    let sql = 'select * from live_account where sportsSession = ?';
    let res = await rawQuery(sql, [sessionId]);
    return res;
}

async function getUserBalanceByCurrency(uid, currency) {
    let sql = 'select round(balance / 1000000, 3) balance from live_balance where uid = ? and currency = ?';
    let res = await rawQuery(sql, [uid, currency]);
    if (_.isEmpty(res)) return 0;
    return res[0].balance || 0;
}

async function getAccountByEmail(email) {
    let sql = 'select * from live_account where email = ?';
    return await rawQuery(sql, [email]);
}

async function getTRXPrice(currency) {
    if (currency == 'TRX') return 1;
    if (currency == 'USDT') {
        let sql = `SELECT count FROM tron_price.TRX_USD ORDER BY last_updated DESC LIMIT 1`;
        let res = await rawQuery(sql);
        if (!_.isEmpty(res)) {
            return res[0].count;
        }
    }
    return 1;
}

module.exports = {
    userBet,
    userRollBack,
    getAccountBySportsSessionId,
    getTransactionById,
    userRefund,
    userBetSettle,
    userWin,
    userCancel,
    getTransactionByIdAndStatus,
    getUserByKey,
    updateSportsSessionByKey,
    userDiscard,
    getUserBalanceByCurrency,
    getAccountByEmail,
    getTRXPrice
};
