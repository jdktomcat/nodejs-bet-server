const router = require('koa-router')()
const action = require('./../controller/back01Controller')


module.exports = router.post('/overview', action.overview)
module.exports = router.post('/search', action.search)
