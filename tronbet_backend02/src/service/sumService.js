const {depositData, getPages, lotteryLog,lotteryCount, getBonus, queryScores,queryScoresFile} = require('../model/deposit')
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

async function eventAll(ctx) {
    const data = await queryScores()
    ctx.body = {
        code: 200,
        data: data,
    }
}

async function eventAllFile(ctx) {
    const data = await queryScoresFile()
    const Readable = require('stream').Readable;
    const s = new Readable();
    s._read = () => {}; // redundant? see update below
    s.push(data);
    s.push(null);
    //
    const fileName = 'activity_'+ Date.now()
    ctx.response.set('Content-disposition', `attachment;filename=${fileName}`);
    ctx.response.set("content-type", "txt/html");
    ctx.body = s
}

module.exports = {
    queryDepositTmp,
    queryPages,
    getLotteryLog,
    getBonusAPI,
    bonusCount,
    eventAll,
    eventAllFile,
}