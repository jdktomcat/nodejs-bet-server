const db = require('../utils/dbUtil')

/**
 * 批量保存用户下注记录信息
 * @param dataList 下注信息列表
 * @returns {Promise<void>}
 */
async function saveUserBetLog(dataList) {
    if (!dataList || dataList.length == 0) {
        return
    }
    let insertSql = "insert into tron_bet_event.user_bet_log(addr, order_id, amount, bet_type) values ? "
    let insertResult = await db.query(insertSql, [dataList])
    console.log("save user bet log complete,result:" + insertResult)
}

module.exports = {
    saveUserBetLog
}
