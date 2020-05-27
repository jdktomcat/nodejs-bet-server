const rawQuery = require('../utils/dbUtil')
const live_wallet = require('./../utils/live_wallet');

async function getUserBalance(addr) {
    let sql = "select round(trx / 1000000, 3) as trx from live_user where addr = ?"
    let res = await rawQuery(sql, [addr])
    if (res.length > 0) {
        return res[0].trx
    }
    return null
}

async function userBet(transactionId, uid, email, round, isFree, gameId, currency, bet, amount, adAmount) {
    await live_wallet.decreaseBalance({
        uid: uid,
        currency: currency,
        amount: amount,
    })
    let now = new Date().getTime()
    let sql = "insert into swagger_transaction_log(transactionId, uid, email, round, isFree, gameId, currency, bet, amount, adAmount, resultTxId, ts, status) values(?,?,?,?,?,?,?,?,?,?,?,?,'2')"
    let res = await rawQuery(sql, [transactionId, uid, email, round, isFree, gameId, currency, bet, amount, adAmount, transactionId, now])
    return res
}

async function userWin(uid, currency, resultTxId, transactionId, amount) {
    if (amount > 0) {
        await live_wallet.increaseBalance({
            uid: uid,
            currency: currency,
            amount: amount,
        })
    }
    let sql = "update swagger_transaction_log set resultTxId = ?, win = ?, status = '1' where transactionId = ? and status = '2' "
    let res = await rawQuery(sql, [resultTxId, amount, transactionId])
    return res
}

async function userRollBack(uid, currency, resultTxId, transactionId, amount) {
    if (amount > 0) {
        await live_wallet.increaseBalance({
            uid: uid,
            currency: currency,
            amount: amount,
        })
    }
    let sql = "update swagger_transaction_log set resultTxId = ?, status = '0' where transactionId = ? and status = '2' "
    let res = await rawQuery(sql, [resultTxId, transactionId])
    return res
}

async function getTransactionById(TransactionId) {
    let sql = "select * from swagger_transaction_log where transactionId = ? and status = '2' "
    return await rawQuery(sql, ['' + TransactionId])
}

async function getAccountBySessionId(sessionId) {
    let sql = "select * from live_account where sessionId = ?"
    let res = await rawQuery(sql, [sessionId])
    return res
}

async function getUserBalanceByCurrency(uid, currency) {
    let sql = "select round(balance / 10, 3) balance from live_balance where uid = ? and currency = ?"
    let res = await rawQuery(sql, [uid, currency])
    if(res.length === 0){
        return 0
    }else {
        return Number(Math.floor(res[0].balance)) || 0
    }
}

module.exports = {
    getUserBalance,
    userWin,
    userBet,
    userRollBack,
    getAccountBySessionId,
    getTransactionById,
    getUserBalanceByCurrency,
}