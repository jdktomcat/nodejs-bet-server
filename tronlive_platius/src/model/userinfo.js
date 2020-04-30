const db = require('../utils/dbUtil')
const config = require('../configs/config')
const _ = require('lodash')._
const jwt = require('jsonwebtoken');

async function getBalance(params) {
    const {addr,currency} = params
    const sqlUid = 'select uid from tron_live.live_account where email = ?'
    let uidArray = await db.exec(sqlUid, [addr])
    if(uidArray.length === 0){
        throw new Error("user not found")
    }
    const uid = uidArray[0].uid
    //
    let sql = "select round(balance / 1000000, 3) as balance from tron_live.live_balance where uid = ? and currency = ? and addr = ?"
    let res = await db.exec(sql, [uid, currency,addr])
    console.log("rs is ", res)
    if (res.length === 0) {
        throw new Error("user not found")
    }
    let balance = res[0].balance || 0
    return balance
}

function checkToken(token) {
    try {
        const secretKey = config.Platinus.secretKey
        if(secretKey === undefined){
            return {
                tokenError: true,
                tokenInfo: {}
            }
        }
        const payload = jwt.verify(token, secretKey)
        // console.log("payload: ", payload)
        return {
            tokenError: false,
            tokenInfo: payload
        }
    } catch (e) {
        console.log("token is: ", token)
        console.log("token is error: ", e)
        return {
            tokenError: true,
            tokenInfo: {}
        }
    }
}

async function parseToken(tokenInfo, currency) {
    const {addr} = tokenInfo
    const sqlUid = 'select uid from tron_live.live_account where email = ?'
    let uidArray = await db.exec(sqlUid, [addr])
    if(uidArray.length === 0){
        throw new Error("user not found")
    }
    const uid = uidArray[0].uid
    //
    let sql = "select * from tron_live.live_balance where uid = ? and addr = ? and currency = ?"
    let res = await db.exec(sql, [uid, addr, currency])
    let notExist = false
    let balance = 0
    if (res.length !== 1) {
        notExist = true
    } else {
        balance = res[0].balance || 0
    }
    const o = {uid, addr, notExist, balance}
    return o
}

async function userAction(params) {
    //update balance
    let updateSql = "update tron_live.live_balance set balance = balance - ? where uid = ? and currency = ?"
    if (params.type === 'result') {
        updateSql = "update tron_live.live_balance set balance = balance + ? where uid = ? and currency = ?"
    }
    await db.exec(updateSql, [params.amount, params.uid, params.currency])
    //
    if(params.type === 'bet'){
        let sql = "insert into tron_live.platipus_transaction_log(transaction_id,round_id, game_id, game_name, addr, uid, amount,currency,adAmount, ts) values(?,?,?,?,?,?,?,?,?,?)"
        const sqlParam = [
            params.transaction_id,
            params.round_id,
            params.game_id,
            params.game_name,
            params.addr,
            params.uid,
            params.amount,
            params.currency,
            params.adAmount,
            Date.now()
        ]
        await db.exec(sql, sqlParam)
    }else if(params.type === 'result'){
        let sql = "update tron_live.platipus_transaction_log set resultId = ? , win = ?, status = 2 where round_id = ? and addr = ?"
        const sqlParam = [
            params.transaction_id,
            params.amount,
            params.round_id,
            params.addr,
        ]
        await db.exec(sql, sqlParam)
    }
}


async function rollback(params) {
    //update balance
    let updateSql = "update tron_live.live_balance set balance = balance - ? where uid = ? and currency = ?"
    if (params.type === 'rollback' && params.amount > 0) {
        updateSql = "update tron_live.live_balance set balance = balance + ? where uid = ? and currency = ?"
    }
    await db.exec(updateSql, [params.amount, params.uid, params.currency])
    //
    let sqlReset = "update tron_live.platipus_transaction_log set status = 0 where round_id = ? and addr = ?"
    const sqlResetParam = [
        params.round_id,
        params.addr,
    ]
    await db.exec(sqlReset, sqlResetParam)
}


async function queryTxIfExist(params) {
    let sql = "select count(1) as count from tron_live.platipus_transaction_log where transaction_id = ? and status = 1"
    const sqlResetParam = [
        params.transaction_id,
    ]
    const rs = await db.exec(sql, sqlResetParam)
    if(rs.length > 0){
        const tmp = rs[0] || {}
        const num = tmp.count || 0
        if(num === 1){
            return true
        }
    }
    return false
}


const execBet = async function (params) {
    try {
        await userAction(params);
    } catch (error) {
        throw error
    }
}

const execRollBack = async function (params) {
    try {
        await rollback(params);
    } catch (error) {
        throw error
    }
}

module.exports = {
    getBalance,
    execBet,
    execRollBack,
    checkToken,
    parseToken,
    queryTxIfExist,
}