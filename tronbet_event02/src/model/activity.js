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
    return await redisUtil.get(maxScanDuelLogKey)
}

/**
 * 获取最大Duel下注日志记录标示
 * @returns {Promise<number>}
 */
async function getMaxDuelLogId() {
    return await redisUtil.get(maxScanDuelLogKey)
}

/**
 * 获取最大Poker下注日志记录标示
 * @returns {Promise<number>}
 */
async function getMaxPokerLogId() {
    return await redisUtil.get(maxScanPokerLogKey)
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
    let insertSql = "insert into tron_bet_event.user_flight(addr,fuel,plant,bet_log_id) values ? " +
        "on duplicate key update fuel=fuel+values(fuel),bet_log_id=values(bet_log_id)"
    let insertResult = await db.query(insertSql, [dataList])
    console.log("save user flight complete,result:" + insertResult)
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
 * 保存排行榜
 *
 * @param dataList 数据
 * @returns {Promise<void>}
 */
async function pushTop(dataList) {
    if (!dataList || dataList.length == 0) {
        return
    }
    await redisUtil.lpush(topUserListKey, dataList)
}

/**
 * 对外开放接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
module.exports = {
    getMaxDuelLogId,
    getMaxPokerLogId,
    scanBetLog,
    scanDuelBetLog,
    scanPokerBetLog,
    saveUserIntegral,
    saveUserFlight,
    saveAwardUser,
    saveUserBetLog,
    queryTopUserIntegral
}
