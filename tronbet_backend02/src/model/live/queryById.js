const {newUtcTime, raw} = require("./../utils/dbutils")


const getDataOfEM = async function (startDate, endDate, gameId) {
    const sql = `
        select
            g.dau,
            sum(g.all_amount) as all_amount,
            sum(g.all_win) as all_win,
            sum(g.all_amount) - sum(g.all_win) as balance
        from (
            select
                from_unixtime(ts / 1000,'%Y-%m-%d') as day,
                count(distinct addr)  as dau,
                sum(amount) as all_amount,
                0 as all_win
            from tron_live.live_action_log_v2
            where ts >= ?
                AND ts < ?
                and EMGameId = ?
                and action = 'bet'
                and txstatus = 1
                and currency = 'TRX'
                group by from_unixtime(ts / 1000,'%Y-%m-%d')
            union all
            select
                from_unixtime(ts / 1000,'%Y-%m-%d') as day,
                0 as dau,
                0 as all_amount,
                sum(amount) as all_win
            from tron_live.live_action_log_v2
            where ts >= ?
                AND ts < ?
                and EMGameId = ?
                and action = 'result'
                and txstatus = 1
                and currency = 'TRX'
                group by from_unixtime(ts / 1000,'%Y-%m-%d')
        ) as g
        group by g.day
    `
    const start = newUtcTime(startDate).getTime()
    const end = newUtcTime(endDate).getTime()
    const o = await raw(sql, [
        start, end, gameId, start, end, gameId
    ])
    o.forEach(e => e.game_id = gameId)
    return o
}


const getDataOfHub88 = async function (startDateTmp, endDateTmp,gameId) {
    const startDate = newUtcTime(startDateTmp).getTime()
    const endDate = newUtcTime(endDateTmp).getTime()
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(distinct email)  as dau,
            SUM(amount) / 1000000 as all_amount,
            SUM(win) / 1000000  as all_win,
            SUM(amount) / 1000000  - SUM(win) / 1000000  as balance
        FROM
            tron_live.swagger_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            and gameId = ?
            AND status = 1
            AND currency = 'TRX'
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    `
    let params = [
        startDate,
        endDate,
        gameId,
    ]
    const t = await raw(sql, params)
    t.forEach(e => {
        e.game_id = gameId
    })
    return t
}

const getDataOfSport = async function (startDateTmp, endDateTmp, gameId) {
    const sql = `
        SELECT
            from_unixtime(a.ts / 1000,'%Y-%m-%d') as day,
            count(distinct a.addr)  as dau,
            SUM(a.amount) / 1000000  as all_amount,
            SUM(a.win) / 1000000  as all_win,
            SUM(a.amount) / 1000000  - SUM(a.win) / 1000000  as balance
        FROM
            tron_live.sports_transaction_log a
            left join (
                select distinct transactionId as transactionId
                from tron_live.sports_bet_detail_log
                where sportId = ?
            )  b  on a.transactionId = b.transactionId
        WHERE
            a.transactionId = b.transactionId
            and a.ts >= ?
            AND a.ts < ?
            AND a.status >= 50
            AND a.currency = 'TRX'
            group by from_unixtime(a.ts / 1000,'%Y-%m-%d')
    `
    const startDate = newUtcTime(startDateTmp).getTime()
    const endDate = newUtcTime(endDateTmp).getTime()
    let params = [
        gameId,
        startDate,
        endDate,
    ]
    const t = await raw(sql,params)
    t.forEach(e => {
        e.game_id = gameId
    })
    return t
}


class QueryById {

    static async getData(type, start, end,gameId) {
        const liveDict = {
            "em": getDataOfEM,
            "hub88": getDataOfHub88,
            "sport": getDataOfSport,
        }
        const data = await liveDict[type](start, end,gameId)
        return data
    }

    static async getDataFile(type, startDate, endDate,gameId) {
        const data = await this.getTopLoss(type, startDate, endDate)
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

QueryById.getData('sport','2020-02-01','2020-02-10','1').then(e=>{
    console.log(e)
})


module.exports = QueryById