const router = require('koa-router')()
const action = require('../controller/divController')

//div
module.exports = router.post('/wintrx/restart', action.wintrxRestart)
