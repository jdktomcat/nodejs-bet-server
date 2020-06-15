const db = require('../utils/dbUtil')

/**
 * 批量保存用户积分信息
 *
 * @param dataList 用户积分信息列表
 * @returns {Promise<void>}
 */
async function saveUserIntegral(dataList) {
    if (!dataList || dataList.length === 0) {
        return
    }
    let insertSql = "insert into tron_bet_event.user_integral(addr,integral) values ? " +
        " on duplicate key update integral=integral+values(integral)";
    let insertResult = await db.query(insertSql, [dataList])
    console.log("save user integral complete,result:" + insertResult.affectedRows)
}

/**
 * 批量保存用户燃料信息
 *
 * @param dataList 用户燃料信息列表
 * @returns {Promise<void>}
 */
async function saveUserFlight(dataList) {
    if (!dataList || dataList.length === 0) {
        return
    }
    let insertSql = "insert into tron_bet_event.user_flight(addr,fuel,plant) values ? " +
        "on duplicate key update fuel=fuel+values(fuel)"
    let insertResult = await db.query(insertSql, [dataList])
    console.log("save user flight complete,result:" + insertResult.affectedRows)
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
    const updateSql = "update tron_bet_event.user_flight set fuel = fuel - ?, plant = ? where addr = ?"
    const updateResult = await db.execTrans(updateSql, data, conn)
    console.log("save user flight complete,result:" + updateResult)
}

/**
 * 批量保存用户下注记录信息
 * @param dataList 下注信息列表
 * @returns {Promise<void>}
 */
async function saveUserBetLog(dataList) {
    if (!dataList || dataList.length === 0) {
        return
    }
    let insertSql = "insert into tron_bet_event.user_bet_log(addr, order_id, amount, bet_type) values ? "
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
    const sql = `select addr,integral from tron_bet_event.user_integral order by integral desc limit ?`;
    return await db.exec(sql, [limit])
}

/**
 * 批量保存中奖用户信息
 *
 * @param dataList 中奖用户信息列表
 * @returns {Promise<void>}
 */
async function saveAwardUser(dataList) {
    if (!dataList || dataList.length === 0) {
        return
    }
    let insertSql = "insert into tron_bet_event.award_log(addr, integral, order, prize) values ? ";
    let insertResult = await db.query(insertSql, [dataList])
    console.log("save award user complete, result:" + insertResult)
}

/**
 * 查询待支付奖励
 *
 * @returns {Promise<void>}
 */
async function queryWaitPayAward() {
    return await db.exec(`select id, addr, prize from tron_bet_event.award_log where status = 0`)
}

/**
 * 标记奖励已支付成功
 *
 * @returns {Promise<void>}
 */
async function markPayedAward(datas) {
    if (!datas || datas.length !== 0) {
        return
    }
    const updateResult = await db.query(`insert into tron_bet_event.award_log(id,tx_id) values ? on on duplicate key` +
        ` update status = 1, tx_id = values(tx_id)`, datas)
    console.log("mark award payed complete, result:" + updateResult.affectedRows)
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
    saveUserIntegral,
    saveUserFlight,
    saveAwardUser,
    saveUserBetLog,
    queryTopUserIntegral,
    getPosition,
    getFlightPath,
    flight,
    saveFlightLog,
    queryWaitPayAward,
    markPayedAward
}
