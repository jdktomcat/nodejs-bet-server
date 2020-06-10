const tronWeb = require('tronweb')

/**
 * 活动数据访问接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
const activity = require('../model/activity')

/**
 * 排名列表接口
 * @param ctx 请求上下文
 * @returns {Promise<void>}
 */
async function rank(ctx) {
    const limit = ctx.query.limit
    const data = await activity.queryTopUserIntegral(limit)
    data.forEach((record, index) => {
        record.push(activityUtil.getPrize(index))
    })
    ctx.body = {code: 200, msg: "success", data: data}
}

/**
 * 处理下注订单信息
 *
 * @param message 下注订单信息
 * @returns {Promise<void>}
 */
async function handleMsg(message) {
    console.log('bet info：' + message)
    // 保存记录
    await activity.saveUserBetLog([JSON.parse(message)])
    console.log('bet log info saved！')
}

/**
 * 获取当前位置
 *
 * @param ctx 请求上下文
 * @returns {Promise<void>}
 */
async function position(ctx) {
    const addr = ctx.query.addr
    let plant = 0
    let full = false
    let result = await activity.getPosition(addr)
    if (result) {
        plant = result.plant
        full = (result.fuel >= activityUtil.calFuel(plant + 1))
    }
    ctx.body = {code: 200, msg: 'success', data: {plant: plant, full: full}}
}

/**
 * 发射飞行
 *
 * @param ctx 请求上下文
 * @returns {Promise<void>}
 */
async function fire(ctx) {
    // 防重机制

}

/**
 * 飞行路径
 *
 * @param ctx 请求上下文
 * @returns {Promise<void>}
 */
async function path(ctx) {
    const addr = ctx.query.addr
    let result = await activity.getFlightPath(addr)
    ctx.body = {code: 200, msg: 'success', data: result}
}

/**
 * 返回地球
 *
 * @param ctx 请求上下文
 * @returns {Promise<void>}
 */
async function reset(ctx) {
    // 防重机制
}

module.exports = {
    rank,
    handleMsg,
    position,
    fire,
    path,
    reset
}
