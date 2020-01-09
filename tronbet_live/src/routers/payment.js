/**
 * 用户充提款项操作
 */

const router = require('koa-router')()
const payment = require('./../service/payment')

module.exports = router.get( '/withdraw', payment.withdraw )