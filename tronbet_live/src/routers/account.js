/**
 * 用户登录登出等接口
 */

const router = require('koa-router')()
const account = require('./../service/account')


module.exports = router.get( '/sendVerifyCode', account.sendUserVerifyCode)
module.exports = router.get( '/login', account.userLogin)
module.exports = router.get( '/register', account.userRegister)
module.exports = router.get( '/resetPass', account.resetPass)
module.exports = router.get( '/getSvgCode', account.genLocalVerifyCode)

module.exports = router.post( '/sendVerifyCode', account.sendUserVerifyCode)
module.exports = router.post( '/login', account.userLogin)
module.exports = router.post( '/register', account.userRegister)
module.exports = router.post( '/resetPass', account.resetPass)
module.exports = router.post( '/getDepositAddr', account.UserDeposit)
module.exports = router.post( '/takeWithdraw', account.userWithdraw)
module.exports = router.post( '/getBalance', account.getBalance)
module.exports = router.post( '/getSessionId', account.getEMSessionId)
module.exports = router.post( '/getSportsKey', account.getSportsKey)
module.exports = router.post( '/setCurrency', account.setCurrency)
module.exports = router.post( '/setHead', account.setAccountHead)
module.exports = router.post( '/changeForgotPass', account.forgotPass)
module.exports = router.post( '/authChangeKey', account.generateResetKey)

module.exports = router.post( '/getWithDrawLog', account.getWithdrawHist)
module.exports = router.post( '/getDepositLog', account.getDepositHist)


module.exports = router.post( '/getSvgCode', account.genLocalVerifyCode)

module.exports = router.post( '/startUrl', account.getLanchUrl)
module.exports = router.post( '/games', account.getSwaggerGames)
