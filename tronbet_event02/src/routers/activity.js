/**
 * 活动操作接口
 */
const router = require('koa-router')()
const activity = require('../service/activity')

module.exports = router.get( '/championship/rank', activity.rank)
