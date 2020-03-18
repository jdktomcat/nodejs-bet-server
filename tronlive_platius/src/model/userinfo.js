const db = require('../utils/dbUtil')
const config = require('../configs/config')
const _ = require('lodash')._
const jwt = require('jsonwebtoken');

async function getBalance(tokenInfo, currency) {
    const {uid, addr} = tokenInfo
    let sql = "select round(balance / 1000000, 3) as balance from live_balance where uid = ? and addr = ? and currency = ?"
    let res = await db.exec(sql, [uid, addr, currency])
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
    const {uid, addr} = tokenInfo
    let sql = "select * from live_balance where uid = ? and addr = ? and currency = ?"
    let res = await db.exec(sql, [uid, addr, currency])
    let notExist = false
    let balance = 0
    if (res.length !== 1) {
        notExist = true
    } else {
        balance = res[0].balance || 0
    }
    const o = Object.assign({}, tokenInfo, {notExist, currency, balance})
    return o
}

async function userAction(params, conn) {
    //update balance
    let updateSql = "update live_balance set balance = balance - ? where uid = ? and currency = ?"
    if (params.type === 'result') {
        updateSql = "update live_balance set balance = balance + ? where uid = ? and currency = ?"
    }
    await db.execTrans(updateSql, [params.amount, params.uid, params.currency], conn)
    //
    let sql = "insert into platipus_transaction_log(transaction_id,round_id, game_id, game_name, type, addr, uid, amount,currency,adAmount, ts) values(?,?,?,?,?,?,?,?,?,?,?)"
    const sqlParam = [
        params.transaction_id,
        params.round_id,
        params.game_id,
        params.game_name,
        params.type,
        params.addr,
        params.uid,
        params.amount,
        params.currency,
        params.adAmount,
        Date.now()
    ]
    let res = await db.execTrans(sql, sqlParam, conn)
    return res
}


async function rollback(params, conn) {
    //update balance
    let updateSql = "update live_balance set balance = balance - ? where uid = ? and currency = ?"
    if (params.type === 'rollback' && params.amount > 0) {
        updateSql = "update live_balance set balance = balance + ? where uid = ? and currency = ?"
    }
    await db.execTrans(updateSql, [params.amount, params.uid, params.currency], conn)
    //
    let sql = "insert into platipus_transaction_log(transaction_id,round_id, game_id, game_name, type, addr, uid, amount,currency, adAmount,status, ts) values(?,?,?,?,?,?,?,?,?,?,?)"
    const sqlParam = [
        params.transaction_id,
        params.round_id,
        params.game_id,
        params.game_name,
        params.type,
        params.addr,
        params.uid,
        params.amount,
        params.currency,
        params.adAmount,
        "0",
        Date.now()
    ]
    let res = await db.execTrans(sql, sqlParam, conn)
    return res
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
        console.error(error);
        if (conn) conn.release();
        if (error.code !== "ER_DUP_ENTRY") {
            throw new Error("Insufficient funds")
        }
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
        console.error(error);
        if (conn) conn.release();
        if (error.code !== "ER_DUP_ENTRY") {
            throw new Error("Insufficient funds")
        }
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