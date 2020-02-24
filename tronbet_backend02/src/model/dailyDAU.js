const {raw, newUtcTime, getCustomDay, getTimeFormat} = require("./utils/dbutils")
const {getDiceData} = require("./dice/dice")


const getDice = async function (startDate, endDate) {
    const sql = `
        SELECT
            distinct addr
        FROM
            tron_bet_admin.dice_user_order
        WHERE
            ts >= ?
            AND ts < ?
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const t = await raw(sql, params)
    return t
}

const getMoon = async function (startDate, endDate) {
    const sql = `
            SELECT
            distinct addr
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
    return t
}

const getRing = async function (startDate, endDate) {
    const sql = `
        SELECT
            distinct addr
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
    return t
}

const getDuel = async function (startDate, endDate) {
    const sql = `
    SELECT
        distinct player1  as addr
    FROM
        tron_bet_admin.wheel_solo_order
    WHERE
        endTs >= ?
        AND endTs < ?
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
            distinct addr
        from
            tron_live.live_action_log_v2
        where
            ts >= ?
            AND ts < ?
            and action = 'bet'
            and txstatus = 1 
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
            distinct email  as addr
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
    return data
}

const getSport = async function (startDate, endDate) {
    const sql = `
        SELECT
            distinct addr
        FROM
            tron_live.sports_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
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
            distinct addr
        from
            tronbet_poker_log.poker_revenue_log
        where
            optime >= ?
            AND  optime < ?
    `
    const params = [
        newUtcTime(startDate).getTime() / 1000,
        newUtcTime(endDate).getTime() / 1000
    ]
    const data = await raw(sql, params)
    return data
}

class DailyDAU {

    static async getDailyData(day) {
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
        const start = newUtcTime(Date.now())
        const end = getCustomDay(start,-1 * day)
        //
        const startDate = getTimeFormat(start)
        const endDate = getTimeFormat(end)
        //
        const keys = Object.keys(typeDict)
        let a = []
        for (let e of keys) {
            const tmp = await typeDict[e](startDate, endDate)
            const addr = tmp.map(e => e.addr || '')
            a = a.concat(addr)
        }
        const na = Array.from(new Set(a))
        console.log("debug------>na ",na.slice(0, 2))
        // console.log("debug------>na1 ",startDate,start)
        // console.log("debug------>na2 ",endDate,end)
        return na.length
    }

}


module.exports = DailyDAU