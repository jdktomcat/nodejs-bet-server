const db = require('../utils/dbUtil')

const raw = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}

const depositSQL = function () {
    let t = `
    select
    *
from
    tron_live.live_cb_deposit_log
where
    addr = ?
    `
    return t
}

const getTimeStr = function (time) {
    const date = new Date(time)
    const y = date.getUTCFullYear()
    const m = date.getUTCMonth() + 1
    const d = date.getUTCDate()
    const h = date.getUTCHours()
    const min = date.getUTCMinutes()
    const ss = date.getUTCSeconds()
    const o = y + '-' + m + '-' + d + ` ${h}:${min}:${ss}`
    return o
}


const depositData = async function (addr) {
    const sql = depositSQL()
    const params = [addr]
    const data = await raw(sql, params)
    //parse data
    let o = []
    data.forEach(e => {
        let ele = {
            addr: e.addr,
            day: getTimeStr(e.ts),
            transactionId: e.txId,
            amount: e.amount / 1000000,
            currency: e.currency,
            timestamp: e.ts,
        }
        o.push(ele)
    })
    return o
}


const reissueRecord = async function () {
    let sql = `select * from tron_live.live_reissue_record`
    const data = await raw(sql, [])
    data.forEach(e => {
        e.time = getTimeStr(new Date(e.ts))
    })
    return data
}


module.exports = {
    depositData,
    reissueRecord
}