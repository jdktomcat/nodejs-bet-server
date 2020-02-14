const router = require('koa-router')()
const controller = require('../controller/liveController')

/**
 * query gameId
 */
module.exports = router.get('/getFlieByGameId', controller.getFlieByGameId)
module.exports = router.get('/getListByGameId', controller.getListByGameId)
module.exports = router.get('/getAccount', controller.getAccount)
