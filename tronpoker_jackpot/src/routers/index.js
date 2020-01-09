const router = require('koa-router')()

const jackpot = require('./jackpot')

router.use('/jackpot', jackpot.routes(), jackpot.allowedMethods())
module.exports = router