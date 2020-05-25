const router = require('koa-router')()

const live = require('./live')
router.use('/api', live.routes(), live.allowedMethods())

module.exports = router