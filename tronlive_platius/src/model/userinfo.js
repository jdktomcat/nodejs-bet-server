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
    let sql = "select round(balance / 1000000, 3) as balance from tron_live.live_balance where uid = ? and currency = ?"
    let res = await db.exec(sql, [uid, currency])
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
        const payload = jwt.verify(token, secretKey)
        console.log("secretKey: ", secretKey)
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

async function userAction(params, conn) {
    //update balance
    let updateSql = "update tron_live.live_balance set balance = balance - ? where uid = ? and currency = ?"
    if (params.type === 'result') {
        updateSql = "update tron_live.live_balance set balance = balance + ? where uid = ? and currency = ?"
    }
    await db.execTrans(updateSql, [params.amount, params.uid, params.currency], conn)
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
        await db.execTrans(sql, sqlParam, conn)
    }else if(params.type === 'result'){
        let sql = "update tron_live.platipus_transaction_log set resultId = ? , win = ? where round_id = ? and addr = ?"
        const sqlParam = [
            params.transaction_id,
            params.amount,
            params.round_id,
            params.addr,
        ]
       const rs = await db.execTrans(sql, sqlParam, conn)
    }
}


async function rollback(params, conn) {
    //update balance
    let updateSql = "update tron_live.live_balance set balance = balance - ? where uid = ? and currency = ?"
    if (params.type === 'rollback' && params.amount > 0) {
        updateSql = "update tron_live.live_balance set balance = balance + ? where uid = ? and currency = ?"
    }
    await db.execTrans(updateSql, [params.amount, params.uid, params.currency], conn)
    //
    let sqlReset = "update tron_live.platipus_transaction_log set status = 0 where round_id = ? and addr = ?"
    const sqlResetParam = [
        params.round_id,
        params.addr,
    ]
    await db.execTrans(sqlReset, sqlResetParam, conn)
}


const execBet = async function (params) {
    let conn = null;
    try {
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("unknown failed")
        }
        conn.beginTransaction();
        await userAction(params, conn);
        conn.commit();
    } catch (error) {
        throw error
    } finally {
        if (conn) conn.release();
    }
}

const execRollBack = async function (params) {
    let conn = null;
    try {
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("unknown failed")
        }
        conn.beginTransaction();
        await rollback(params, conn);
        conn.commit();
    } catch (error) {
        throw error
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    getBalance,
    execBet,
    execRollBack,
    checkToken,
    parseToken,
}