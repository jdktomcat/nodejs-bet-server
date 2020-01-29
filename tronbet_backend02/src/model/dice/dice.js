const {raw, getdayList, newUtcTime, getLastDayUtcTime, getNextDayUtcTime} = require("../utils/dbutils")
const db = require("../../utils/readDbUtil")
const schedule = require('node-schedule');

const readDB = async function (sql, params) {
    console.log(String(sql))
    console.log("params is ===>", params)
    return await db.exec(sql, params)
}

const addZero = function (num) {
    if (String(num).length === 1) {
        return "0" + String(num)
    }
    return String(num)
}

const getTimeStr = function (date) {
    const y = date.getUTCFullYear()
    const m = date.getUTCMonth() + 1
    const d = date.getUTCDate()
    const o = y + '-' + addZero(m) + '-' + addZero(d)
    return o
}

const queryEvents = async function (start, end) {
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

const getData = async function (startDate, endDate) {
    console.log(1111111, startDate, endDate)
    const c = getdayList(startDate, endDate)
    console.log(c)
    let ss = []
    for (let i = 0; i < c.length - 1; i++) {
        let start = c[i]
        let end = c[i + 1]
        let evedata = await queryEvents(start, end)
        let data = Object.assign({}, {
            day: getTimeStr(start),
        }, evedata)
        ss.push(data)
        //todo insert into database
        const day_str = data.day
        const data_str = JSON.stringify(data)
        const ts = newUtcTime(day_str).getTime()
        await addDiceData(day_str, data_str, ts);
    }
    return ss
}


const queryLastDay = async function () {
    const sql = `select day_str from tron_bet_admin.sum_dice_data order by ts desc limit 0,1`
    const rs = await raw(sql, [])
    const c = rs[0] || {}
    const dd = c.day_str
    return dd
}


const addDiceData = async function (day_str, data_str, ts) {
    const sql = `insert into tron_bet_admin.sum_dice_data(type,day_str,data_str,ts) values ('dailydata',?,?,?)`
    await raw(sql, [day_str, data_str, ts])
}


const parseDice = async function () {
    const j = schedule.scheduleJob('0 1 * * *', async function () {
        // console.log('The answer to life, the universe, and everything!');
        //
        const dbLastDay = await queryLastDay()
        const lastDay = getLastDayUtcTime(new Date())
        //
        const dbLastDayStr = getTimeStr(newUtcTime(dbLastDay))
        const lastDayStr = getTimeStr(newUtcTime(lastDay))
        //
        console.log("dbLastDay------>", dbLastDayStr)
        console.log("lastDay------>", lastDayStr)
        if (dbLastDayStr !== lastDayStr) {
            const endDate = newUtcTime(Date.now())
            const endDateStr = getTimeStr(endDate)
            //
            const startDate = getNextDayUtcTime(new Date(dbLastDay))
            const startDateStr = getTimeStr(startDate)
            //
            console.log("start------>", startDateStr)
            console.log("end------>", endDateStr)
            await getData(startDateStr, endDateStr)
        }
        //todo
    });
    // 5分钟检查一次
    const task2 = schedule.scheduleJob('*/5 * * * *', async function () {
        await addBonusName()
    })
}

const addBonusName = async function () {
    const now = Date.now()
    if (now < newUtcTime('2020-02-04 7:00').getTime()) {
        let s = "bonus" + getTimeStr(now)
        console.log("bonus_name is ", s)
        const sql0 = `select * from tron_bet_event.years_bonus_name where name = ?`
        const data0 = await raw(sql0, [s])
        if(data0.length === 0){
            const sql = `insert into tron_bet_event.years_bonus_name(name,status,ts) values(?,'1',?)`
            await raw(sql, [s, Date.now()])
        }
    }
}

const getDiceData = async function (startDate, endDate) {
    const sql = `select * from tron_bet_admin.sum_dice_data where ts >= ? and ts < ?`
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const rs = await raw(sql, params)
    const r = []
    rs.forEach(e => {
        const tmp = e.data_str || ""
        const t = JSON.parse(tmp.trim())
        r.push(t)
    })
    return r
}


module.exports = {
    parseDice: parseDice,
    getDiceData: getDiceData,
}