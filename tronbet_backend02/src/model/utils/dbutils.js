// const db = require('./../../utils/readDbUtil')
const db = require('./../../utils/dbUtil')

const raw = async function (sql, params) {
    console.log(String(sql))
    console.log("params is ===>", params)
    return await db.exec(sql, params)
}

function newUtcTime(today) {
    let start = new Date(today);
    start.setUTCHours(0)
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    return start
}

function getNextDayUtcTime(today) {
    var start = new Date(today);
    start.setUTCDate(new Date(today.getTime()).getDate() + 1);
    start.setUTCHours(0)
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    return start
}

function getLastDayUtcTime(today) {
    var start = new Date(today);
    start.setUTCDate(new Date(today.getTime()).getDate() - 1);
    start.setUTCHours(0)
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    return start
}


function getDaysByNum(n) {
    const num = Number(n)
    var start = new Date();
    start.setUTCDate(new Date().getUTCDate() + n);
    start.setUTCHours(0)
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    return start
}

function getTimeFormat(date) {
    const y = date.getUTCFullYear()
    const m = date.getUTCMonth() + 1
    const d = date.getUTCDate()
    let m2 = String(m).length === 1 ? "0" + m : m
    let d2 = String(d).length === 1 ? "0" + d : d
    return y + "-" + m2 + "-" + d2
}


function getdayList(startDate, endDate) {
    let a = newUtcTime(startDate)
    let b = []
    b.push(a)
    const start = Date.now()
    while (true) {
        a = getNextDayUtcTime(a)
        b.push(a)
        if (getTimeFormat(a) === endDate) {
            break
        }
        if (Date.now() - start >= 10 * 1000) {
            break
        }

    }
    return b
}


const formatRound = function (num) {
    let tmp = num || 0
    let r = Number(tmp) / 1000000
    return r
}

const formatDataToTRX = function (rs) {
    let a = []
    rs.forEach(e => {
        const day = e.day
        const count = e.count || 0
        const all_amount = formatRound(e.all_amount)
        const all_win = formatRound(e.all_win)
        const balance = formatRound(e.balance)
        let o = {
            day,
            count,
            all_amount,
            all_win,
            balance
        }
        a.push(o)
    })
    return a
}


const generateDataToCsv = function (rs) {
    let s = 'date\ttransaction_num\tbet_amount\tbet_result\tbalance\n'
    rs.forEach(e => {
        const day = e.day
        const count = e.count || 0
        const all_amount = e.all_amount || 0
        const all_win = e.all_win || 0
        const balance = e.balance || 0
        s += `${day}\t${count}\t${all_amount}\t${all_win}\t${balance}\n`
    })
    return s
}


module.exports = {
    getTimeFormat,
    getNextDayUtcTime,
    getLastDayUtcTime,
    newUtcTime,
    getdayList,
    raw,
    formatDataToTRX,
    generateDataToCsv,
    getDaysByNum
}