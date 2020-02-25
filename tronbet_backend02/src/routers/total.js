const router = require('koa-router')()
const controller = require('../controller/totalController')

/**
 * query gameId
 */
module.exports = router.get('/getTotalData', controller.getTotalData)
module.exports = router.get('/getTotalFile', controller.getTotalFile)

