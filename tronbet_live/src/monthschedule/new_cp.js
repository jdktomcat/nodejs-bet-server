const fs = require("fs")
const db = require('../utils/dbUtil')

function newUtcTime(today) {
    let start = new Date(today);
    start.setUTCHours(0)
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    return start
}


const raw = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}

const generateCsv = async function (data) {
    if (data.length === 0) {
        return ''
    }
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

const getPlatius = async function (startDate, endDate) {
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            count(distinct addr)  as dau,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_live.platipus_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            AND status = 2
            And resultId is not null
            AND currency = 'TRX'
            group by from_unixtime(ts / 1000,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const data = await raw(sql, params)
    return data
}


const getBinary = async function (startDate, endDate) {
    const sql = `
        SELECT
            from_unixtime(expiration_date / 1000,'%Y-%m-%d') as day,
            count(distinct addr)  as dau,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_live.binary_transaction_log
        WHERE
            expiration_date >= ?
            AND expiration_date < ?
            AND status = 'close'
            AND currency = 'TRX'
            group by from_unixtime(expiration_date / 1000,'%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const data = await raw(sql, params)
    return data
}


const generate_dict = function (p1_data, filename) {
    const p1_data_str = generateCsv(p1_data)
    //
    fs.writeFileSync("./" + filename, p1_data_str)
    //
    let attachmentObj = {}
    attachmentObj.filename = filename
    attachmentObj.path = "./" + filename
    return attachmentObj
}

const task = async function (startDate, endDate) {
    let a = []
    //
    const p1_data = await getPlatius(startDate, endDate)
    if (p1_data.length > 0) {
        const file_name = startDate + "-" + endDate + "platius.xls"
        const platius_o = await generate_dict(p1_data, file_name)
        a.push(platius_o)
    }
    //
    const binary_data = await getBinary(startDate, endDate)
    if (binary_data.length > 0) {
        const file_name = startDate + "-" + endDate + "binary.xls"
        const binary_o = await generate_dict(binary_data, file_name)
        a.push(binary_o)
    }
    return a
}

module.exports = task