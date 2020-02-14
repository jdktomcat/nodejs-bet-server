const router = require('koa-router')()
const controller = require('../controller/liveController')

/**
 * query gameId
 */
module.exports = router.get('/getFileByGameId', controller.getFileByGameId)
module.exports = router.get('/getListByGameId', controller.getListByGameId)
module.exports = router.get('/getAccount', controller.getAccount)
