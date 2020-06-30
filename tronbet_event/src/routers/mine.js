/**
 * 用户牌局操作接口
 */

const router = require('koa-router')()
const controller = require("./../controller/mineController")

module.exports = router.post('/queryBoxNum', controller.queryBoxNum)
module.exports = router.post('/queryLetterList', controller.queryLetterList)
module.exports = router.post('/querySendLogs', controller.querySendLogs)
module.exports = router.post('/openMineBox', controller.openMineBox)
module.exports = router.post('/exchangeCard', controller.exchangeCard)
module.exports = router.post('/sellCard', controller.sellCard)
module.exports = router.get('/test', controller.test)
