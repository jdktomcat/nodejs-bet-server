const {raw, getdayList, newUtcTime, getLastDayUtcTime, getNextDayUtcTime} = require("../utils/dbutils")
const db = require("../../utils/readDbUtil")
const schedule = require('node-schedule');
const {processAllData, processAllAddr} = require("./../dailySchedule/dailyTotal")

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
                      count(distinct g.addr)  as dau,
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
        dau: rs2.dau || 0,
        count: rs2.count || 0,
        all_amount: rs2.all_amount || 0,
        all_win: rs2.all_win || 0,
        balance: rs2.balance || 0,
    }
    return ccc1
}

const getData = async function (startDate, endDate) {
    // console.log(1111111, startDate, endDate)
    const c = getdayList(startDate, endDate)
    // console.log(c)
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


const queryDiceDay = async function () {
    const sql = `select day_str from tron_bet_admin.sum_dice_data where type = 'dailydata' order by ts desc limit 0,1`
    const rs = await raw(sql, [])
    const c = rs[0] || {}
    const dd = c.day_str || '2019-01-01'
    return dd
}

const queryAllDay = async function () {
    const sql = `select day_str from tron_bet_admin.sum_dice_data where type = 'all' order by ts desc limit 0,1`
    const rs = await raw(sql, [])
    const c = rs[0] || {}
    const dd = c.day_str || '2019-01-01'
    return dd
}


const addDiceData = async function (day_str, data_str, ts) {
    const sql = `insert into tron_bet_admin.sum_dice_data(type,day_str,data_str,ts) values ('dailydata',?,?,?)`
    await raw(sql, [day_str, data_str, ts])
}


const sleep = function (time) {
    const now = Date.now()
    const t = time * 1000
    while (Date.now() - now > t * 1000) {
        break
    }
}

const parseDice = async function () {
    const j = schedule.scheduleJob('*/1 * * * *', async function () {
    // const j = schedule.scheduleJob('0 1 * * *', async function () {
        // console.log('The answer to life, the universe, and everything!');
        //
        const rs = await getStartEnd()
        console.log("debug----->rs is ", rs)
        if (rs.dice.bool) {
            const {startDateStr, endDateStr} = rs.dice
            console.log(`schedule_dice start is ${startDateStr}, end is ${endDateStr}`)
            await getData(startDateStr, endDateStr)
        }
        //
        console.log('sleep 30s')
        sleep(30)
        console.log('sleep 30s end')
        //
        if (rs.all.bool) {
            const {startDateStr, endDateStr} = rs.all
            console.log(`schedule_all start is ${startDateStr}, end is ${endDateStr}`)
            await processAllData(startDateStr, endDateStr)
            await processAllAddr(startDateStr, endDateStr)
        }
    });
}


const getStartEnd = async function () {
    const dbLastDay = await queryDiceDay()
    const dbAllDay = await queryAllDay()
    const lastDay = getLastDayUtcTime(new Date())
    const days = [dbLastDay,dbAllDay,lastDay].map(e=>getTimeStr(newUtcTime(e)))
    const [diceDay,allDay,yesterday] = days
    let rs = {
        dice: {
            bool: false
        },
        all: {
            bool: false
        },
    }
    console.log(`diceDay : ${diceDay} ,allDay : ${allDay} ,yesterday : ${yesterday} `)
    //deal dice
    if (diceDay !== yesterday) {
        const endDate = newUtcTime(Date.now())
        const endDateStr = getTimeStr(endDate)
        //
        const startDate = getNextDayUtcTime(new Date(dbLastDay))
        const startDateStr = getTimeStr(startDate)
        rs.dice = {
            bool: true,
            startDateStr: startDateStr,
            endDateStr: endDateStr,
        }
    }
    // deal with all
    //allDay : 2019-01-01 ,yesterday : '2020-02-25'
    if (allDay !== yesterday) {
        if(allDay === '2019-01-01'){
            //首次生成数据
            rs.all = {
                bool: true,
                startDateStr: '2019-01-01',
                endDateStr: getTimeStr(newUtcTime(Date.now())),
            }
        }else{
            const endDate = newUtcTime(Date.now())
            const endDateStr = getTimeStr(endDate)
            //
            const startDate = getNextDayUtcTime(new Date(dbLastDay))
            const startDateStr = getTimeStr(startDate)
            rs.all = {
                bool: true,
                startDateStr: startDateStr,
                endDateStr: endDateStr,
            }
        }
    }
    return rs
}


const getDiceData = async function (startDate, endDate) {
    const sql = `select * from tron_bet_admin.sum_dice_data where type = 'dailydata' and ts >= ? and ts < ?`
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