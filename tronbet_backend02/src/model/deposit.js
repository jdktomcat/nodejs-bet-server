const {raw} = require("./utils/dbutils")

const depositSQL = function () {
    let t = `select * from tron_live.live_cb_deposit_log where addr = ?`
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


const getPages = async function () {
    const t = 'select gid,sum(num) as total from tron_bet_event.years_user_bag group by gid '
    const dict = {
        1: 1,
        2: 1,
        3: 1,
        4: 2,
        5: 2,
        6: 5,
        7: 5,
        8: 10,
        9: 10,
        10: 10,
    }
    const data = await raw(t, [])
    let s = []
    for (let e of data) {
        let o = {
            gid: e.gid,
            num: e.total,
            trx: dict[e.gid],
        }
        s.push(o)
    }
    return s
}


const lotteryLog = async function () {
    const t = `SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(1) as count
        FROM
            tron_bet_event.years_lottery_log
            group by from_unixtime(ts / 1000,'%Y-%m-%d')`
    const data = await raw(t, [])
    return data
}


module.exports = {
    depositData,
    getPages,
    lotteryLog
}