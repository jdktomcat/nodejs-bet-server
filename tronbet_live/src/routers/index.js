const router = require('koa-router')()

const action = require('./action')
const payment = require('./payment')
const user = require('./user')
// const freespins = require('./freespins')
const rank = require('./rank')
const account = require('./account')
const cpcallback = require('./cpcallback')
const supply = require('./supply')
const sum = require('./sum')
const div = require('./div')

// router.use('/', action.routes(), action.allowedMethods())
// router.use('/freespins', freespins.routes(), freespins.allowedMethods())
// router.use('/payment', payment.routes(), payment.allowedMethods())
router.use('/user', user.routes(), user.allowedMethods())
router.use('/rank', rank.routes(), rank.allowedMethods())
router.use('/account', account.routes(), account.allowedMethods())
// router.use('/plat', account.routes(), account.allowedMethods())  //兼容格式
router.use('/coinspaids', cpcallback.routes(), cpcallback.allowedMethods())
router.use('/supply', supply.routes(), supply.allowedMethods())
router.use('/sum', sum.routes(), sum.allowedMethods())
router.use('/div', div.routes(), div.allowedMethods())

module.exports = router