const router = require('koa-router')()
const action = require('../service/div')

module.exports = router.post('/wintrc20/restart', action.wintrc20Restart)
module.exports = router.post('/livetrc20/restart', action.livetrc20Restart)
