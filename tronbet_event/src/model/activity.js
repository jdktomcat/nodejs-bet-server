const db = require('../utils/dbUtil')

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
    console.log("save user bet log complete,result:" + insertResult.affectedRows)
}

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

module.exports = {
    saveUserBetLog,
    saveUserIntegral,
    saveUserFlight
}
