const router = require('koa-router')()
const controller = require('../controller/diceController')

/**
 * query gameId
 */
module.exports = router.get('/queryDice', controller.queryDice)
module.exports = router.get('/queryMoon', controller.queryMoon)
module.exports = router.get('/queryRing', controller.queryRing)
