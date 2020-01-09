/**
 * 用户牌局操作接口
 */

const router = require('koa-router')()
const action = require('../service/gameinfo')

module.exports = router.get( '/total', action.totalData)
module.exports = router.get( '/rank', action.rank)
module.exports = router.get( '/profit', action.profit)
module.exports = router.get('/dailyData', action.dailyData)
module.exports = router.get('/cates', action.getCates)
module.exports = router.get('/games', action.getGames)
module.exports = router.get('/liveData', action.dailyLiveData)
module.exports = router.get('/activityCount', action.activityCount)