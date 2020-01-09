const router = require('koa-router')()
const cpcb = require('./../service/cpcallback')


module.exports = router.post( '/callback', cpcb.cpcb)