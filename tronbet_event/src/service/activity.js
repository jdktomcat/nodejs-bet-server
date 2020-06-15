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
const flightEndTime = new Date(config.activity.flight.startTime).getTime()

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
 * 处理下注订单信息
 *
 * @param message 下注订单信息
 * @returns {Promise<void>}
 */
async function handleMsg(message) {
    console.log('event01 bet info：' + message)
    // 保存记录
    const messageData = JSON.parse(message)
    await activity.saveUserBetLog([[messageData.addr, messageData.order_id, messageData.amount, messageData.bet_type]])
    // update user integral
    const nowTime = new Date().getTime()

    if (nowTime >= championshipStartTime && nowTime < championshipEndTime) {
        await activity.saveUserIntegral([messageData.addr, activityUtil.calIntegral(nowTime, messageData.amount)])
    }
    // update user flight
    if (nowTime >= flightStartTime && nowTime < flightEndTime) {
        if (messageData.amount >= minMount) {
            await activity.saveUserFlight([messageData.addr, messageData.amount * fuelRate, 0])
        }
    }
    console.log('bet log info saved！')
    console.log('bet log info saved！')
}

module.exports = {
    handleMsg
}
