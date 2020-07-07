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

const generateCsv = function (data) {
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

const getBTT = async function (startDate, endDate) {
    const sql1 = `select ver from tron_bet_wzc.btt_dividends_v1 where send_ts >= ? order by send_ts asc limit 1`
    const data1 = await raw(sql1, [newUtcTime(startDate).getTime()])
    //
    const sql2 = `select ver from tron_bet_wzc.btt_dividends_v1 where send_ts < ?  and send_ts > 0 order by send_ts desc limit 1`
    const data2 = await raw(sql2, [newUtcTime(endDate).getTime()])
    //
    if(data1.length > 0 && data2.length > 0){
        let startVer = data1[0].ver
        let endVer = data2[0].ver
        let sql_btt = 'select ver,total_btt / 1000000 as btt,tx_id from tron_bet_wzc.btt_ver_v1 where ver >= ? and ver <= ?'
        let data3 = await raw(sql_btt,[startVer,endVer])
        return data3
    }else {
        return []
    }
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
    const p1_data = await getBTT(startDate, endDate)
    if (p1_data.length > 0) {
        const file_name = startDate + "-" + endDate + "_btt_divide.xls"
        const bttInfo = generate_dict(p1_data, file_name)
        a.push(bttInfo)
    }
    return a
}

module.exports = task