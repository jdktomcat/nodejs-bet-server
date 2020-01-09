const db = require('../utils/dbUtil')
const _ = require('lodash')._
const poker = require('../utils/poker')


async function getTotalDivAmount() {
    let sql = "select sum(total_trx) amount from rake_div_info"
    let res = await db.exec(sql, [])
    if (_.isEmpty(res)) return 0
    return res[0].amount || 0
}

async function getHistDataByType(types) {
    let sql = "select * from poker_jackpot_log where jackpotType = ? order by jackpotId desc limit 10"
    let res = await db.exec(sql, [types])
    return res
}

async function getAllHistData() {
    let sql = "select * from poker_jackpot_log order by jackpotId desc limit 10"
    let res = await db.exec(sql, [])
    return res
}

module.exports = {
    getTotalDivAmount,
    getHistDataByType,
    getAllHistData
}