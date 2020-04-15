const raw = require('../utils/dbUtil')
const config = require('../configs/config')
const _ = require('lodash')._
const jwt = require('jsonwebtoken');
const statusDict = {
    'refund': 'refund',
    'buy': 'buy',
    'close': 'close',
}

const kindDict = {
    1: 'call',
    2: 'put'
}

const expirationTypeDict = {
    1: 'turbo',
    2: 'binary',
}

async function getAllBalance(params) {
    const {addr, currency} = params
    let sql = "select addr as user,round(balance / 1000000, 3) as balance,currency from tron_live.live_balance where  addr = ?"
    let res = await raw(sql, [currency, addr])
    if (res.length === 0) {
        return Promise.reject(new Error("user not found"))
    }else {
        return res
    }
}

async function getBalance(params) {
    const {addr, currency} = params
    let sql = "select addr as user,round(balance / 1000000, 3) as balance,currency from tron_live.live_balance where currency = ? and addr = ?"
    let res = await raw(sql, [currency, addr])
    if (res.length === 0) {
        return Promise.reject(new Error("user not found"))
    }else {
        let balance = res[0] || {}
        return balance
    }
}

function checkToken(token) {
    const secretKey = config.Integration.secretKey
    if (secretKey === undefined) {
        return {
            tokenError: true,
            tokenInfo: {}
        }
    }
    const payload = jwt.verify(token, secretKey)
    console.log("secretKey: ", secretKey)
    console.log("payload: ", payload)
    return {
        tokenError: false,
        tokenInfo: payload
    }
}


async function buy(params) {
    let updateSql = "update tron_live.live_balance set balance = balance - ? where addr = ? and currency = ?"
    await raw(updateSql, [params.amount, params.addr, params.currency])
    //
    let sql = `
INSERT INTO tron_live.integration_transaction_log
(transaction_id, addr, asset, kind, amount, win, adAmount, currency, status, quote_open, quote_close, created_at, profitability, expiration_date, expiration_type)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
    const sqlParam = [
        params.transaction_id,
        params.addr,
        params.asset,
        kindDict[params.kind] || '',
        params.amount,
        params.win,
        params.adAmount,
        params.currency,
        statusDict.buy,
        params.quote_open,
        params.quote_close,
        params.created_at,
        params.profitability,
        params.expiration_date,
        expirationTypeDict[params.expiration_type] || ''
    ]
    await raw(sql, sqlParam)
    return 1
}

async function close(params) {
    let updateSql = "update tron_live.live_balance set balance = balance + ? where addr = ? and currency = ?"
    await raw(updateSql, [params.win, params.addr, params.currency])
    //
    let sql = `
update tron_live.integration_transaction_log set win = ? , status = ? where transaction_id = ? and addr = ? and currency = ?
        `
    const sqlParam = [
        params.win,
        statusDict.close,
        params.transaction_id,
        params.addr,
        params.currency,
    ]
    await raw(sql, sqlParam)
}


async function refund(params) {
    let updateSql = "update tron_live.live_balance set balance = balance + ? where addr = ? and currency = ?"
    await raw(updateSql, [params.amount, params.addr, params.currency])
    //
    let sql = `
update tron_live.integration_transaction_log set win = 0 , status = ? where transaction_id = ? and addr = ? and currency = ?
        `
    const sqlParam = [
        statusDict.refund,
        params.transaction_id,
        params.addr,
        params.currency,
    ]
    await raw(sql, sqlParam)
}


module.exports = {
    getBalance,
    getAllBalance,
    checkToken,
    buy,
    close,
    refund,
}