const {raw} = require("./utils/dbutils")


const getDice = async function (addr,start,end) {
    const sql = `
          SELECT
            count(1) as count,
            sum(a.amount_sun) as all_amount,
            sum(a.payout_sun) as all_win,
            (sum(a.amount_sun) - sum(a.payout_sun)) / 1000000  as balance
          FROM
            tron_bet_admin.dice_user_order as b
          LEFT JOIN
            tron_bet_wzc.dice_events_v3 as a
          ON
            a.order_id = b.order_id 
            and a.addr = b.addr
          WHERE
            b.addr = ? and
            b.ts >= ? and 
            b.ts <= ?
    `
    const params = [
        addr,start,end
    ]
    const t = await raw(sql, params)
    const results = {category: "dice"};
    Object.assign(results, t[0])
    Object.keys(results).forEach(e => results[e] = results[e] || 0)
    return results
}

const getMoon = async function (addr,start,end) {
    const sql = `
        SELECT
            count(1) as count,
            sum(a.amount) / 1000000 as all_amount,
            sum(a.win) / 1000000  as all_win,
            (sum(a.amount) - sum(a.win)) / 1000000  as balance
        FROM
            tron_bet_admin.moon_user_order as a
        WHERE
            a.addr = ?
            AND ts >= ?
            AND ts < ?
            And a.crashAt is not null 
    `
    const params = [
        addr,start,end
    ]
    const t = await raw(sql, params)
    const results = {category: "moon"};
    Object.assign(results, t[0])
    Object.keys(results).forEach(e => results[e] = results[e] || 0)
    return results
}

const getRing = async function (addr,start,end) {
    const sql = `
    SELECT
        count(1) as count,
        sum(a.amount) / 1000000 as all_amount,
        sum(a.win) / 1000000  as all_win,
        (sum(a.amount) - sum(a.win)) / 1000000  as balance
    FROM
        tron_bet_admin.wheel_user_order as a
    WHERE
        a.addr = ?
        AND ts >= ?
        AND ts < ?
    `
    const params = [
        addr,start,end
    ]
    const t = await raw(sql, params)
    const results = {category: "ring"};
    Object.assign(results, t[0])
    Object.keys(results).forEach(e => results[e] = results[e] || 0)
    return results
}


const getNewEM = async function (addr,start,end) {
    const sql = `
select
    sum(g.count) as count,
    sum(g.all_amount) as all_amount,
    sum(g.all_win) as all_win,
    sum(g.all_amount) - sum(g.all_win) as balance,
    currency
    from
(
  select
        count(1) as count,
        sum(amount) as all_amount,
        0 as all_win,
        currency
    from
        tron_live.live_action_log_v2 as a
    where
        a.addr = ?
        and ts >= ${start}
        and ts < ${end}
        and action = 'bet'
        and txstatus = 1
        and currency = ?
 union all
    select
        0 as count,
        0 as all_amount,
        sum(amount) as all_win,
        currency
    from
        tron_live.live_action_log_v2 as a
    where
        a.addr = ?
        and ts >= ${start}
        and ts < ${end}
        and action = 'result'
        and txstatus = 1
        and currency = ?
) as g
    `
    const currency = ['TRX', 'BTC', 'ETH', 'LTC', 'BNB']
    let a = []
    for (let e of currency) {
        const params = [addr, e, addr, e]
        const data = await raw(sql, params)
        data.forEach(d => d.currency = e)
        a = a.concat(data)
    }
    a.forEach(e => e.category = 'em')
    return a
}


const getHub88 = async function (addr,start,end) {
    const sql = `
        SELECT
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_live.swagger_transaction_log as a
        WHERE
            a.email = ?
            and ts >= ${start}
            and ts < ${end}
            AND status = 1
            AND currency = ?
    `
    const currency = ['TRX', 'BTC', 'ETH', 'LTC', 'BNB']
    let a = []
    for (let e of currency) {
        const params = [addr, e]
        const data = await raw(sql, params)
        data.forEach(d => d.currency = e)
        a = a.concat(data)
    }
    a.forEach(e => e.category = 'hub88')
    return a

}

const getSport = async function (addr,start,end) {
    const sql = `
        SELECT
            count(1) as count,
            sum(a.amount) / 1000000 as all_amount,
            sum(a.win) / 1000000  as all_win,
            (sum(a.amount) - sum(a.win)) / 1000000  as balance
        FROM
            tron_live.sports_transaction_log as a
        WHERE
            a.addr = ?
            and ts >= ${start}
            and ts < ${end}
            AND (a.status = 50 or a.status = 51)
            AND a.currency = ?
    `
    const currency = ['TRX', 'USDT', 'BNB']
    let a = []
    for (let e of currency) {
        const params = [addr, e]
        const data = await raw(sql, params)
        data.forEach(d => d.currency = e)
        a = a.concat(data)
    }
    a.forEach(e => e.category = 'sport')
    return a
}


class TransactionByAddrAndDate {
    static async getData(addr,start,end) {
        const typeDict = {
            "dice": getDice,
            "moon": getMoon,
            "ring": getRing,
            "em": getNewEM,
            "hub88": getHub88,
            "sport": getSport,
        }
        let data = []
        for (let e of Object.keys(typeDict)) {
            let o = await typeDict[e](addr,start,end)
            if (o instanceof Array) {
                data = data.concat(o)
            } else {
                o.currency = 'TRX'
                data.push(o)
            }
        }
        return data
    }


    static async getDataFile(addr) {
        const data = await this.getData(addr)
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


module.exports = TransactionByAddrAndDate