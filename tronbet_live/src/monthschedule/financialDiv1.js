const db = require('../utils/dbUtil')

const rawSql = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}

//
const moment = require("moment")
const fs = require("fs")
// const nodeExcel = require("excel-export")
let utils = {}
utils.moment = moment
// TODO 换成北京时区 并且抽成自动赋值
let tronLiveClient = {}
tronLiveClient.query = rawSql
//
const justin = ["T", "F", "L", "Y", "d", "2", "B", "k", "7", "C", "t", "s", "f", "Q", "F", "p", "L", "n", "m", "2", "f", "K", "p", "2", "C", "s", "S", "w", "T", "D", "G", "m", "x", "2"].join("")

const diyExcel = function (conf) {
    const keys = conf.cols.map(e => e.caption)
    let sbody = ''
    keys.forEach(e => {
        sbody += e + "\t"
    })
    sbody = sbody.trim()
    sbody += "\n"
    //
    const data = conf.rows
    let tmp1 = data[0]
    let tmp2 = tmp1.map((x, i) => i)
    data.forEach(e => {
        tmp2.forEach((k) => {
            let t = e[k] || 0
            sbody = sbody + t + '\t'
        })
        sbody = sbody.trim()
        sbody += '\n'
    })
    return sbody
}

const task = async function (startDate, endDate) {
    let startTime = new Date(startDate).getTime()
    let endTime = new Date(endDate).getTime()
    //
    let attachments = []
    // win usdt
    let sqlWin = `
        select from_unixtime(tmp1.start, "%Y-%m-%d") date, sum(tmp1.t) totalDiv, sum(tmp2.t) tronDiv
        from
        (
            select round, start, sum(amount) / 1000000 as t
            from tron_live.win_trc20_div_info
            where start >= ? and start <= ?
            group by round
        ) tmp1
        left join
        (
            select round, sum(amount) / 1000000 as t
            from tron_live.win_trc20_div_detail
            where addr = ?
            group by round
        ) tmp2
        on tmp1.round = tmp2.round
        group by from_unixtime(tmp1.start, "%Y-%m-%d")
        order by from_unixtime(tmp1.start, "%Y-%m-%d")`
    let resultWin = await tronLiveClient.query(sqlWin, [
        startTime / 1000,
        endTime / 1000,
        justin,
    ])
    if (resultWin && resultWin.length) {
        let conf = {}
        let arr = []
        let index = 0
        conf.name = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}win-usdt分红`
        conf.cols = [
            {
                caption: "Date",
                type: "string",
                width: 20,
            },
            {
                caption: "Total Dividend (USDT)",
                type: "number",
                width: 20,
            },
            {
                caption: "Tron Dividend (USDT)",
                type: "number",
                width: 20,
            },
        ]

        for (let item of resultWin) {
            arr[index] = []
            arr[index][0] = item.date ? item.date : ""
            arr[index][1] = item.totalDiv ? item.totalDiv : 0
            arr[index][2] = item.tronDiv ? item.tronDiv : 0
            index++
        }
        conf.rows = arr
        const excelRaw = diyExcel(conf)
        fs.writeFileSync(
            `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
                .moment(endTime)
                .format("YYYY-MM-DD")}win-usdt分红.xls`,
            excelRaw,
            "binary"
        )
        let attachmentObj = {}
        attachmentObj.filename = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}win-usdt分红.xls`
        attachmentObj.path = `./${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}win-usdt分红.xls`
        attachments.push(attachmentObj)
    }

    // live usdt
    let sqlLive = `
            select from_unixtime(tmp1.start, "%Y-%m-%d") date, sum(tmp1.t) totalDiv, sum(tmp2.t) tronDiv
            from
            (
                select round, start, sum(amount) / 1000000 as t
                from tron_live.live_trc20_div_info
                where start >= ? and start <= ?
                group by round
            ) tmp1
            left join
            (
                select round, sum(amount) / 1000000 as t
                from tron_live.live_trc20_div_detail
                where addr = ?
                group by round
            ) tmp2
            on tmp1.round = tmp2.round
            group by from_unixtime(tmp1.start, "%Y-%m-%d")
            order by from_unixtime(tmp1.start, "%Y-%m-%d")`
    let resultLive = await tronLiveClient.query(sqlLive, [
        startTime / 1000,
        endTime / 1000,
        justin,
    ])
    // ctx.app.logger.info(utils.fileName(__filename) + " resultLive", resultLive)
    // ctx.app.logger.info(
    //   utils.fileName(__filename) + " ============",
    //   startTime,
    //   endTime,
    //   ctx.app.config.justin
    // )
    if (resultLive && resultLive.length) {
        let conf = {}
        let arr = []
        let index = 0
        conf.name = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}live-usdt分红`
        conf.cols = [
            {
                caption: "Date",
                type: "string",
                width: 20,
            },
            {
                caption: "Total Dividend (USDT)",
                type: "number",
                width: 20,
            },
            {
                caption: "Tron Dividend (USDT)",
                type: "number",
                width: 20,
            },
        ]

        for (let item of resultLive) {
            arr[index] = []
            arr[index][0] = item.date ? item.date : ""
            arr[index][1] = item.totalDiv ? item.totalDiv : 0
            arr[index][2] = item.tronDiv ? item.tronDiv : 0
            index++
        }
        conf.rows = arr
        const excelRaw = diyExcel(conf)
        fs.writeFileSync(
            `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
                .moment(endTime)
                .format("YYYY-MM-DD")}live-usdt分红.xls`,
            excelRaw,
            "binary"
        )
        let attachmentObj = {}
        attachmentObj.filename = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}live-usdt分红.xls`
        attachmentObj.path = `./${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}live-usdt分红.xls`
        attachments.push(attachmentObj)
    }
    console.log("last attachments is", attachments)
    return attachments
    // await sendMail(attachments)
    // //
    // // 删除本地附件
    // const dirs = attachments.map(e => e.filename)
    // for (let currency of dirs) {
    //     fs.unlinkSync(`${__dirname}/${currency}`)
    // }

}


module.exports = task