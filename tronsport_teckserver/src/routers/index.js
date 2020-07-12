const router = require('koa-router')()

const action = require('./action')

router.use('/', action.routes(), action.allowedMethods())

module.exports = router