const db = require('../utils/dbUtil')
const common = require('../utils/common')
/**
 * 配置
 */
const config = require('../configs/config')

/**
 * 活动数据访问接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
const activity = require('../model/activity')

/**
 * 活动工具类
 * @type {*}
 */
const activityUtil = require('../utils/activityUtil')

/**
 * tron工具类
 * @type {{sendTRX: (function(*=, *=): *), verifySignature: verifySignature, getAccBalance: (function(): number), isTxSuccesssed: isTxSuccesssed, tronExec: (function(*=, *=, *=, *=, *=): *)}}
 */
const tronUtil = require('../utils/tronUtil')

/**
 * 星球配置
 */
const plantConfig = config.activity.flight.plant

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
 * 锦标赛奖励排名
 * @type {number}
 */
const top = config.activity.championship.top

/**
 * 管理接口口令
 * @type {string}
 */
const adminToken = config.activity.adminToken

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
 * 锦标赛信息接口
 * @param ctx 请求上下文
 * @returns {Promise<void>}
 */
async function info(ctx) {
    const timeout = championshipEndTime - new Date().getTime()
    ctx.body = {code: 200, msg: "success", data: {timeout: timeout}}
}

/**
 * 排名列表接口
 * @param ctx 请求上下文
 * @returns {Promise<void>}
 */
async function rank(ctx) {
    const addr = ctx.query.addr || ''
    const personal = await activity.fetchIntegral(addr)
    const data = {}
    if(personal && personal.length === 1){
        personal[0].prize = activityUtil.getPrize(personal[0].order)
        data.personal = personal
    }
    const rank = await activity.queryTopUserIntegral(20)
    rank.forEach((record, index) => {
        record.prize = activityUtil.getPrize(index + 1)
    })
    data.rank = rank
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
    // save info
    const messageData = JSON.parse(message)
    if (!publish && whiteList.indexOf(messageData.addr) === -1) {
        console.log('activity has not publish and addr:[%s] is not in whitelist', messageData.addr)
        return
    }
    await activity.saveUserBetLog([[messageData.addr, messageData.order_id, messageData.amount, messageData.game_type]])
    // update user integral
    const nowTime = new Date().getTime()
    if (nowTime >= championshipStartTime && nowTime < championshipEndTime) {
        await activity.saveUserIntegral([[messageData.addr, activityUtil.calIntegral(nowTime, messageData.amount)]])
    } else {
        console.warn('not in championship period！')
    }
    // update user flight
    if (nowTime >= flightStartTime && nowTime < flightEndTime) {
        if (messageData.amount >= minMount) {
            await activity.saveUserFlight([[messageData.addr, messageData.amount * fuelRate, 0]])
        } else {
            console.warn('less than flight min amount!')
        }
    } else {
        console.warn('not in flight period!')
        console.warn('now:' + nowTime + ' start:' + flightStartTime + ' end:' + flightEndTime)
    }
    console.log('bet log info saved！')
}

/**
 * 获取当前位置
 *
 * @param ctx 请求上下文
 * @returns {Promise<void>}
 */
async function position(ctx) {
    const addr = ctx.query.addr || ''
    let plant = 0
    let fuel = 0
    let full = false
    const result = await activity.getPosition(addr)
    if (result && result.length !== 0) {
        plant = result[0].plant
        fuel = result[0].fuel
        full = (fuel >= activityUtil.calFuel(plant + 1))
    }
    ctx.body = {code: 200, msg: 'success', data: {plant: plant, fuel: fuel, full: full}}
}

/**
 * 发射飞行
 *
 * @param ctx 请求上下文
 * @returns {Promise<void>}
 */
async function fire(ctx) {
    // 防重机制,添加位置参数
    const addr = ctx.query.addr || ''
    const position = parseInt(ctx.query.position || '-1')
    let handleResult
    if (new Date().getTime() > flightEndTime) {
        handleResult = {
            code: 1001,
            msg: 'Error! Flight activity has closed!'
        }
    } else {
        const result = await activity.getPosition(addr)
        if (result && result.length !== 0) {
            if (position >= 0 && position < plantConfig.length - 1 && result[0].plant === position) {
                if (result[0].fuel >= plantConfig[position + 1].fuel) {
                    let reward = await common.getRandomInt(plantConfig[position + 1].minPrize, plantConfig[position + 1].maxPrize)
                    handleResult = await flight(addr, plantConfig[position + 1].fuel, position, position + 1, reward)
                } else {
                    handleResult = {
                        code: 1001,
                        msg: 'Error! Fuel is not enough!'
                    }
                }
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
    const addr = ctx.query.addr || ''
    const result = await activity.getFlightPath(addr)
    result.forEach(record => {
        if (plantConfig[record.plant]) {
            record.fuel = plantConfig[record.plant].fuel
        }
    })
    ctx.body = {code: 200, msg: 'success', data: result}
}

/**
 * 手动开奖逻辑
 * @param ctx 请求
 * @returns {Promise<void>}
 */
async function handleDraw(ctx) {
    const token = ctx.query.token
    if (adminToken === token) {
        await draw()
        ctx.body = {code: 200, msg: 'draw success'}
    } else {
        ctx.body = {code: 1001, msg: 'you are not certified！'}
    }
}

/**
 * 手动发放奖励
 *
 * @param ctx 请求
 * @returns {Promise<void>}
 */
async function handlePay(ctx) {
    const token = ctx.query.token
    if (adminToken === token) {
        const payAll = await pay()
        if (payAll) {
            ctx.body = {code: 200, msg: 'pay all success'}
        } else {
            ctx.body = {code: 200, msg: 'pay part success,some fail,please check log and find the error!'}
        }
    } else {
        ctx.body = {code: 1001, msg: 'you are not certified！'}
    }
}

/**
 * 返回地球
 *
 * @param ctx 请求上下文
 * @returns {Promise<void>}
 */
async function reset(ctx) {
    const addr = ctx.query.addr || ''
    // 防重机制
    const position = parseInt(ctx.query.position || '-1')
    let handleResult
    if (new Date().getTime() < flightEndTime) {
        handleResult = {
            code: 1001,
            msg: 'Error! Flight activity has closed!'
        }
    }else{
        const result = await activity.getPosition(addr)
        if (result && result.length !== 0) {
            if (position > 0 && result[0].plant === position) {
                handleResult = await flight(addr, 0, result[0].plant, 0, 0)
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
    }
    ctx.body = handleResult
}

/**
 * 飞行处理
 *
 * @param addr    用户钱包地址
 * @param fuel  燃料
 * @param fromPlant 原始星球
 * @param toPlant 目标星球
 * @param reward 奖励
 * @returns {Promise<void>}
 */
async function flight(addr, fuel, fromPlant, toPlant, reward) {
    let conn;
    let handleResult = {code: 1001, msg: 'fire fail!'}
    try {
        conn = await db.getConnection()
        if (conn) {
            conn.beginTransaction()
            // 更新保存用户飞行信息
            await activity.flight([fuel, toPlant, addr], conn)
            // 添加飞行日志记录
            const insertId = await activity.saveFlightLog([addr, fromPlant, toPlant, reward], conn)
            // 分配奖励
            if (reward > 0) {
                // 调用合约分配奖励
                await tronUtil.sendWin(addr, reward, () => {
                    activity.makeRewardPayedStatus(insertId)
                })
                console.log('flight reward addr:' + addr + ' reward:' + reward)
            }
            conn.commit()
            handleResult = {code: 200, msg: 'fire success', data: {reward: reward}}
        }
    } catch (error) {
        console.log('fire action occur error,addr:' + addr + ' error:' + error)
        if (conn) conn.rollback()
    } finally {
        if (conn) conn.release()
    }
    return handleResult
}

/**
 * 开奖
 * @returns {Promise<void>}
 */
async function draw() {
    const result = await activity.queryTopUserIntegral(top)
    if (result && result.length !== 0) {
        const awardUsers = []
        result.forEach((record, index) => {
            awardUsers.push([record.addr, index + 1, record.integral, activityUtil.getPrize(index + 1)])
        })
        await activity.saveAwardUser(awardUsers)
        console.log("draw success at " + activityUtil.formatDate(new Date()))
    } else {
        console.error("draw fail,because there is no user data in database,please checkout the data!!!")
    }
}

/**
 * 开奖支付奖励
 * @returns {Promise<boolean>}
 */
async function pay() {
    const result = await activity.queryWaitPayAward()
    if (result && result.length !== 0) {
        const payed = [];
        result.forEach(record => {
            const tx = tronUtil.sendTRX(record.addr, record.prize)
            if (tx.result) {
                payed.push([record.id, tx.transaction.txID])
            } else {
                console.log('award pay failed, addr:' + record.addr + ' prize:' + record.prize)
            }
        })
        await activity.markPayedAward(payed)
        return payed.length === result.length
    }
    return true
}

/**
 * 清空数据
 *
 * @param ctx 请求信息
 * @returns {Promise<void>}
 */
async function clear(ctx) {
    const token = ctx.query.token
    if (adminToken === token) {
        await activity.clear()
        ctx.body = {code: 200, msg: 'clear activity data success'}
    } else {
        ctx.body = {code: 1001, msg: 'you are not certified！'}
    }
}

module.exports = {
    info,
    rank,
    handleMsg,
    position,
    fire,
    path,
    reset,
    draw,
    pay,
    handleDraw,
    handlePay,
    clear
}
