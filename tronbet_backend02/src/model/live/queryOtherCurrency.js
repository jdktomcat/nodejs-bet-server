const {newUtcTime, raw} = require("./../utils/dbutils")

const getEM = async function (currency, startDate, endDate) {
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
            and currency = ?
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
            and currency = ?
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    ) as g group by g.day
    `
    const start = newUtcTime(startDate).getTime()
    const end = newUtcTime(endDate).getTime()
    const params = [
        start, end, currency,
        start, end, currency
    ]
    const rs1 = await raw(sql, params)
    return rs1
}


const getHub88 = async function (currency, startDate, endDate) {
    let unit = 1000000000
    if(currency === 'USDT'){
        unit = 1000000
    }
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(distinct email)  as dau,
            count(1) as count,
            sum(amount) / ${unit} as all_amount,
            sum(win) / ${unit}  as all_win,
            (sum(amount) - sum(win)) / ${unit}  as balance
        FROM
            tron_live.swagger_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            AND status = 1
            AND currency = ?
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime(),
        currency
    ]
    const data = await raw(sql, params)
    return data
}

const getSport = async function (currency, startDate, endDate) {
    let unit = 1000000000
    if(currency === 'USDT'){
        unit = 1000000
    }
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(distinct addr)  as dau,
            count(1) as count,
            sum(amount) /  ${unit}  as all_amount,
            sum(win) /  ${unit}   as all_win,
            (sum(amount) - sum(win)) /  ${unit}   as balance
        FROM
            tron_live.sports_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            AND status >= 50
            AND currency = ?
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime(),
        currency,
    ]
    const data = await raw(sql, params)
    return data
}

class QueryOtherCurrency {

    static async getData(p) {
        ['vendor', 'currency', 'startDate', 'endDate'].forEach(e => p[e] = p[e] || '')
        const {vendor, currency, startDate, endDate} = p
        const vendorDict = {
            "em": getEM,
            "hub88": getHub88,
            "sport": getSport,
        }
        const data = await vendorDict[vendor](currency, startDate, endDate)
        return data
    }


    static async getDataFile(p) {
        const data = await this.getDailyData(p)
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

module.exports = QueryOtherCurrency