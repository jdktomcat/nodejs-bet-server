const router = require('koa-router')()
const controller = require('../controller/liveController')

/**
 * query gameId
 */
module.exports = router.get('/getFileByGameId', controller.getFileByGameId)
module.exports = router.get('/getListByGameId', controller.getListByGameId)
module.exports = router.get('/getAccount', controller.getAccount)
module.exports = router.get('/getBalanceFile', controller.getBalanceFile)
module.exports = router.get('/getEM', controller.getEM)
module.exports = router.get('/getHub88', controller.getHub88)
module.exports = router.get('/getSport', controller.getSport)
module.exports = router.get('/getDeposit', controller.getDeposit)
module.exports = router.get('/getDepositFile', controller.getDepositFile)
module.exports = router.get('/getWithDraw', controller.getWithDraw)
module.exports = router.get('/getWithDrawFile', controller.getWithDrawFile)
module.exports = router.get('/getDropList', controller.getDropList)
module.exports = router.get('/getOtherCurrencyList', controller.getOtherCurrencyList)
module.exports = router.get('/getOtherCurrencyFile', controller.getOtherCurrencyFile)
module.exports = router.get('/getAirDropList', controller.queryAirDropData)
module.exports = router.get('/queryBlackList', controller.queryBlackList)
module.exports = router.post('/addBlackList', controller.addBlackList)
module.exports = router.post('/getLiveAllData', controller.getLiveAllData)
