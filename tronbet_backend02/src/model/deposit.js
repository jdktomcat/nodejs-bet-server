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
//

const rewardLog = async function (id) {
    let data
    if(id === ''){
        const t = `select addr,ltyId,types,num,from_unixtime(ts / 1000,'%Y-%m-%d %H:%i:%S') as time from tron_bet_event.years_lottery_log`
        data = await raw(t, [])
    }else {
        const t = `select addr,ltyId,types,num,from_unixtime(ts / 1000,'%Y-%m-%d %H:%i:%S') as time from tron_bet_event.years_lottery_log where ltyId = ?`
        data = await raw(t, [id])
    }
    return data
}

/**
 *
 */
const lotteryCount = async function () {
    const t = `select ltyId as rollId,count(1) as count from tron_bet_event.years_lottery_log group by ltyId `
    const data = await raw(t, [])
    return data
}

/**
 *
 */
const getBonus = async function () {
    const t = `select id,name,status,ts from tron_bet_event.years_bonus_name order by ts desc`
    const data = await raw(t, [])
    return data
}


const addBonus = async function (name) {
    const t = `insert into tron_bet_event.years_bonus_name(name,status,ts) values (?,?,?)`
    const data = await raw(t, [name, '0', Date.now()])
    return data
}


const removeBonus = async function (id) {
    const t = `delete from tron_bet_event.years_bonus_name where id = ?`
    const data = await raw(t, [id])
    return data
}



const queryScores = async function () {
    const t = `select round,addr,score from tron_bet_event.years_suit_score group by round desc,score desc`
    const data = await raw(t, [])
    const dict = {
        '0' : '2020-01-26',
        '1' : '2020-01-27',
        '2' : '2020-01-28',
        '3' : '2020-01-29',
        '4' : '2020-01-30',
        '5' : '2020-01-31',
        '6' : '2020-02-01',
        '7' : '2020-02-02',
        '8' : '2020-02-03',
    }
    data.forEach(e=>e.day = dict[e.round] || '')
    return data
}

const queryScoresFile = async function() {
    const data = await queryScores()
    const keys = Object.keys(data[0])
    let sbody = ''
    keys.forEach(e => {
        sbody += e + "\t"
    })
    sbody = sbody.trim()
    sbody += "\n"
    //
    data.forEach(e => {
        keys.forEach((k) => {
            let t = e[k] || 0
            sbody = sbody + t + '\t'
        })
        sbody = sbody.trim()
        sbody += '\n'
    })
    return sbody
}


module.exports = {
    depositData,
    getPages,
    lotteryLog,
    rewardLog,
    lotteryCount,
    getBonus,
    addBonus,
    removeBonus,
    queryScores,
    queryScoresFile,
}