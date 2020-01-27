const usermodel = require('../model/userinfo')
const redisUtil = require('../utils/redisUtil')
const divInfo = require('../model/divsinfo')
const _ = require('lodash')._

let timer = setInterval(async () => {
    let now = Math.floor(new Date().getTime() / 1000)
    let divedAmount = await usermodel.getTotalDivAmount()
    let totalAmount = await divInfo.getTotalPool()
    let profit = Math.floor(((totalAmount.totalPot || 0) - divedAmount) / 1e6)
    console.log("divedAmount==>",divedAmount)
    console.log("totalAmount==>",totalAmount.totalPot)
    console.log("profit==>",profit)
    if (profit < 0) profit = 0
    if (profit > 1e10) profit = 0
    await redisUtil.hset('tronpoker:realtime', 'profit', profit)
}, 70000)

let timer1 = setInterval(async () => {
    let kk = await usermodel.getHistDataByType(8)
    let sf = await usermodel.getHistDataByType(9)
    let rf = await usermodel.getHistDataByType(10)
    let all = await usermodel.getAllHistData()
    let result = {
        kk, sf, rf, all
    }
    await redisUtil.hset('tronpoker:histdata', 'rank', JSON.stringify(result))
}, 60000)