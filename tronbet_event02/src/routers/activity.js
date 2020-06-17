/**
 * 活动操作接口
 */
const router = require('koa-router')()
const activity = require('../service/activity')

// 排名
module.exports = router.get('/championship/rank', activity.rank)

// 获取位置
module.exports = router.get('/flight/position', activity.position)

// 获取飞行路径
module.exports = router.get('/flight/path', activity.path)

// 飞行
module.exports = router.get('/flight/fire', activity.fire)

// 返回地球
module.exports = router.get('/flight/reset', activity.reset)

// 后门管理接口 开奖
module.exports = router.get('/admin/draw', activity.handleDraw)

// 后门管理接口 发放奖励
module.exports = router.get('/admin/pay', activity.handlePay)
