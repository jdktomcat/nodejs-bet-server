const {sequelize, rawQuery, updateQuery} = require('../utils/mysqlUtils')
const _ = require('lodash')._
const tokenParse = require("./../utils/tokenParse")

async function userAction(AccountId, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, action, AddsAmount, uid, currency) {
    //update balance
    await sequelize.transaction(async (t) => {
        if (action === 'bet') {
            let updateSql = "update live_balance set balance = balance - ? where uid = ? and currency = ?"
            await updateQuery(updateSql, [Amount * 1e6, uid, currency], t)
        } else if (action === 'result') {
            if (Amount > 0) {
                let updateSql = "update live_balance set balance = balance + ? where uid = ? and currency = ?"
                await updateQuery(updateSql, [Amount * 1e6, uid, currency], t)
            } else {
                console.log("lost,the amount is ", Amount * 1e6)
            }
        }
        let now = new Date().getTime()
        let sql = "insert into live_action_log_v2(addr, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, action, ts, AddsAmount, currency) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        await updateQuery(sql, [AccountId, RoundId, EMGameId, GPGameId, GPId, '' + TransactionId, RoundStatus, Amount, Device, txId, action, now, AddsAmount, currency], t)
    })
}

async function userRollBack(AccountId, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, action, uid, currency) {
    await sequelize.transaction(async (t) => {
        if (action == 'rbbet') {
            if (Amount > 0) {
                let updateSql = "update live_balance set balance = balance + ? where uid = ? and currency = ?"
                await updateQuery(updateSql, [Amount * 1e6, uid, currency], t)
            } else {
                console.log("lost,the amount is ", Amount * 1e6)
            }
        } else if (action == 'rbresult') {
            let updateSql = "update live_balance set balance = balance - ? where uid = ? and currency = ?"
            await updateQuery(updateSql, [Amount * 1e6, uid, currency], t)
        }
        let updateStatusSql = "update live_action_log_v2 set txStatus = txStatus - 1 where addr = ? and TransactionId = ?"
        await updateQuery(updateStatusSql, [AccountId, '' + TransactionId], t)
        //
        let sql = "insert into live_action_log_v2(addr, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, action, ts, currency) values(?,?,?,?,?,?,?,?,?,?,?,?,?)"
        let res = await updateQuery(sql, [AccountId, RoundId, EMGameId, GPGameId, GPId, 'rb' + TransactionId, RoundStatus, Amount, Device, txId, action, Date.now(), currency], t)
        return res
    })
}

async function getTransactionById(TransactionId) {
    let sql = "select * from live_action_log_v2 where TransactionId = ?"
    return await rawQuery(sql, ['' + TransactionId])
}


async function getAccountBySessionId(sessionId) {
    const {error,info} = tokenParse(sessionId)
    if(error){
        return []
    }
    const addr = info.addr
    const currency = info.currency
    let sql = "select t1.*  from live_account as t1 left join live_balance as t2 on t1.uid = t2.uid where t1.uid = t2.uid and t2.addr = ? and t2.currency = ?"
    let res = await rawQuery(sql, [addr,currency])
    return res
}

async function getUserActionLog(addr, actionId) {
    let sql = "select * from live_action_log_v2 where addr = ? and actionId = ?"
    let res = await rawQuery(sql, [addr, actionId])
    return res
}


async function getUserIdByIssuseId(issuseId) {
    let sql = "select addr from live_freespins where issuseId = ?"
    let res = await rawQuery(sql, [issuseId])
    return res
}


async function getUserBalanceByCurrency(uid, currency) {
    let sql = "select round(balance / 1000000, 3) balance from live_balance where uid = ? and currency = ?"
    let res = await rawQuery(sql, [uid, currency])
    if (_.isEmpty(res)) return 0
    return res[0].balance || 0
}

async function getAccountrByEmail(email) {
    let sql = "select * from live_account where email = ?"
    return await rawQuery(sql, [email])
}

module.exports = {
    userAction,
    userRollBack,
    getAccountBySessionId,
    getUserActionLog,
    getUserIdByIssuseId,
    getTransactionById,
    getUserBalanceByCurrency,
    getAccountrByEmail
}