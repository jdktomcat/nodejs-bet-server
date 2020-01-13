const router = require('koa-router')()
const service = require('../service/sumService')
const action = require('./../controller/supplyController')
const back01Controller = require('./../controller/back01Controller')

module.exports = router.get('/deposit', service.queryDepositTmp)
//补发
module.exports = router.post('/make', action.GetEissue)
module.exports = router.get('/reissueList', action.reissueList)
module.exports = router.get('/page', service.queryPages)
module.exports = router.get('/lottery_log', service.getLotteryLog)
//
module.exports = router.post('/overview', back01Controller.overview)
module.exports = router.post('/search', back01Controller.search)