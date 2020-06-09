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

module.exports = {
    rank
}
