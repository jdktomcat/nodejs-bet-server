/**
 * 用户牌局操作接口
 */

const router = require('koa-router')()
const action = require('./../service/platapi')

module.exports = router.get( 'ping', action.ping)
module.exports = router.get( 'identify', action.identify)
module.exports = router.post( 'bet/make', action.betMake)
module.exports = router.post( 'bet/commit', action.betCommit)
module.exports = router.post( 'bet/settlement', action.betSettlement)
module.exports = router.post( 'bet/refund', action.betRefund)
module.exports = router.post( 'bet/win', action.betWin)
module.exports = router.post( 'bet/cancel', action.betCancel)
module.exports = router.post( 'bet/discard', action.betDiscard)
module.exports = router.post( 'bet/rollback', action.betRollback)


