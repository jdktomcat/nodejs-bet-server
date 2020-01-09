const router = require('koa-router')()
const rank = require('./../service/rank')

module.exports = router.get( '/', rank.rank)
module.exports = router.post( '/', rank.rank)