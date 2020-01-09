const usermodel = require('../model/userinfo')
const _ = require('lodash')._
const crypto = require("crypto")
const {softswiss, rewards}  = require('../configs/config')
const evnets = require('events')
const common = require('../utils/common')
const actionEvent = new evnets.EventEmitter()
const TronWeb = require('tronweb')
const userinfo = require('../model/userinfo')
const {sha256} = require('js-sha256')
const db = require('../utils/dbUtil')
const poker = require('../utils/poker')
const redisUtil = require('../utils/redisUtil')
const tronUtils = require('../utils/tronUtil')


async function sendMsgToClient(ctx, errno, errmsg, data) {
    let result = {
        errno : errno,
        errmsg : errmsg,
        data : data
    }
    ctx.body = result
}

async function getJackpotLogsByAddr(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) params = ctx.request.query
    let addr = params.addr
    if (!addr || addr.length < 10) return await  sendMsgToClient(ctx, 1001,'address error')
    let res = await redisUtil.hget('jackpot:list', addr)
    if(res) {
        return sendMsgToClient(ctx, 0, '', JSON.parse(res))
    } else {
        return sendMsgToClient(ctx, 0, '', [])
    }
}

async function realTimeProfit(ctx) {
    let result = {
        code : 0,
        info : '',
        data :null
    }

    let profit = await redisUtil.hget('tronpoker:realtime', 'profit')
    if (!profit) {
        profit = 0
    }
    result.data = {amount : Math.floor(profit)}
    ctx.body = result
}

async function histData(ctx) {
    let result = {
        code : 0,
        info : '',
        data :null
    }

    let rank = await redisUtil.hget('tronpoker:histdata', 'rank')
    if (!rank) {
        rank = []
    } else {
        rank = JSON.parse(rank)
    }
    result.data = {rank : rank}
    ctx.body = result
}

module.exports = {
    getJackpotLogsByAddr,
    realTimeProfit,
    histData
}