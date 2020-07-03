const router = require('koa-router')()

// const events = require('./events')
const mine = require('./mine')

router.use('/mine', mine.routes(), mine.allowedMethods())
// remove old
// router.use('/event', events.routes(), events.allowedMethods())

module.exports = router