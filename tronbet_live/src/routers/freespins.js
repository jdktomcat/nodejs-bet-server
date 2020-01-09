const router = require('koa-router')()
const freepins = require('./../service/freepins')

module.exports = router.get( '/', freepins.freespins)
module.exports = router.post( '/', freepins.freespins)