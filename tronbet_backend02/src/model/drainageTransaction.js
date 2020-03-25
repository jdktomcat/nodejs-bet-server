const {raw, newUtcTime } = require("./utils/dbutils")

const getDice = async function (type, startDate, endDate) {
    const sql = `
        SELECT
            count(1) as count,
            sum(a.amount_sun) / 1000000 as all_amount,
            sum(a.payout_sun) / 1000000  as all_win,
            (sum(a.amount_sun) - sum(a.payout_sun)) / 1000000  as balance
        FROM
            tron_bet_wzc.dice_events_v3 as a
            left join  (
                select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
            ) as b on a.addr = b.addr
        WHERE
            a.addr = b.addr
    `
    const params = [
        type,
    ]
    const t = await raw(sql, params)
    const results = {category: "dice"};
    Object.assign(results, t[0])
    Object.keys(results).forEach(e => results[e] = results[e] || 0)
    return results
}

const getMoon = async function (type, startDate, endDate) {
    const sql = `
        SELECT
            count(1) as count,
            sum(a.amount) / 1000000 as all_amount,
            sum(a.win) / 1000000  as all_win,
            (sum(a.amount) - sum(a.win)) / 1000000  as balance
        FROM
            tron_bet_admin.moon_user_order as a
            left join  (
                select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
            ) as b on a.addr = b.addr
        WHERE
            a.addr = b.addr
            And a.crashAt is not null 
            and a.ts >= ?
            AND a.ts < ?
    `
    const params = [
        type,
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const t = await raw(sql, params)
    const results = {category: "moon"};
    Object.assign(results, t[0])
    Object.keys(results).forEach(e => results[e] = results[e] || 0)
    return results
}

const getRing = async function (type, startDate, endDate) {
    const sql = `
    SELECT
        count(1) as count,
        sum(a.amount) / 1000000 as all_amount,
        sum(a.win) / 1000000  as all_win,
        (sum(a.amount) - sum(a.win)) / 1000000  as balance
    FROM
        tron_bet_admin.wheel_user_order as a
        left join  (
            select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
        ) as b on a.addr = b.addr
    WHERE
        a.addr = b.addr
        and a.ts >= ?
        AND a.ts < ?
    `
    const params = [
        type,
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const t = await raw(sql, params)
    const results = {category: "ring"};
    Object.assign(results, t[0])
    Object.keys(results).forEach(e => results[e] = results[e] || 0)
    return results
}

const getDuel = async function (type, startDate, endDate) {
    const sql = `
SELECT
    count(1) as count,
    sum(a.amount) / 1000000 as all_amount,
    sum(a.win) / 1000000  as all_win,
    (sum(a.amount) - sum(a.win)) / 1000000  as balance
FROM
    tron_bet_admin.wheel_solo_order as a
    left join  (
        select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
    ) as b on a.player1 = b.addr
WHERE
    a.player1 = b.addr
    AND a.status = 3
    AND a.endTs >= ?
    AND a.endTs < ?

UNION ALL


SELECT
    count(1) as count,
    sum(a.amount) / 1000000 as all_amount,
    sum(a.win) / 1000000  as all_win,
    (sum(a.amount) - sum(a.win)) / 1000000  as balance
FROM
    tron_bet_admin.wheel_solo_order as a
    left join  (
        select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
    ) as b on a.player2 = b.addr
WHERE
    a.player2 = b.addr
    AND a.status = 3
    AND a.endTs >= ?
    AND a.endTs < ?

UNION ALL

SELECT
    count(1) as count,
    sum(a.amount) / 1000000 as all_amount,
    sum(a.win) / 1000000  as all_win,
    (sum(a.amount) - sum(a.win)) / 1000000  as balance
FROM
    tron_bet_admin.wheel_solo_order as a
    left join  (
        select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
    ) as b on a.player3 = b.addr
WHERE
    a.player3 = b.addr
    AND a.status = 3
    AND a.endTs >= ?
    AND a.endTs < ?

UNION ALL

SELECT
    count(1) as count,
    sum(a.amount) / 1000000 as all_amount,
    sum(a.win) / 1000000  as all_win,
    (sum(a.amount) - sum(a.win)) / 1000000  as balance
FROM
    tron_bet_admin.wheel_solo_order as a
    left join  (
        select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
    ) as b on a.player4 = b.addr
WHERE
    a.player4 = b.addr
    AND a.status = 3
    AND a.endTs >= ?
    AND a.endTs < ?
    `
    const params = [
        type,
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime(),
        type,
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime(),
        type,
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime(),
        type,
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime(),
    ]
    const t = await raw(sql, params)
    const keys = ['count', 'all_amount', 'all_win', 'balance']
    const arr = t.reduce((a, b) => {
        keys.forEach(e => b[e] = b[e] || Number(b[e]))
        keys.forEach(k => a[k] = a[k] + b[k])
        return a
    }, {
        count: 0,
        all_amount: 0,
        all_win: 0,
        balance: 0
    })
    // console.log("debug--------", arr)
    const o = Object.assign({category: "duel"}, arr)
    return o
}

const getEM = async function (type, startDate, endDate) {
    const sql = `
  
  select
        count(1) as count,
        sum(amount) as all_amount,
        0 as all_win
    from
        tron_live.live_action_log_v2 as a
        left join  (
            select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
        ) as b on a.addr = b.addr
    where
        a.addr = b.addr
        and ts >= ?
        AND ts < ?
        and action = 'bet'
        and txstatus = 1
        and currency = 'trx'

 union all

    select
        count(1) as count,
        0 as all_amount,
        sum(amount) as all_win
    from
        tron_live.live_action_log_v2 as a
        left join  (
            select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
        ) as b on a.addr = b.addr
    where
        a.addr = b.addr
        and ts >= ?
        AND ts < ?
        and action = 'result'
        and txstatus = 1
        and currency = 'trx'
    `
    const actionsStart = newUtcTime(startDate).getTime()
    const actionsEnd = newUtcTime(endDate).getTime()
    const params = [
        type,
        actionsStart,
        actionsEnd,
        type,
        actionsStart,
        actionsEnd,
    ]
    const rs = await raw(sql, params)
    const count = rs[0].count
    const all_amount = rs[0].all_amount
    const all_win = rs[1].all_win
    const category = "em"
    const s = {
        category,
        count,
        all_amount,
        all_win
    }
    Object.keys(s).forEach(e => s[e] = s[e] || 0)
    s.balance = s.all_amount - s.all_win
    return s

}

const getHub88 = async function (type, startDate, endDate) {
    const sql = `
        SELECT
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_live.swagger_transaction_log as a
            left join  (
                select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
            ) as b on a.email = b.addr
        WHERE
            a.email = b.addr
            and ts >= ?
            AND ts < ?
            AND status = 1
            AND currency = 'TRX'
    `
    const params = [
        type,
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const data = await raw(sql, params)
    const results = {category: "hub88"};
    Object.assign(results, data[0])
    Object.keys(results).forEach(e => results[e] = results[e] || 0)
    return results

}

const getSport = async function (type, startDate, endDate) {
    const sql = `
        SELECT
            count(1) as count,
            sum(a.amount) / 1000000 as all_amount,
            sum(a.win) / 1000000  as all_win,
            (sum(a.amount) - sum(a.win)) / 1000000  as balance
        FROM
            tron_live.sports_transaction_log as a
            left join  (
                select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
            ) as b on a.addr = b.addr
        WHERE
            a.addr = b.addr
            and a.ts >= ?
            AND a.ts < ?
            AND (a.status = 50 or a.status = 51)
            AND a.currency = 'TRX'
    `
    const params = [
        type,
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const data = await raw(sql, params)
    const results = {category: "sport"};
    Object.assign(results, data[0])
    Object.keys(results).forEach(e => results[e] = results[e] || 0)
    return results
}

const getPoker = async function (type, startDate, endDate) {
    const sql = `
        select
            count(1) as count,
            sum(a.amount) / 1000000 as all_amount,
            0 as all_win,
            (sum(a.amount) + sum(a.oldAmount) - sum(a.newAmount)) / 1000000  as balance
        from
            tronbet_poker_log.poker_revenue_log as a
            left join  (
                        select distinct address as addr from tron_bet_admin.activity_count where address != 'visitor_address' and type = ?
                    ) as b on a.addr = b.addr
        where
            a.addr = b.addr
            and a.cointype = 'TRX'
            AND a.action < 100
            AND  a.optime >= ?
            AND a.optime < ?
    `
    const params = [
        type,
        newUtcTime(startDate).getTime() / 1000,
        newUtcTime(endDate).getTime() / 1000
    ]
    const data = await raw(sql, params)
    const results = {category: "poker"};
    Object.assign(results, data[0])
    Object.keys(results).forEach(e => results[e] = results[e] || 0)
    return results
}

class DrainageTransaction {

    static async getDrainageData(type, startDate, endDate) {
        const typeDict = {
            "dice": getDice,
            "moon": getMoon,
            "ring": getRing,
            "duel": getDuel,
            "em": getEM,
            "hub88": getHub88,
            "sport": getSport,
            "poker": getPoker,
        }
        const data = []
        for (let e of Object.keys(typeDict)) {
            let o = await typeDict[e](type, startDate, endDate)
            data.push(o)
        }
        // console.log(data)
        return data
    }


    static async getDrainageDataFile(type, startDate, endDate) {
        const data = await this.getDrainageData(type, startDate, endDate)
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

module.exports = DrainageTransaction