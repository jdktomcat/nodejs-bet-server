const router = require('koa-router')()

const events = require('./events')

router.use('/event', events.routes(), events.allowedMethods())

module.exports = router