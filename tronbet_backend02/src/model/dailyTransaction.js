const {raw, newUtcTime,getdayList,getTimeFormat} = require("./utils/dbutils")
const {getDiceData} = require("./dice/dice")

const getMoon = async function (startDate, endDate) {
    const sql = `
            SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(distinct addr)  as dau,
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

/**
 * 统计扫雷游戏
 *
 * @param startDate 开始时间
 * @param endDate 结束时间
 * @returns {Promise<*>}
 */
const getMine = async function(startDate, endDate){
    const sql = `
            SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(distinct addr) as dau,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win_amount) / 1000000  as all_win,
            (sum(amount) - sum(win_amount)) / 1000000 as balance
        FROM
            tron_bet_wzc.mine_event_log
        WHERE
            ts >= ?
            AND ts < ?
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    return await raw(sql, params)
}

const getRing = async function (startDate, endDate) {
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(distinct addr)  as dau,
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
    count(distinct player1)  as dau,
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
        g.day,
        sum(g.dau) as dau,   
        sum(g.count) as count,   
        sum(g.all_amount) as all_amount,   
        sum(g.all_win) as all_win,
        sum(g.all_amount) - sum(g.all_win) as balance   
    from (    
        select
            count(distinct addr)  as dau,
            count(1) as count,
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            sum(amount) as all_amount,
            0 as all_win
        from
            tron_live.live_action_log_v2
        where
            ts >= ?
            AND ts < ?
            and action = 'bet'
            and txstatus = 1
            group by from_unixtime(ts / 1000,'%Y-%m-%d')    
        union all
        select
            count(distinct addr)  as dau,
            0 as count,
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            0 as all_amount,
            sum(amount) as all_win
        from
            tron_live.live_action_log_v2
        where
            ts >= ?
            AND ts < ?
            and action = 'result'
            and txstatus = 1
            and currency = 'trx'
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    ) as g group by g.day
    `
    const start = newUtcTime(startDate).getTime()
    const end = newUtcTime(endDate).getTime()
    const params = [
        start, end, start, end
    ]
    const rs1 = await raw(sql, params)
    return rs1
}

const getHub88 = async function (startDate, endDate) {
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(distinct email)  as dau,
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
            count(distinct addr)  as dau,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_live.sports_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            AND (status = 50 or status = 51)
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

const getPlatius = async function (startDate, endDate) {
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(distinct addr)  as dau,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_live.platipus_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            AND status = 2
            And resultId is not null
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


const getBinary = async function (startDate, endDate) {
    const sql = `
        SELECT
            from_unixtime(expiration_date / 1000,'%Y-%m-%d') as day,
            count(distinct addr)  as dau,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_live.binary_transaction_log
        WHERE
            expiration_date >= ?
            AND expiration_date < ?
            AND status = 'close'
            AND currency = 'TRX'
            group by from_unixtime(expiration_date / 1000,'%Y-%m-%d')
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
            count(distinct addr)  as dau,
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
            "mine": getMine,
            "duel": getDuel,
            "em": getEM,
            "hub88": getHub88,
            "platius": getPlatius,
            "binary": getBinary,
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
