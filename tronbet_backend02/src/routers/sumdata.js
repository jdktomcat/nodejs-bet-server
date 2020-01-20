const router = require('koa-router')()
const service = require('../service/sumService')
const action = require('./../controller/supplyController')

module.exports = router.get('/deposit', service.queryDepositTmp)
// module.exports = router.post('/addBonus', service.addBonusAPI)
// module.exports = router.get('/removeBonus', service.removeBonusAPI)
module.exports = router.get('/getBonus', service.getBonusAPI)
module.exports = router.get('/bonusCount', service.bonusCount)

//补发
// module.exports = router.post('/make', action.GetEissue)
module.exports = router.get('/reissueList', action.reissueList)
module.exports = router.get('/page', service.queryPages)
module.exports = router.get('/lottery_log', service.getLotteryLog)
