const router = require('koa-router')()
const events = require('./events')
const activity = require('./activity')

router.use('/event', events.routes(), events.allowedMethods())
// 新版活动服务接口
router.use('/activity',activity.routes(), activity.allowedMethods())
module.exports = router
