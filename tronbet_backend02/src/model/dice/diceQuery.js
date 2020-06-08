const {raw, getdayList, newUtcTime, getLastDayUtcTime, getNextDayUtcTime} = require("../utils/dbutils")
const db = require("../../utils/readDbUtil")
const schedule = require('node-schedule');


const queryDice = async function (params) {
    let {startDate, endDate, addr, page, pageNum} = params
    const start = newUtcTime(startDate).getTime()
    const end = newUtcTime(endDate).getTime()
    const limit = Number(pageNum)
    const offset = (Number(page) - 1) * limit
//direction | number | roll
    let sql = `
          SELECT
                    from_unixtime( dice_user_order.ts / 1000,'%Y-%m-%d %H:%i:%S') as day,
                    tron_bet_admin.dice_user_order.addr,
                    tron_bet_wzc.dice_events_v3.order_id,
                    tron_bet_wzc.dice_events_v3.direction,
                    tron_bet_wzc.dice_events_v3.number,
                    tron_bet_wzc.dice_events_v3.roll,
                    tron_bet_wzc.dice_events_v3.amount_sun / 1000000 as amount ,
                    tron_bet_wzc.dice_events_v3.payout_sun / 1000000 as win,
                    tron_bet_admin.dice_user_order.tx_id,
                    tron_bet_wzc.dice_events_v3.tx_id as result_tx_id
                  FROM
                    tron_bet_admin.dice_user_order
                  LEFT JOIN
                    tron_bet_wzc.dice_events_v3
                  ON
                    dice_user_order.order_id = tron_bet_wzc.dice_events_v3.order_id and dice_user_order.addr = tron_bet_wzc.dice_events_v3.addr
                  WHERE
                    dice_user_order.ts >= ? and dice_user_order.ts <= ?
                    and dice_user_order.addr = ?
                  ORDER BY
                    dice_user_order.ts DESC
    `
    let sqlC = `select count(1) as count from (${sql}) as g`
    const crs = await raw(sqlC, [start, end, addr])
    const count = crs[0].count || 0
    //
    sql += ' limit ?,?'
    const p = [start, end, addr, offset, limit]
    let rsData = await raw(sql, p)
    const rs = {
        count: count,
        rows: rsData
    }
    return rs
}


const queryMoon = async function (params) {
    let {startDate, endDate, addr, page, pageNum, round} = params
    const start = newUtcTime(startDate).getTime()
    const end = newUtcTime(endDate).getTime()
    const limit = Number(pageNum)
    const offset = (Number(page) - 1) * limit
    if (round !== undefined && round !== '') {
        let sql = `
            SELECT
            from_unixtime(a.ts / 1000,'%Y-%m-%d %H:%i:%S') as day,
            a.addr,
            a.amount / 1000000 as amount,
            a.win / 1000000  as win,
            a.crashAt,
            a.autoAt,
            a.escapeAt as userCrashAt,
            a.tx_id,
            a.round,
            b.tx_id as round_tx_id,
            b.crashAt as round_crashAt
        FROM
            tron_bet_admin.moon_user_order  as a
            left join tron_bet_admin.moon_round_info as b
            on a.round = b.round
        WHERE
            a.round = ?
    `
        const rs = await raw(sql, [round])
        return rs
    } else {
        let sql = `
            SELECT
            from_unixtime(a.ts / 1000,'%Y-%m-%d %H:%i:%S') as day,
            a.addr,
            a.amount / 1000000 as amount,
            a.win / 1000000  as win,
            a.crashAt,
            a.autoAt,
            a.escapeAt as userCrashAt,
            a.tx_id,
            a.round,
            b.tx_id as round_tx_id,
            b.crashAt as round_crashAt
        FROM
            tron_bet_admin.moon_user_order  as a
            left join tron_bet_admin.moon_round_info as b
            on a.round = b.round
        WHERE
            a.ts >= ?
            AND a.ts < ?
            And a.addr = ?
            order by a.ts desc
    `
        let sqlC = `select count(1) as count from (${sql}) as g`
        const crs = await raw(sqlC, [start, end, addr])
        const count = crs[0].count || 0
        //
        sql += ' limit ?,?'
        const p = [start, end, addr, offset, limit]
        let rsData = await raw(sql, p)
        const rs = {
            count: count,
            rows: rsData
        }
        return rs
    }
}


const queryRing = async function (params) {
    let {startDate, endDate, addr, page, pageNum, result_hash} = params
    const start = newUtcTime(startDate).getTime()
    const end = newUtcTime(endDate).getTime()
    const limit = Number(pageNum)
    const offset = (Number(page) - 1) * limit
    if (result_hash !== undefined && result_hash !== '') {
        let sql = `
            SELECT
            round,
            from_unixtime(ts / 1000,'%Y-%m-%d %H:%i:%S') as day,
            addr,
            amount / 1000000 as amount,
            win / 1000000  as win,
            roll as real_number,
            number as user_number,
            tx_id,
            result_hash
        FROM
            tron_bet_admin.wheel_user_order
        WHERE  result_hash = ? 
    `
        const rs = await raw(sql, [result_hash])
        return rs
    } else {
        let sql = `
            SELECT
            a.round,
            from_unixtime(a.ts / 1000,'%Y-%m-%d %H:%i:%S') as day,
            a.addr,
            a.amount / 1000000 as amount,
            a.win / 1000000  as win,
            a.roll as real_number,
            a.number as user_number,
            a.tx_id,
            a.result_hash,
            b.number as round_number,
            b.tx_id as round_tx_id
        FROM
            tron_bet_admin.wheel_user_order as a
            left join tron_bet_admin.wheel_round_info as b
            on a.round = b.round
        WHERE
            a.ts >= ?
            AND a.ts < ?
            And a.addr = ?
            order by a.ts desc `
        let sqlC = `select count(1) as count from (${sql}) as g`
        const crs = await raw(sqlC, [start, end, addr])
        const count = crs[0].count || 0
        //
        sql += ' limit ?,?'
        const p = [start, end, addr, offset, limit]
        let rsData = await raw(sql, p)
        const rs = {
            count: count,
            rows: rsData
        }
        return rs
    }
}


module.exports = {
    queryDice,
    queryMoon,
    queryRing,
}