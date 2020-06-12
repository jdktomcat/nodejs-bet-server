/**
 * 活动数据访问接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
const activity = require('../model/activity')

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
    await activity.saveUserBetLog([[messageData.addr, messageData.order_id, messageData.amount, messageData.bet_type]])
    console.log('bet log info saved！')
}


module.exports = {
    handleMsg
}
