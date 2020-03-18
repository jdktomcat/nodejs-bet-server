/**
 * 用户牌局操作接口
 */

const router = require('koa-router')()
const action = require('../service/service')

module.exports = router.post( '/balance', action.balance)
module.exports = router.post( '/bet', action.bet)
module.exports = router.post( '/result', action.result)
module.exports = router.post( '/rollback', action.rollback)
