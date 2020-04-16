/**
 * 用户牌局操作接口
 */

const router = require('koa-router')()
const action = require('../controller/controller')

module.exports = router.get( '/identify', action.identify)
module.exports = router.post( '/buy', action.buy)
module.exports = router.post( '/close', action.close)
module.exports = router.post( '/refund', action.refund)
