const router = require('koa-router')()
const action = require('./../controller/userController')

//查询充值记录
module.exports = router.post('/login', action.login)
module.exports = router.post('/register', action.register)
module.exports = router.post('/removeOld', action.removeOldUser)
module.exports = router.post('/removeNew', action.removeNewUser)
module.exports = router.post('/addOld', action.addOld)
