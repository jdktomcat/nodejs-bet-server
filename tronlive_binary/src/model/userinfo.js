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


async function getTRXPrice(currency) {
    if (currency === 'TRX') return 1;
    if (currency === 'USDT') {
        let sql = `SELECT count FROM tron_price.TRX_USD ORDER BY last_updated DESC LIMIT 1`;
        let res = await raw(sql,[]);
        if (!_.isEmpty(res)) {
            return res[0].count;
        }
    }
    return 1;
}


async function getBalance(params) {
    const {addr, currency} = params
    let sql = "select addr as user,balance,currency from tron_live.live_balance where currency = ? and addr = ?"
    let res = await raw(sql, [currency, addr])
    if (res.length === 0) {
        return Promise.reject(new Error("user not found"))
    }else {
        let balance = res[0] || {}
        return balance
    }
}

function checkToken(token) {
    const secretKey = config.Binary.secretKey
    if (secretKey === undefined) {
        return {
            tokenError: true,
            tokenInfo: {}
        }
    }
    console.log(`${new Date()},rawToken `, token)
    const tmp = decodeURIComponent(token)
    const payload = jwt.verify(tmp, secretKey)
    console.log(`payload: ${JSON.stringify(payload)}`)
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
INSERT INTO tron_live.binary_transaction_log
(transaction_id, addr, asset, kind, amount, win, adAmount, currency, status, quote_open, quote_close, created_at, profitability, expiration_date, expiration_type)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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

async function isTxClose(params){
    let updateSql = "select status from tron_live.binary_transaction_log where transaction_id = ?"
    const rs = await raw(updateSql, [params.transaction_id])
    if(rs.length > 0){
        const tmp = rs[0] || {}
        const status = tmp.status || '-1'
        console.log("--->status--->",status)
        if(status === statusDict.refund || status === statusDict.close){
            return true
        }else {
            return false
        }
    }
    return true
}

async function close(params) {
    const isClose = await isTxClose(params)
    if(isClose){
        console.log("this tx is over ",params.transaction_id)
        return []
    }
    let updateSql = "update tron_live.live_balance set balance = balance + ? where addr = ? and currency = ?"
    await raw(updateSql, [params.win, params.addr, params.currency])
    //
    let sql = `update tron_live.binary_transaction_log set win = ? , status = ? ,quote_close = ? where transaction_id = ? and addr = ? and currency = ?`
    const sqlParam = [
        params.win,
        statusDict.close,
        params.quote_close,
        params.transaction_id,
        params.addr,
        params.currency,
    ]
    await raw(sql, sqlParam)
}


async function refund(params) {
    const isClose = await isTxClose(params)
    if(isClose){
        console.log("this tx is over ",params.transaction_id)
        return []
    }
    let updateSql = "update tron_live.live_balance set balance = balance + ? where addr = ? and currency = ?"
    await raw(updateSql, [params.amount, params.addr, params.currency])
    //
    let sql = `
update tron_live.binary_transaction_log set win = 0 , status = ? where transaction_id = ? and addr = ? and currency = ?
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
    getTRXPrice,
    checkToken,
    isTxClose,
    buy,
    close,
    refund,
}