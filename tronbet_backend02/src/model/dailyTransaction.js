const {raw, newUtcTime,getdayList,getTimeFormat} = require("./utils/dbutils")
const {getDiceData} = require("./dice/dice")

const getMoon = async function (startDate, endDate) {
    const sql = `
            SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_bet_admin.moon_user_order
        WHERE
            ts >= ?
            AND ts < ?
            And crashAt is not null 
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const t = await raw(sql, params)
    return t
}

const getRing = async function (startDate, endDate) {
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_bet_admin.wheel_user_order
        WHERE
            roll is not null
            AND ts >= ?
            AND ts < ?
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const t = await raw(sql, params)
    return t
}

const getDuel = async function (startDate, endDate) {
    const sql = `
SELECT
    from_unixtime(endTs / 1000,'%Y-%m-%d') as day,
    count(1) as count,
    sum(amount * playerCnt) / 1000000 as all_amount,
    sum(win) / 1000000  as all_win,
    (sum(amount * playerCnt) - sum(win)) / 1000000  as balance
FROM
    tron_bet_admin.wheel_solo_order
WHERE
    status = 3
    AND endTs >= ?
    AND endTs < ?
    group by from_unixtime(endTs / 1000,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const t = await raw(sql, params)
    return t
}

const getEM = async function (startDate, endDate) {
    const sql = `
    select
        count(1) as count,
        from_unixtime(ts / 1000,'%Y-%m-%d') as day,
        sum(amount) as all_amount
    from
        tron_live.live_action_log
    where
        ts >= ?
        AND ts < ?
        and action = ?
        and txstatus = 1
        group by from_unixtime(ts / 1000,'%Y-%m-%d')    
    union all
    select
        count(1) as count,
        from_unixtime(ts / 1000,'%Y-%m-%d') as day,
        sum(amount) as all_amount
    from
        tron_live.live_action_log_v2
    where
        ts >= ?
        AND ts < ?
        and action = ?
        and txstatus = 1
        and currency = 'trx'
        group by from_unixtime(ts / 1000,'%Y-%m-%d')
    `
    const actions = ['bet', 'result']
    const actionsStart = newUtcTime(startDate).getTime()
    const actionsEnd = newUtcTime(endDate).getTime()
    const params1 = [
        actionsStart, actionsEnd, actions[0], actionsStart, actionsEnd, actions[0]
    ]
    const params2 = [
        actionsStart, actionsEnd, actions[1], actionsStart, actionsEnd, actions[1]
    ]
    const rs1 = await raw(sql, params1)
    const rs2 = await raw(sql, params2)
    //
    let dict1 = {}
    let countDict1 = {}
    rs1.forEach(e => {
        dict1[e.day] = e.all_amount || 0
        countDict1[e.day] = e.count || 0
    })
    //
    let dict2 = {}
    let countDict2 = {}
    rs2.forEach(e => {
        dict2[e.day] = e.all_amount || 0
        countDict2[e.day] = e.count || 0
    })
    //
    const dataArray = getdayList(startDate,endDate)
    dataArray.pop()
    let s = []
    for(let e of dataArray){
        const key = getTimeFormat(e)
        //
        let all_amount = dict1[key] || 0
        let count = countDict1[key] || 0
        let all_win = dict2[key] || 0
        let balance = Number(all_amount) - Number(all_win)
        let ele1 = {
            day: key,
            count: count,
            all_amount: all_amount,
            all_win: all_win,
            balance: balance
        }
        s.push(ele1)
    }
    return s

}

const getHub88 = async function (startDate, endDate) {
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_live.swagger_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            AND status = 1
            AND currency = 'TRX'
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const data = await raw(sql, params)
    return data
}

const getSport = async function (startDate, endDate) {
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_live.sports_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            AND status >= 50
            AND currency = 'TRX'
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const data = await raw(sql, params)
    return data
}

const getPoker = async function (startDate, endDate) {
    const sql = `
        select
            from_unixtime(optime,'%Y-%m-%d') as day,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            0 as all_win,
            (sum(amount) + sum(oldAmount) - sum(newAmount)) / 1000000  as balance
        from
            tronbet_poker_log.poker_revenue_log
        where
            cointype = 'TRX'
            AND action < 100
            AND  optime >= ?
            AND optime < ?
            group by from_unixtime(optime,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime() / 1000,
        newUtcTime(endDate).getTime() / 1000
    ]
    const data = await raw(sql, params)
    return data
}

class DailyTransaction{

    static async getDailyData(type, startDate, endDate){
        const typeDict = {
            "dice": getDiceData,
            "moon": getMoon,
            "ring": getRing,
            "duel": getDuel,
            "em": getEM,
            "hub88": getHub88,
            "sport": getSport,
            "poker": getPoker,
        }
        const data = await typeDict[type](startDate, endDate)
        return data
    }


    static async getDailyDataFile(type, startDate, endDate) {
        const data = await this.getDailyData(type, startDate, endDate)
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
}

module.exports = DailyTransaction