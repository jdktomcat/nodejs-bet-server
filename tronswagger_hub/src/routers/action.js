/**
 * 用户牌局操作接口
 */

const router = require('koa-router')()
const action = require('./../service/platapi')

module.exports = router.post( '/user/balance', action.balance)
module.exports = router.post( '/transaction/win', action.win)
module.exports = router.post( '/transaction/rollback', action.rollback)
module.exports = router.post( '/transaction/bet', action.bet)



