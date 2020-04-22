/**
 * 用户牌局操作接口
 */

const router = require('koa-router')()
const action = require('../controller/controller')

module.exports = router.post( '/identify', action.identify)
module.exports = router.post( '/option/buy', action.buy)
module.exports = router.post( '/option/close', action.close)
module.exports = router.post( '/option/refund', action.refund)
