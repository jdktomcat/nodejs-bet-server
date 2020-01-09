const tronUtils = require('./robotUtils')

const redisUtil = require('./src/utils/redisUtil')

const common = require('./src/utils/common')

const db = require('./src/utils/dbUtil')

const tronweb = tronUtils.getTronWeb('master')

const axios = require('axios')


async function getDatas(start, end){
    let sql = 'select id, addr from tron_bet_event where addr = ?'
    let res = await db.exec(sql, [addr])
    if (_.isEmpty(res)) return 0
    return Number(res[0].trx)
}