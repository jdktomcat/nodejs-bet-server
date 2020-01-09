const usermodel = require('../model/userinfo')
const redisUtils = require('../utils/redisUtil')
const _ = require('lodash')._
const {app}  = require('../configs/config')

let LocalCurrency = "TRX"
const RankInitTs = app.RankInitTs
// LocalCurrency = 'NOK'

async function sendMsgToClient(ctx, errno, errmsg, data) {
    data = data || {}
    let params = ctx.request.body
    let result = {
        errno,
        errmsg,
        data
    }
    ctx.body = result
}

async function rank(ctx) {
    // let result = await redisUtils.hget('tronlive:rank', 'allRank')
    let now = Math.floor(new Date().getTime() / 1000)
    let startTs = RankInitTs + Math.floor((now - RankInitTs) / 604800) * 604800
    let result = await redisUtils.hget('tronlive:rank:' + startTs, 'allRank')
    let endTs = startTs  + 604800
    let countDown = endTs - now
    if (!result) {
        let amountRank = []
        let profitRank = []
        for (let index = 0; index < 20; index++){
            let tmp = {
                rank : index + 1,
                name : '-',
                amount :  '-',
                lv : '-',
                img : '10000',
                wardAmount : 0
            }
            amountRank.push(tmp)
        }
    
        for (let index = 0; index < 20; index++){
            let tmp = {
                rank : index + 1,
                name : '-',
                amount :  '-',
                lv : '-',
                img : '10000',
                wardAmount : 0
            }
            profitRank.push(tmp)
        }
        result = {
            countDown : countDown,
            amountRank : amountRank,
            profitRank : profitRank,
        }
    } else {
        result = JSON.parse(result)
        try {
            result.countDown = countDown
        } catch (error) {
            console.log('---do nothing')
        }
    }
    await sendMsgToClient(ctx, 0, '', result)

}

module.exports = {
    rank,
}