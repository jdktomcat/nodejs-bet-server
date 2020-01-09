const {depositData,getPages,lotteryLog} = require('../model/deposit')
//
const _ = require("lodash")


async function queryDepositTmp(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }
    let addr = params.addr || ''
    if (addr === '') {
        ctx.body = "address is empty."
    }
    console.log(params)
    console.log(addr)
    const data = await depositData(addr)
    ctx.body = data
}


async function queryPages(ctx) {
    const data = await getPages()
    ctx.body = data
}


async function getLotteryLog(ctx) {
    const data = await lotteryLog()
    ctx.body = data
}


module.exports = {
    queryDepositTmp,
    queryPages,
    getLotteryLog
}