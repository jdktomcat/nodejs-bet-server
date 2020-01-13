const router = require('koa-router')()

const action = require('./action')
const sum = require('./sumdata')
const query = require('./query')
const supply = require('./supply')
const user = require('./user')
const div = require('./div')
const better = require('./better')

router.use('/data', action.routes(), action.allowedMethods())
router.use('/sum', sum.routes(), sum.allowedMethods())
router.use('/query', query.routes(), query.allowedMethods())
router.use('/supply', supply.routes(), supply.allowedMethods())
router.use('/user', user.routes(), user.allowedMethods())
router.use('/div', div.routes(), div.allowedMethods())
router.use('/better', better.routes(), better.allowedMethods())

module.exports = router