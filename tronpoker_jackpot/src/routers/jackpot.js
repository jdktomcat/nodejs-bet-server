/**
 * 用户牌局操作接口
 */

const router = require('koa-router')()
const jackpot = require('../service/jackpot')

module.exports = router.post( '/getJackpotLogs', jackpot.getJackpotLogsByAddr)
module.exports = router.post( '/profit', jackpot.realTimeProfit)
module.exports = router.post( '/histRank', jackpot.histData)

module.exports = router.get( '/getJackpotLogs', jackpot.getJackpotLogsByAddr)
module.exports = router.get( '/profit', jackpot.realTimeProfit)
module.exports = router.get( '/histRank', jackpot.histData)
