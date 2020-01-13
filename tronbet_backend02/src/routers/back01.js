const router = require('koa-router')()

const back01Controller = require('./../controller/back01Controller')

module.exports = router.post('/overview', back01Controller.overview)
module.exports = router.post('/search', back01Controller.search)