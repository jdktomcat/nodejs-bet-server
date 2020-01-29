const router = require('koa-router')()
const service = require('../service/sumService')
const action = require('./../controller/supplyController')

module.exports = router.get('/deposit', service.queryDepositTmp)
module.exports = router.get('/getBonus', service.getBonusAPI)
module.exports = router.get('/bonusCount', service.bonusCount)
module.exports = router.get('/reissueList', action.reissueList)
module.exports = router.get('/page', service.queryPages)
module.exports = router.get('/lottery_log', service.getLotteryLog)
module.exports = router.get('/rewards', service.getReward)
//activity
module.exports = router.get('/events', service.eventAll)
module.exports = router.get('/eventsFile', service.eventAllFile)