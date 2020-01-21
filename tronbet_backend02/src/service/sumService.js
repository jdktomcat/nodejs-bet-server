const {depositData, getPages, lotteryLog,lotteryCount, getBonus, addBonus, removeBonus} = require('../model/deposit')
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

async function getBonusAPI(ctx) {
    const data = await getBonus()
    ctx.body = {
        code: 200,
        data: data,
    }
}

async function bonusCount(ctx) {
    const data = await lotteryCount()
    ctx.body = {
        code: 200,
        data: data,
    }
}

module.exports = {
    queryDepositTmp,
    queryPages,
    getLotteryLog,
    getBonusAPI,
    bonusCount,
}