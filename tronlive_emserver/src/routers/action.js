/**
 * 用户牌局操作接口
 */

const router = require('koa-router')()
const action = require('./../service/platapi')

module.exports = router.post( '', action.All)
module.exports = router.post( 'GetAccount', action.GetAccount)
module.exports = router.post( 'Result', action.Result)
module.exports = router.post( 'Wager', action.Wager)
module.exports = router.post( 'GetBalance', action.GetBalance)
module.exports = router.post( 'Rollback', action.RollBack)
module.exports = router.post( 'GetTransactionStatus', action.GetTransactionStatus)