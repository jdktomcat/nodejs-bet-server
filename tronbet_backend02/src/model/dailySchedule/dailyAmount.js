const {raw, newUtcTime, getCustomDay, getTimeFormat} = require("../utils/dbutils")

const getDice = async function (start, end) {
    const sql = `
        select
                      count(1) as count,
                      sum(g.amount_sun) / 1000000 as all_amount,
                      sum(g.payout_sun) / 1000000 as all_win,
                      (sum(g.amount_sun)- sum(g.payout_sun)) / 1000000  as balance
         from (
          SELECT
                    dice_user_order.addr,
                    dice_user_order.tx_id,
                    dice_user_order.order_id,
                    dice_user_order.sign,
                    dice_user_order.ts,
                    tron_bet_wzc.dice_events_v3.amount_sun,
                    tron_bet_wzc.dice_events_v3.payout_sun
                  FROM
                    tron_bet_admin.dice_user_order
                  LEFT JOIN
                    tron_bet_wzc.dice_events_v3
                  ON
                    dice_user_order.order_id = tron_bet_wzc.dice_events_v3.order_id and dice_user_order.addr = tron_bet_wzc.dice_events_v3.addr
                  WHERE
                    dice_user_order.ts >= ? and dice_user_order.ts <= ?
                  ORDER BY
                    dice_user_order.ts DESC
                    ) as g
    `
    const params = [start.getTime(), end.getTime()]
    let rs = await raw(sql, params)
    const rs2 = rs[0] || {}
    let ccc1 = {
        count: rs2.count || 0,
        all_amount: rs2.all_amount || 0,
        all_win: rs2.all_win || 0,
        balance: rs2.balance || 0,
    }
    return ccc1
}

const getMoon = async function (startDate, endDate) {
    const sql = `
            SELECT
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
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const t = await raw(sql, params)
    const rs2 = t[0] || {}
    let ccc1 = {
        count: rs2.count || 0,
        all_amount: rs2.all_amount || 0,
        all_win: rs2.all_win || 0,
        balance: rs2.balance || 0,
    }
    return ccc1
}

const getRing = async function (startDate, endDate) {
    const sql = `
        SELECT
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
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const t = await raw(sql, params)
    const rs2 = t[0] || {}
    let ccc1 = {
        count: rs2.count || 0,
        all_amount: rs2.all_amount || 0,
        all_win: rs2.all_win || 0,
        balance: rs2.balance || 0,
    }
    return ccc1
}

const getDuel = async function (startDate, endDate) {
    // const sql = `
    // SELECT
    //     count(1) as count,
    //     sum(amount * playerCnt) / 1000000 as all_amount,
    //     sum(win) / 1000000  as all_win,
    //     (sum(amount * playerCnt) - sum(win)) / 1000000  as balance
    // FROM
    //     tron_bet_admin.wheel_solo_order
    // WHERE
    //     status = 3
    //     AND endTs >= ?
    //     AND endTs < ?
    // `
    // const params = [
    //     newUtcTime(startDate).getTime(),
    //     newUtcTime(endDate).getTime()
    // ]
    // const rs1 = await raw(sql, params)
    // const rs2 = rs1[0] || {}
    // let ccc1 = {
    //     count: rs2.count || 0,
    //     all_amount: rs2.all_amount || 0,
    //     all_win: rs2.all_win || 0,
    //     balance: rs2.balance || 0,
    // }
    // return ccc1
}

const getEM = async function (startDate, endDate) {
    const sql = `
    select
        sum(g.count) as count,   
        sum(g.all_amount) as all_amount,   
        sum(g.all_win) as all_win,
        sum(g.all_amount) - sum(g.all_win) as balance   
    from (    
        select
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
    ) as g
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime(),
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime(),
    ]
    const rs1 = await raw(sql, params)
    const rs2 = rs1[0] || {}
    let ccc1 = {
        count: rs2.count || 0,
        all_amount: rs2.all_amount || 0,
        all_win: rs2.all_win || 0,
        balance: rs2.balance || 0,
    }
    return ccc1
}

const getHub88 = async function (startDate, endDate) {
    const sql = `
        SELECT
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
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const data = await raw(sql, params)
    const rs2 = data[0] || {}
    let ccc1 = {
        count: rs2.count || 0,
        all_amount: rs2.all_amount || 0,
        all_win: rs2.all_win || 0,
        balance: rs2.balance || 0,
    }
    return ccc1
}

const getSport = async function (startDate, endDate) {
    const sql = `
        SELECT
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
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const data = await raw(sql, params)
    const rs2 = data[0] || {}
    let ccc1 = {
        count: rs2.count || 0,
        all_amount: rs2.all_amount || 0,
        all_win: rs2.all_win || 0,
        balance: rs2.balance || 0,
    }
    return ccc1
}

const getPoker = async function (startDate, endDate) {
    // const sql = `
    //     select
    //         count(1) as count,
    //         sum(amount) / 1000000 as all_amount,
    //         0 as all_win,
    //         (sum(amount) + sum(oldAmount) - sum(newAmount)) / 1000000  as balance
    //     from
    //         tronbet_poker_log.poker_revenue_log
    //     where
    //         cointype = 'TRX'
    //         AND action < 100
    //         AND  optime >= ?
    //         AND optime < ?
    // `
    // const params = [
    //     newUtcTime(startDate).getTime() / 1000,
    //     newUtcTime(endDate).getTime() / 1000
    // ]
    // const data = await raw(sql, params)
    // const rs2 = data[0] || {}
    // let ccc1 = {
    //     count: rs2.count || 0,
    //     all_amount: rs2.all_amount || 0,
    //     all_win: rs2.all_win || 0,
    //     balance: rs2.balance || 0,
    // }
    // return ccc1
}

class DailyAmount {

    static async getData(startDate,endDate) {
        const typeDict = {
            "dice": getDice,
            "moon": getMoon,
            "ring": getRing,
            "em": getEM,
            "hub88": getHub88,
            "sport": getSport,
        }
        const keys = Object.keys(typeDict)
        let o = {
            count: 0,
            all_amount: 0,
            all_win: 0,
            balance: 0,
        }
        for (let e of keys) {
            const tmp = await typeDict[e](startDate, endDate)
            console.log(e,tmp)
            Object.keys(o).forEach(k=>{
                o[k] = o[k] + Number(tmp[k])
            })
        }
        return o
    }
}


module.exports = DailyAmount