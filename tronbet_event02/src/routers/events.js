/**
 * 用户牌局操作接口
 */

const router = require('koa-router')()
const events = require('../service/events')

module.exports = router.get( '/logs', events.logs)
module.exports = router.get( '/bags', events.bags)
module.exports = router.get( '/openBox', events.openBox)
module.exports = router.get( '/sell', events.sell)
module.exports = router.get( '/exchange', events.exchange)
module.exports = router.get( '/rank', events.rank)

module.exports = router.post( '/logs', events.logs)
module.exports = router.post( '/bags', events.bags)
module.exports = router.post( '/openBox', events.openBox)
module.exports = router.post( '/sell', events.sell)
module.exports = router.post( '/exchange', events.exchange)
module.exports = router.post( '/rank', events.rank)
module.exports = router.post( '/trank', events.totalRank)
module.exports = router.post( '/roll', events.startLottry)
module.exports = router.post( '/lotteryLogs', events.getLotteryLogs)
module.exports = router.post( '/luckyUser', events.getLuckyUser)
