const router = require('koa-router')()
const controller = require('../controller/winController')

/**
 * query gameId
 */
module.exports = router.get('/getWin', controller.getWin)
module.exports = router.get('/getLive', controller.getLive)
module.exports = router.get('/getPoker', controller.getPoker)
