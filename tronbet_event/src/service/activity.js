/**
 * 活动数据访问接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
const activity = require('../model/activity')

/**
 * 配置
 */
const config = require('../configs/config')

/**
 * 活动工具类
 * @type {*}
 */
const activityUtil = require('../utils/activityUtil')

/**
 * 锦标赛开始时间
 * @type {number}
 */
const championshipStartTime = new Date(config.activity.championship.startTime).getTime()

/**
 * 锦标赛结束时间
 * @type {number}
 */
const championshipEndTime = new Date(config.activity.championship.endTime).getTime()

/**
 * 飞行游戏开始时间
 * @type {number}
 */
const flightStartTime = new Date(config.activity.flight.startTime).getTime()

/**
 * 飞行游戏结束时间
 * @type {number}
 */
const flightEndTime = new Date(config.activity.flight.endTime).getTime()

/**
 * 燃料汇率
 * @type {number}
 */
const fuelRate = config.activity.flight.rate

/**
 * 最小下注配置
 * @type {number}
 */
const minMount = config.activity.flight.minAmount;

/**
 * 活动是否发布
 *
 * @type {boolean}
 */
const publish = config.activity.publish

/**
 * 白名单
 * @type {[string]}
 */
const whiteList = config.activity.whiteList

/**
 * 处理下注订单信息
 *
 * @param message 下注订单信息
 * @returns {Promise<void>}
 */
const mine = require("./../model/mine")
async function handleMsg(message) {
    console.log('bet info：' + message)
    const now = Date.now()
    if(now < new Date("2020-07-09").getTime()){
        // save info
        const messageData = JSON.parse(message)
        await mine.saveActivityData(messageData)
    }
    /**
     *  addr : 'abc'
     *  box : {
     *      normal : 2,
     *      silver : 10,
     *      gorden : 0,
     *  }
     */
    // insert


    // // save info
    // const messageData = JSON.parse(message)
    // if (!publish && whiteList.indexOf(messageData.addr) === -1) {
    //     console.log('activity has not publish and addr:[%s] is not in whitelist', messageData.addr)
    //     return
    // }
    // await activity.saveUserBetLog([[messageData.addr, messageData.order_id, messageData.amount, messageData.game_type]])
    // // update user integral
    // const nowTime = new Date().getTime()
    // if (nowTime >= championshipStartTime && nowTime < championshipEndTime) {
    //     await activity.saveUserIntegral([[messageData.addr, activityUtil.calIntegral(nowTime, messageData.amount)]])
    // } else {
    //     console.warn('not in championship period！')
    // }
    // // update user flight
    // if (nowTime >= flightStartTime && nowTime < flightEndTime) {
    //     if (messageData.amount >= minMount) {
    //         await activity.saveUserFlight([[messageData.addr, messageData.amount * fuelRate, 0]])
    //     } else {
    //         console.warn('less than flight min amount!')
    //     }
    // } else {
    //     console.warn('not in flight period!')
    //     console.warn('now:' + nowTime + ' start:' + flightStartTime + ' end:' + flightEndTime)
    // }
    // console.log('bet log info saved！')
}

module.exports = {
    handleMsg
}
