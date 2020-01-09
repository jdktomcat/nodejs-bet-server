const router = require('koa-router')()
const action = require('./../service/supply')

//
//新增游戏
module.exports = router.post('/addGame', action.addGames)
//edit游戏
module.exports = router.get('/editGame', action.editGame)
//update游戏
module.exports = router.post('/updateGame', action.updateGames)
//update游戏倍率
module.exports = router.post('/updateRateById', action.updateRateById)
//下线游戏
module.exports = router.get('/offlineGame', action.offlineGames)
//设置倍率、以及刷新生产上的游戏列表
module.exports = router.post('/setRate', action.setRate)
//上线列表
module.exports = router.get('/list', action.getOnlineList)

// 定时上线
// 定时产品
module.exports = router.post('/insertSchedule', action.insertSchedule)
module.exports = router.get('/deleteSchedule', action.deleteSchedule)
module.exports = router.get('/allSchedule', action.allSchedule)