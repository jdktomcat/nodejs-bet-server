const db = require('../utils/dbUtil')
const _ = require('lodash')._
const live_wallet = require('./../utils/live_wallet');
const dividendsDuration = 86400
const daystart = 18005

async function getUserBalance(addr) {
    let sql = "select round(trx / 1000000, 3) as trx from live_user where addr = ?"
    let res = await db.exec(sql, [addr])
    if (!_.isEmpty(res)) {
        return res[0].trx
    }
    return null
}

async function getUserBalanceBySessionId(sessionId) {
    let sql = "select round(trx / 1000000, 3) as trx from live_user where sessionId = ?"
    let res = await db.exec(sql, [sessionId])
    console.log(res)
    if (!_.isEmpty(res)) {
        return res[0].trx
    }
    return null
}

async function userBet(transactionId, uid, email, round, isFree, gameId, currency, bet, amount, adAmount, conn) {
    //update balance
    // let updateSql = "update live_balance set balance = balance - ? where uid = ? and currency = ?"
    // await db.execTrans(updateSql, [amount, uid, currency], conn)
    await live_wallet.decreaseBalance({
        uid: uid,
        currency: currency,
        amount: amount,
    })

    let now = new Date().getTime()
    let sql = "insert into swagger_transaction_log(transactionId, uid, email, round, isFree, gameId, currency, bet, amount, adAmount, resultTxId, ts, status) values(?,?,?,?,?,?,?,?,?,?,?,?,'2')"
    let res = await db.execTrans(sql, [transactionId, uid, email, round, isFree, gameId, currency, bet, amount, adAmount, transactionId, now], conn)
    return res
}

async function userWin(uid, currency, resultTxId, transactionId, amount, conn) {
    //update balance
    // let updateSql = "update live_balance set balance = balance + ? where uid = ? and currency = ?"
    // await db.execTrans(updateSql, [amount, uid, currency], conn)
    if(amount > 0){
        await live_wallet.increaseBalance({
            uid: uid,
            currency: currency,
            amount: amount,
        })
    }

    let now = new Date().getTime()
    let sql = "update swagger_transaction_log set resultTxId = ?, win = ?, status = '1' where transactionId = ? and status = '2' "
    let res = await db.execTrans(sql, [resultTxId, amount, transactionId], conn)
    return res
}

async function userRollBack(uid, currency, resultTxId, transactionId, amount, conn) {

    // let updateSql = "update live_balance set balance = balance + ? where uid = ? and currency = ?"
    // await db.execTrans(updateSql, [amount, uid, currency], conn)
    if(amount > 0){
        await live_wallet.increaseBalance({
            uid: uid,
            currency: currency,
            amount: amount,
        })
    }

    let now = new Date().getTime()
    let sql = "update swagger_transaction_log set resultTxId = ?, status = '0' where transactionId = ? and status = '2' "
    let res = await db.execTrans(sql, [resultTxId, transactionId], conn)
    return res
}

async function getTransactionById(TransactionId) {
    let sql = "select * from swagger_transaction_log where transactionId = ? and status = '2' "
    return await db.exec(sql, ['' + TransactionId])
}

async function getAccountBySessionId(sessionId) {
    let sql = "select * from live_account where sessionId = ?"
    let res = await db.exec(sql, [sessionId])
    return res
}

async function getUserActionLog(adrr, actionId) {
    let sql = "select * from live_action_log_v2 where addr = ? and actionId = ?"
    let res = await db.exec(sql, [addr, actionId])
    return res
}


async function getUserIdByIssuseId(issuseId) {
    let sql = "select addr from live_freespins where issuseId = ?"
    let res = await db.exec(sql, [issuseId])
    return res
}


async function getUserBalanceByCurrency(uid, currency) {
    let sql = "select round(balance / 10, 3) balance from live_balance where uid = ? and currency = ?"
    let res = await db.exec(sql, [uid, currency])
    if(_.isEmpty(res)) return 0
    return Number(Math.floor(res[0].balance)) || 0
}

async function getAccountrByEmail(email) {
    let sql = "select * from live_account where email = ?"
    return await db.exec(sql, [email])
}

module.exports = {
    getUserBalance,
    getUserBalanceBySessionId,
    userWin,
    userBet,
    userRollBack,
    getAccountBySessionId,
    getUserActionLog,
    getUserIdByIssuseId,
    getTransactionById,
    getUserBalanceByCurrency,
    getAccountrByEmail
}