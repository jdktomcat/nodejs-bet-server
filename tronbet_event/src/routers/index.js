const router = require('koa-router')()

const events = require('./events')
const mine = require('./mine')

router.use('/event', events.routes(), events.allowedMethods())
router.use('/mine', events.routes(), events.allowedMethods())

module.exports = router