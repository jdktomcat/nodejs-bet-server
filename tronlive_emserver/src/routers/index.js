const router = require('koa-router')()

const action = require('./action')
const platius = require('./platius')

router.use('/', action.routes(), action.allowedMethods())
router.use('/platius', platius.routes(), platius.allowedMethods())

module.exports = router