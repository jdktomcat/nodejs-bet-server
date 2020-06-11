const db = require('../utils/dbUtil')
/**
 * redis
 * @type {RedisClient}
 */
const redisUtil = require("../utils/redisUtil")

/**
 * 最大扫描日志标示
 * @type {string}
 */
const maxScanBetLogKey = 'scan:bet:log:max:id';

/**
 * 扫描最大duel日志标示
 * @type {string}
 */
const maxScanDuelLogKey = 'scan:duel:log:max:id'

/**
 * 扫描最大poker日志标示
 * @type {string}
 */
const maxScanPokerLogKey = 'scan:poker:log:max:id'

/**
 * 锦标赛排名列表键值
 * @type {string}
 */
const topUserListKey = 'championship:top:integral:order:list'

/**
 * 获取最大下注日志记录标示
 * @returns {Promise<number>}
 */
async function getMaxBetLogId() {
    return await redisUtil.get(maxScanBetLogKey)
}

/**
 * 设置最大下注日志记录标示
 * @param maxBetLogId 最大下注日志标示
 */
async function setMaxBetLogId(maxBetLogId) {
    await redisUtil.set(maxScanBetLogKey, maxBetLogId)
}

/**
 * 获取最大Duel下注日志记录标示
 * @returns {Promise<number>}
 */
async function getMaxDuelLogId() {
    return await redisUtil.get(maxScanDuelLogKey)
}

/**
 * 设置最大Duel下注日志记录标示
 * @param maxDuelLogId 最大duel日志标示
 */
async function setMaxDuelLogId(maxDuelLogId) {
    await redisUtil.set(maxScanDuelLogKey, maxDuelLogId)
}

/**
 * 获取最大Poker下注日志记录标示
 * @returns {Promise<number>}
 */
async function getMaxPokerLogId() {
    return await redisUtil.get(maxScanPokerLogKey)
}

/**
 * 设置最大Poker下注日志记录标示
 * @param maxPokerLogId 最大poker日志标示
 */
async function setMaxPokerLogId(maxPokerLogId) {
    await redisUtil.set(maxScanPokerLogKey, maxPokerLogIds)
}

/**
 * 扫描活动期间下注记录
 *
 * @param minBetLogId 最小日志记录标示
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns {Promise<*>}
 */
async function scanBetLog(minBetLogId, startTime, endTime) {
    let sql = `select id,addr,amount,ts from tron_bet_event.user_bet_log where id > ? and ` +
        `ts >= ? AND ts < ?`
    let result = await db.exec(sql, [minBetLogId, startTime, endTime])
    return result
}

/**
 * 扫描活动期间DuelRing游戏下注记录
 *
 * @param minDuelLogId 最小日志记录标示
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns {Promise<*>}
 */
async function scanDuelBetLog(minDuelLogId, startTime, endTime) {
    let sql = `select room_id as id, player1, player2, player3, player4, amount, createTs from tron_bet_admin.wheel_solo_order where room_id > ? and ` +
        ` createTs >= ? AND createTs < ?`
    let result = await db.exec(sql, [minDuelLogId, startTime, endTime])
    return result
}

/**
 * 扫描活动期间Poker游戏下注记录
 *
 * @param minPokerLogId 最小日志记录标示
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns {Promise<*>}
 */
async function scanPokerBetLog(minPokerLogId, startTime, endTime) {
    let sql = `select logId as id, addr, amount  from tronbet_poker_log.poker_revenue_log 
               where optime > ? and optime >= ? AND createTs < ? AND action > 100 AND cointype = 'TRX'`
    let result = await db.exec(sql, [minPokerLogId, startTime, endTime])
    return result
}

/**
 * 批量保存用户积分信息
 *
 * @param dataList 用户积分信息列表
 * @returns {Promise<void>}
 */
async function saveUserIntegral(dataList) {
    if (!dataList || dataList.length == 0) {
        return
    }
    let insertSql = "insert into tron_bet_event.user_integral(addr,integral,bet_log_id) values ? " +
        " on duplicate key update integral=integral+values(integral),bet_log_id=values(bet_log_id)";
    let insertResult = await db.query(insertSql, [dataList])
    console.log("save user integral complete,result:" + insertResult)
}

/**
 * 批量保存用户燃料信息
 *
 * @param dataList 用户燃料信息列表
 * @returns {Promise<void>}
 */
async function saveUserFlight(dataList) {
    if (!dataList || dataList.length == 0) {
        return
    }
    let insertSql = "insert into tron_bet_event.user_flight(addr,fuel,plant) values ? " +
        "on duplicate key update fuel=fuel+values(fuel)"
    let insertResult = await db.query(insertSql, [dataList])
    console.log("save user flight complete,result:" + insertResult)
}

/**
 * 用户飞行动作保存
 *
 * @param data 用户飞行信息
 * @param conn 数据库连接
 * @returns {Promise<void>}
 */
async function flight(data, conn) {
    if (data) {
        return
    }
    const updateSql = "update tron_bet_event.user_flight set fuel = fuel - ?, plant = ? where addr=?"
    const updateResult = await db.execTrans(updateSql, data, conn)
    console.log("save user flight complete,result:" + updateResult)
}

/**
 * 批量保存用户下注记录信息
 * @param dataList 下注信息列表
 * @returns {Promise<void>}
 */
async function saveUserBetLog(dataList) {
    if (!dataList || dataList.length == 0) {
        return
    }
    let insertSql = "insert into tron_bet_event.user_bet_log(addr,order_id,amount,bet_type) values ? "
    let insertResult = await db.query(insertSql, [dataList])
    console.log("save user bet log complete,result:" + insertResult)
}

/**
 * 查询排名列表
 *
 * @param limit 排名
 * @returns {Promise<void>}
 */
async function queryTopUserIntegral(limit) {
    let result = await redisUtil.lrange(topUserListKey, limit)
    if (!result || result.length == 0) {
        const sql = `select addr, integral from tron_bet_event.user_integral order by integral desc limit ?`;
        result = await db.exec(sql, [limit])
        await redisUtil.lpush(topUserListKey, result)
    }
    return result
}

/**
 * 批量保存中奖用户信息
 *
 * @param dataList 中奖用户信息列表
 * @returns {Promise<void>}
 */
async function saveAwardUser(dataList) {
    if (!dataList || dataList.length == 0) {
        return
    }
    let insertSql = "insert into tron_bet_event.award_log(addr,integral,order,prize) values ? ";
    let insertResult = await db.query(insertSql, [dataList])
    console.log("save award user complete,result:" + insertResult)
}

/**
 * 保存飞行日志信息
 *
 * @param flightLog 飞行日志信息
 * @param conn 数据库连接
 * @returns {Promise<void>}
 */
async function saveFlightLog(flightLog, conn) {
    if (!flightLog) {
        return
    }
    const insertSql = "insert into tron_bet_event.flight_log(addr, from_plant, to_plant, reward) values ? ";
    const insertResult = await db.execTrans(insertSql, flightLog, conn)
    console.log("save flight log complete, result:" + insertResult)
}

/**
 * 获取用户位置信息
 *
 * @param addr 用户钱包地址
 * @returns {Promise<void>}
 */
async function getPosition(addr) {
    return await db.exec(`select addr, fuel, plant from tron_bet_event.user_flight where addr = ?`, [addr])
}

/**
 * 获取用户飞行路径信息列表
 *
 * @param addr 用户钱包地址
 * @returns {Promise<void>}
 */
async function getFlightPath(addr) {
    return await db.exec(`select addr, to_plant as plant,reward as mine from tron_bet_event.flight_log where addr = ?`, [addr])
}

/**
 * 对外开放接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
module.exports = {
    getMaxBetLogId,
    getMaxDuelLogId,
    getMaxPokerLogId,
    scanBetLog,
    scanDuelBetLog,
    scanPokerBetLog,
    saveUserIntegral,
    saveUserFlight,
    saveAwardUser,
    saveUserBetLog,
    queryTopUserIntegral,
    setMaxBetLogId,
    setMaxDuelLogId,
    setMaxPokerLogId,
    getPosition,
    getFlightPath,
    flight,
    saveFlightLog
}
