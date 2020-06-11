const db = require('../utils/dbUtil')
const common = require('../utils/common')

/**
 * 活动数据访问接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
const activity = require('../model/activity')

/**
 * 星球配置
 */
const plantConfig = require('../configs/config').activity.flight.plant

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
    const messageData = JSON.parse(message)
    await activity.saveUserBetLog([[messageData.add, messageData.order_id, messageData.amount, messageData.bet_type]])
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
    const result = await activity.getPosition(addr)
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
    // 防重机制,添加位置参数
    const addr = ctx.query.addr
    const position = ctx.query.position;
    const result = await activity.getPosition(addr)
    let handleResult
    if (result) {
        if (position >= 0 && position < plantConfig.length - 1 && result.plant === position) {
            let reward = await common.getRandomInt(plantConfig[position + 1].minPrize, plantConfig[position + 1].maxPrize)
            handleResult = await flight(addr, plantConfig[position + 1].fuel, position, position + 1, reward)
        } else {
            handleResult = {
                code: 1001,
                msg: 'Error! request param position:' + position +
                    ' does not match current server position,please flush and check again!'
            }
        }
    } else {
        handleResult = {code: 1001, msg: 'Error! request param addr:' + addr + ' have no bet data'}
    }
    ctx.body = handleResult
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
    const addr = ctx.query.addr
    // 防重机制
    const position = ctx.query.position;
    const result = await activity.getPosition(addr)
    let handleResult
    if (result) {
        if (position > 0 && result.plant === position) {
            handleResult = await flight(addr, 0, result.plant, 0, 0)
        } else {
            handleResult = {
                code: 1001,
                msg: 'Error! request param position:' + position +
                    ' does not match current server position,please flush and check again!'
            }
        }
    } else {
        handleResult = {code: 1001, msg: 'Error! request param addr:' + addr + ' have no bet data'}
    }
    ctx.body = handleResult
}

/**
 * 飞行处理
 *
 * @param addr    用户钱包地址
 * @param fromPlant 原始星球
 * @param toPlant 目标星球
 * @param reward 奖励
 * @returns {Promise<void>}
 */
async function flight(addr, fuel, fromPlant, toPlant, reward) {
    let conn;
    let handleResult = {code: 1001, msg: 'reset fail!'}
    try {
        conn = await db.getConnection()
        if (conn) {
            conn.beginTransaction()
            // 更新保存用户飞行信息
            await activity.flight([fuel, toPlant, addr], conn)
            // 分配奖励
            if (reward > 0) {
                // TODO 调用合约分配奖励
            }
            // 添加飞行日志记录
            await activity.saveFlightLog([[addr, fromPlant, toPlant, reward]], conn)
            conn.commit()
            handleResult = {code: 200, msg: 'reset success'}
        }
    } catch (error) {
        console.log('reset action occur error,addr:' + addr + ' error:' + error)
        if (conn) conn.rollback()
    } finally {
        if (conn) conn.release()
    }
    return handleResult
}

module.exports = {
    rank,
    handleMsg,
    position,
    fire,
    path,
    reset
}
