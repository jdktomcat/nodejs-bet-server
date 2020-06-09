const db = require('../utils/dbUtil')

/**
 * 获取最大下注日志记录标示
 * @returns {Promise<number>}
 */
async function getMaxLogId() {
    let maxBetLog = 0
    let sql = "SELECT greatest((select IFNULL(max(bet_log_id),0) from tron_bet_event.user_integral),(select IFNULL(max(bet_log_id),0) from tron_bet_event.user_flight)) as maxLogId"
    let res = await db.exec(sql)
    if (res.length === 1) {
        if (res[0].maxLogId) {
            maxBetLog = res[0].maxLogId;
        }
    }
    return maxBetLog
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
    let sql = `select logId as id,addr,ts,Amount as amount from tron_live.live_action_log_v2 where logId > ? and ` +
        `action = 'bet' and txStatus = 1 and currency = 'TRX' and ts >= ? AND ts < ?`
    let res = await db.exec(sql, [minBetLogId, startTime, endTime])
    return res
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
        "on duplicate key update fuel=fuel+values(fuel),bet_log_id=values(bet_log_id)";
    let insertResult = await db.query(insertSql, [dataList])
    console.log("save user flight complete,result:" + insertResult)
}

/**
 * 查询排名列表
 *
 * @param limit 排名
 * @returns {Promise<void>}
 */
async function queryTopUserIntegral(limit){
    const sql = `select addr, integral from tron_bet_event.user_integral order by integral desc limit ?`;
    const result = await db.exec(sql, [limit])
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
 * 对外开放接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
module.exports = {
    getMaxLogId,
    scanBetLog,
    saveUserIntegral,
    saveUserFlight,
    saveAwardUser,
    queryTopUserIntegral
}
