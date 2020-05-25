const db = require('../utils/dbUtil');
const live_wallet = require('../utils/live_wallet');
const _ = require('lodash')._;
const tranStatus = require('../configs/config').tranStatus;

async function getUserByKey(key) {
    let sql = 'select * from live_account where userKey = ? limit 1';
    let res = await db.exec(sql, [key]);
    return res;
}

async function updateSportsSessionByKey(sessionId, key) {
    let now = new Date().getTime();
    let sql = 'update live_account set sportsSession = ? where userKey = ?';
    let res = await db.exec(sql, [sessionId, key]);
    return res;
}

async function userBet(tsp, blp, conn) {
    await live_wallet.decreaseBalance({
        uid: tsp.uid,
        currency: tsp.currency,
        amount: tsp.amount,
    })


    let transSql =
        'insert into sports_transaction_log(addr, transactionId, betslipId, ts, status, amount, crossRateEuro, action, currency, adAmount) \
                                    values(?,?,?,?,?,?,?,?,?,?)';
    await db.execTrans(
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
        conn
    );

    let betLogSql =
        'insert into sports_bet_detail_log(addr, transactionId, betslipId, currency, sumAmount, types, betK, betId, sportId, eventId, tournamentId, \
            categoryId, live, competitorName, outcomeName, scheduled, odds) values ?';

    let blparmas = [];
    for (let one of blp) {
        blparmas.push([
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
        ]);
    }
    await db.execTrans1(betLogSql, [blparmas], conn);
}

async function userRefund(params, conn) {
    await live_wallet.increaseBalance({
        uid: params.uid,
        currency: params.currency,
        amount: params.amount,
    })

    let updateTransactionSql =
        'update sports_transaction_log set status = ? where transactionId = ? and addr = ? and status <> ? and status <> ?';
    await db.execTrans(
        updateTransactionSql,
        [tranStatus.refund, params.betTransactionId, params.addr, tranStatus.refund, tranStatus.rollback],
        conn
    );

    let addLogSql =
        'insert into sports_result_log(addr, transactionId, betTransactionId, betslipId, ts, status, amount, action, currency) values (?,?,?,?,?,?,?,?,?)';
    await db.execTrans(
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
        conn
    );
}

async function userWin(params, conn) {
    await live_wallet.increaseBalance({
        uid: params.uid,
        currency: params.currency,
        amount: params.amount,
    })

    let updateTransactionSql =
        'update sports_transaction_log set status = ?, win = ? where transactionId = ? and addr = ?';
    await db.execTrans(updateTransactionSql, [tranStatus.win, params.amount, params.betTransactionId, params.addr], conn);

    let addLogSql =
        'insert into sports_result_log(addr, transactionId, betTransactionId, betslipId, ts, status, amount, action, currency) values (?,?,?,?,?,?,?,?,?)';
    await db.execTrans(
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
        conn
    );
}

async function userDiscard(params, conn) {
    await live_wallet.increaseBalance({
        uid: params.uid,
        currency: params.currency,
        amount: params.amount,
    })

    let updateTransactionSql =
        'update sports_transaction_log set status = ?, win = ? where transactionId = ? and addr = ?';
    await db.execTrans(updateTransactionSql, [53, params.amount, params.betTransactionId, params.addr], conn);
}

async function userCancel(params, conn) {
    await live_wallet.decreaseBalance({
        uid: params.uid,
        currency: params.currency,
        amount: params.amount,
    })

    let updateTransactionSql =
        'update sports_transaction_log set status = ? where transactionId = ? and addr = ? and status = ?';
    await db.execTrans(
        updateTransactionSql,
        [tranStatus.cancel, params.betTransactionId, params.addr, tranStatus.win],
        conn
    );

    let addLogSql =
        'insert into sports_result_log(addr, transactionId, betTransactionId, betslipId, ts, status, amount, action, currency, reason) values (?,?,?,?,?,?,?,?,?,?)';
    await db.execTrans(
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
        conn
    );
}

async function userBetSettle(tronsactionId, state) {
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
    await db.exec(sql, [status, now, tronsactionId]);
}

async function userRollBack(params, conn) {
    await live_wallet.decreaseBalance({
        uid: params.uid,
        currency: params.currency,
        amount: params.amount,
    })

    let updateTransactionSql = 'update sports_transaction_log set status = ? where transactionId = ? and addr = ?';
    await db.execTrans(updateTransactionSql, [tranStatus.rollback, params.betTransactionId, params.addr], conn);

    let addLogSql =
        'insert into sports_result_log(addr, transactionId, betTransactionId, betslipId, ts, status, amount, action, currency, reason) values (?,?,?,?,?,?,?,?,?,?)';
    await db.execTrans(
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
        conn
    );
}

async function getTransactionById(transactionId) {
    let sql = 'select * from sports_transaction_log where transactionId = ?';
    return await db.exec(sql, [transactionId]);
}

async function getTransactionByIdAndStatus(transactionId, status) {
    let sql = 'select * from sports_transaction_log where transactionId = ? and status = ?';
    return await db.exec(sql, [transactionId, status]);
}

async function getAccountBySportsSessionId(sessionId) {
    let sql = 'select * from live_account where sportsSession = ?';
    let res = await db.exec(sql, [sessionId]);
    return res;
}

async function getUserBalanceByCurrency(uid, currency) {
    let sql = 'select round(balance / 1000000, 3) balance from live_balance where uid = ? and currency = ?';
    let res = await db.exec(sql, [uid, currency]);
    if (_.isEmpty(res)) return 0;
    return res[0].balance || 0;
}

async function getAccountByEmail(email) {
    let sql = 'select * from live_account where email = ?';
    return await db.exec(sql, [email]);
}

async function getTRXPrice(currency) {
    if (currency == 'TRX') return 1;
    if (currency == 'USDT') {
        let sql = `SELECT count FROM tron_price.TRX_USD ORDER BY last_updated DESC LIMIT 1`;
        let res = await db.exec(sql);
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
