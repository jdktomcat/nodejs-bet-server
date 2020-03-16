const router = require('koa-router')()
const action = require('./../service/supply')

//查询充值记录
module.exports = router.get('/deposit', action.queryDeposit)
module.exports = router.get('/reissueList', action.getReissueRecord)
