const usermodel = require('../model/userinfo')
const _ = require('lodash')._
const redisUtil = require('../utils/redisUtil')
const db = require('../utils/dbUtil')
const axios = require('axios')
const exp = require('../configs/exp')


async function updateBetInfo () {
    let startTs = await usermodel.getLastTs()
    let now = Math.floor(new Date().getTime())
    console.log('----------startTs----endts-----start--------', startTs, now)
    let res = await usermodel.getAllLiveBetData(startTs, now)
    console.log('----------startTs----endts-------end------', startTs, now, res)
    let round = Math.floor((now - 1556251200000) / 604800000)
    let conn = null
    try {
        conn = await db.getConnection()
        if (!conn) {
            console.error('damn it, connection lost, please check it')
            return
        }
        for (let one of res) {
            if (one.currency != 'TRX') continue
            let bet =  one.amount
            let payout = one.win
            await usermodel.updateBetInfo(round, one.addr, bet, payout, now, conn)
        }
        conn.commit()
    } catch (error) {
        console.log(error)
        if (conn) conn.release()
    } finally {
        if (conn) conn.release()
    }
}

async function updatePrice() {
    let prices = [
        'BTC',
        'ETH',
        'BNB',
        'LTC',
        'BCH',
        'TRX'
    ]
    console.log(_.join(prices, ','))
    let {data} = await axios.get("https://min-api.cryptocompare.com/data/pricemulti", {
        params: {
            fsyms: prices.join(','),
            tsyms: "TRX"
        }
    })
    return data
}

// 计算用户下注额度, 之后换算成等级
async function ComputeUserExpr() {
    let prices = await updatePrice()
    let startTs = await usermodel.getLastExprTs()
    let now = Math.floor(new Date().getTime())
    console.log('===============================>>>>>>>', startTs, now)
    let res = await usermodel.getAllLiveBetData(startTs, now)
    let conn = null
    try {
        conn = await db.getConnection()
        if (!conn) {
            console.error('damn it, connection lost, please check it')
            return
        }
        for (let one of res) {
            if (one.currency == 'TRX') continue
            let currency = one.currency
            let bet = prices[currency].TRX * one.amount / 1000
            let payout = prices[currency].TRX * one.win / 1000
            let userExpr = await redisUtil.hincrby("live:player:info:" + one.addr, "total", Math.floor(bet))
            let lv = exp.getLv(userExpr)
            await redisUtil.hset("live:player:info:" + one.addr, "lv", lv)
            await usermodel.updateUserExpr(one.addr, Math.floor(bet), payout, now, conn)
        }
        conn.commit()
    } catch (error) {
        console.log(error)
        if (conn) conn.release()
    } finally {
        if (conn) conn.release()
    }
}

let betInfoTimer = setInterval(updateBetInfo, 120000)
let timerExpr = setInterval(ComputeUserExpr, 180000) // 计算用户经验等级