const db = require('../utils/dbUtil')

const rawSql = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}

const moment = require("moment")
const fs = require("fs")
// const nodeExcel = require("excel-export")
let utils = {}
utils.moment = moment
// TODO 换成北京时区 并且抽成自动赋值
let tronLiveClient = {}
tronLiveClient.query = rawSql


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
    // sport
    let sqlSport = `select from_unixtime(ts / 1000, "%Y-%m-%d") date1, sum(amount / 1000000) amount,
              sum(amount / 1000000  - win / 1000000) profit, count(1) cnt, count(distinct addr) playerCnt
              from tron_live.sports_transaction_log
              where (status = 50 or status = 51)
              and currency = ?
              and ts >= ? AND ts < ?
              group by from_unixtime(ts / 1000, "%Y-%m-%d")
              order by from_unixtime(ts / 1000, "%Y-%m-%d")`
    let resultSport = await tronLiveClient.query(sqlSport, ["TRX", startTime, endTime,])
    if (resultSport && resultSport.length) {
        let conf = {}
        let arr = []
        let index = 0
        conf.name = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}sport流水`
        conf.cols = [
            {
                caption: "Date",
                type: "string",
                width: 20,
            },
            {
                caption: "amount",
                type: "number",
                width: 20,
            },
            {
                caption: "profit",
                type: "number",
                width: 20,
            },
            {
                caption: "Success Orders Count",
                type: "number",
                width: 20,
            },
            {
                caption: "Player Count",
                type: "number",
                width: 20,
            },
        ]

        for (let item of resultSport) {
            arr[index] = []
            arr[index][0] = item.date1 ? item.date1 : ""
            arr[index][1] = item.amount ? item.amount : 0
            arr[index][2] = item.profit ? item.profit : 0
            arr[index][3] = item.cnt ? item.cnt : 0
            arr[index][4] = item.playerCnt ? item.playerCnt : 0
            index++
        }
        conf.rows = arr
        const excelRaw = diyExcel(conf)
        fs.writeFileSync(
            `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
                .moment(endTime)
                .format("YYYY-MM-DD")}sport流水.xls`,
            excelRaw,
            "binary"
        )
        let attachmentObj = {}
        attachmentObj.filename = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}sport流水.xls`
        attachmentObj.path = `./${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}sport流水.xls`
        attachments.push(attachmentObj)
    }

    // sport USDT
    let resultSportUSDT = await tronLiveClient.query(sqlSport, [
        "USDT",
        startTime,
        endTime,
    ])
    if (resultSportUSDT && resultSportUSDT.length) {
        let conf = {}
        let arr = []
        let index = 0
        conf.name = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}sport-USDT流水`
        conf.cols = [
            {
                caption: "Date",
                type: "string",
                width: 20,
            },
            {
                caption: "amount",
                type: "number",
                width: 20,
            },
            {
                caption: "profit",
                type: "number",
                width: 20,
            },
            {
                caption: "Success Orders Count",
                type: "number",
                width: 20,
            },
            {
                caption: "Player Count",
                type: "number",
                width: 20,
            },
        ]

        for (let item of resultSportUSDT) {
            arr[index] = []
            arr[index][0] = item.date1 ? item.date1 : ""
            arr[index][1] = item.amount ? item.amount : 0
            arr[index][2] = item.profit ? item.profit : 0
            arr[index][3] = item.cnt ? item.cnt : 0
            arr[index][4] = item.playerCnt ? item.playerCnt : 0
            index++
        }
        conf.rows = arr
        const excelRaw = diyExcel(conf)
        fs.writeFileSync(
            `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
                .moment(endTime)
                .format("YYYY-MM-DD")}sport-USDT流水.xls`,
            excelRaw,
            "binary"
        )
        let attachmentObj = {}
        attachmentObj.filename = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}sport-USDT流水.xls`
        attachmentObj.path = `./${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}sport-USDT流水.xls`
        attachments.push(attachmentObj)
    }

    // hub88.csv
    let sqlHub88 = `select from_unixtime(ts / 1000, "%Y-%m-%d") date1, sum(amount / 1000000) amount,
              sum(amount / 1000000  - win / 1000000) profit, count(1) cnt, count(distinct email) playerCnt
              from swagger_transaction_log
              where status = 1
              and currency = 'TRX'
              and ts >= ? AND ts < ?
              group by from_unixtime(ts / 1000, "%Y-%m-%d")
              order by from_unixtime(ts / 1000, "%Y-%m-%d")`
    let resultHub88 = await tronLiveClient.query(sqlHub88, [
        startTime,
        endTime,
    ])
    if (resultHub88 && resultHub88.length) {
        let conf = {}
        let arr = []
        let index = 0
        conf.name = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}hub88流水`
        conf.cols = [
            {
                caption: "Date",
                type: "string",
                width: 20,
            },
            {
                caption: "amount",
                type: "number",
                width: 20,
            },
            {
                caption: "profit",
                type: "number",
                width: 20,
            },
            {
                caption: "Success Orders Count",
                type: "number",
                width: 20,
            },
            {
                caption: "Player Count",
                type: "number",
                width: 20,
            },
        ]

        for (let item of resultHub88) {
            arr[index] = []
            arr[index][0] = item.date1 ? item.date1 : ""
            arr[index][1] = item.amount ? item.amount : 0
            arr[index][2] = item.profit ? item.profit : 0
            arr[index][3] = item.cnt ? item.cnt : 0
            arr[index][4] = item.playerCnt ? item.playerCnt : 0
            index++
        }
        conf.rows = arr
        const excelRaw = diyExcel(conf)
        fs.writeFileSync(
            `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
                .moment(endTime)
                .format("YYYY-MM-DD")}hub88流水.xls`,
            excelRaw,
            "binary"
        )
        let attachmentObj = {}
        attachmentObj.filename = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}hub88流水.xls`
        attachmentObj.path = `./${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}hub88流水.xls`
        attachments.push(attachmentObj)
    }

    // EM result and curre// 财务对账  live第三方流水
    // let startTime = new Date("2020-02-01").getTime()
    // let endTime = new Date("2020-03-01").getTime()
    //
    // //
    // const nodemailer = require("nodemailer");
    //
    // const sendMail = async function (attachments) {
    //     // const to = mail.split(',').join(',')
    //     let transporter = nodemailer.createTransport({
    //         host: "smtp.gmail.com",
    //         port: 465,
    //         auth: {
    //             user: "welcome@wink.org", // generated ethereal user
    //             pass: "!Changeme_123" // generated ethereal password
    //         }
    //     });
    //     // send mail with defined transport object
    //     let info = await transporter.sendMail({
    //         from: '"welcome@wink.org', // sender address
    //         to: "andrew.li@tron.network", // list of receivers
    //         subject: "TronBet Financial Data", // Subject line
    //         html: "<h2>见附件</h2>", // html body
    //         attachments: attachments
    //     });
    //     return info
    // }
    // //
    // const mysql = require('mysql2')
    // // create the connection to database
    // const connection = mysql.createConnection({
    //     host: 'wink-db.cws5syxu9xu4.us-east-2.rds.amazonaws.com',
    //     user: 'wink_read',
    //     password: 'v9l4k2lHgeql',
    //     database: 'tron_live',
    // });
    //
    // const rawSql = function (sql, params) {
    //     // console.log("\n")
    //     console.log(sql)
    //     // console.log("params:", params, "\n")
    //     const start = Date.now()
    //     return new Promise((res, rej) => {
    //         // with placeholder
    //         connection.query(
    //             sql,
    //             params,
    //             function (err, results) {
    //                 if (err === null) {
    //                     const end = Date.now()
    //                     res(results)
    //                     // console.log(results)
    //                     // console.log("\n 耗时：" + (end - start) + "ms")
    //                 } else {
    //                     rej(err)
    //                 }
    //             }
    //         );
    //     })
    // }
    //
    // const moment = require("moment")
    // const fs = require("fs")
    // const nodeExcel = require("excel-export")
    // let utils = {}
    // utils.moment = moment
    // // TODO 换成北京时区 并且抽成自动赋值
    // let tronLiveClient = {}
    // tronLiveClient.query = rawSql
    //
    //
    // const diyExcel = function (conf) {
    //     const keys = conf.cols.map(e=>e.caption)
    //     let sbody = ''
    //     keys.forEach(e => {
    //         sbody += e + "\t"
    //     })
    //     sbody = sbody.trim()
    //     sbody += "\n"
    //     //
    //     const data = conf.rows
    //     let tmp1 = data[0]
    //     let tmp2 = tmp1.map((x,i)=>i)
    //     data.forEach(e => {
    //         tmp2.forEach((k) => {
    //             let t = e[k] || 0
    //             sbody = sbody + t + '\t'
    //         })
    //         sbody = sbody.trim()
    //         sbody += '\n'
    //     })
    //     return sbody
    // }
    //
    // const task = async function () {
    //     try {
    //         let attachments = []
    //         // sport
    //         let sqlSport = `select from_unixtime(ts / 1000, "%Y-%m-%d") date1, sum(amount / 1000000) amount,
    //               sum(amount / 1000000  - win / 1000000) profit, count(1) cnt, count(distinct addr) playerCnt
    //               from tron_live.sports_transaction_log
    //               where (status = 50 or status = 51)
    //               and currency = ?
    //               and ts >= ? AND ts < ?
    //               group by from_unixtime(ts / 1000, "%Y-%m-%d")
    //               order by from_unixtime(ts / 1000, "%Y-%m-%d")`
    //         let resultSport = await tronLiveClient.query(sqlSport, ["TRX", startTime, endTime,])
    //         if (resultSport && resultSport.length) {
    //             let conf = {}
    //             let arr = []
    //             let index = 0
    //             conf.name = `${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}sport流水`
    //             conf.cols = [
    //                 {
    //                     caption: "Date",
    //                     type: "string",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "amount",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "profit",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "Success Orders Count",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "Player Count",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //             ]
    //
    //             for (let item of resultSport) {
    //                 arr[index] = []
    //                 arr[index][0] = item.date1 ? item.date1 : ""
    //                 arr[index][1] = item.amount ? item.amount : 0
    //                 arr[index][2] = item.profit ? item.profit : 0
    //                 arr[index][3] = item.cnt ? item.cnt : 0
    //                 arr[index][4] = item.playerCnt ? item.playerCnt : 0
    //                 index++
    //             }
    //             conf.rows = arr
    //             const excelRaw = diyExcel(conf)
    //             fs.writeFileSync(
    //                 `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
    //                     .moment(endTime)
    //                     .format("YYYY-MM-DD")}sport流水.xls`,
    //                 excelRaw,
    //                 "binary"
    //             )
    //             let attachmentObj = {}
    //             attachmentObj.filename = `${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}sport流水.xls`
    //             attachmentObj.path = `./${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}sport流水.xls`
    //             attachments.push(attachmentObj)
    //         }
    //
    //         // sport USDT
    //         let resultSportUSDT = await tronLiveClient.query(sqlSport, [
    //             "USDT",
    //             startTime,
    //             endTime,
    //         ])
    //         if (resultSportUSDT && resultSportUSDT.length) {
    //             let conf = {}
    //             let arr = []
    //             let index = 0
    //             conf.name = `${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}sport-USDT流水`
    //             conf.cols = [
    //                 {
    //                     caption: "Date",
    //                     type: "string",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "amount",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "profit",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "Success Orders Count",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "Player Count",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //             ]
    //
    //             for (let item of resultSportUSDT) {
    //                 arr[index] = []
    //                 arr[index][0] = item.date1 ? item.date1 : ""
    //                 arr[index][1] = item.amount ? item.amount : 0
    //                 arr[index][2] = item.profit ? item.profit : 0
    //                 arr[index][3] = item.cnt ? item.cnt : 0
    //                 arr[index][4] = item.playerCnt ? item.playerCnt : 0
    //                 index++
    //             }
    //             conf.rows = arr
    //             const excelRaw = diyExcel(conf)
    //             fs.writeFileSync(
    //                 `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
    //                     .moment(endTime)
    //                     .format("YYYY-MM-DD")}sport-USDT流水.xls`,
    //                 excelRaw,
    //                 "binary"
    //             )
    //             let attachmentObj = {}
    //             attachmentObj.filename = `${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}sport-USDT流水.xls`
    //             attachmentObj.path = `./${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}sport-USDT流水.xls`
    //             attachments.push(attachmentObj)
    //         }
    //
    //         // hub88.csv
    //         let sqlHub88 = `select from_unixtime(ts / 1000, "%Y-%m-%d") date1, sum(amount / 1000000) amount,
    //               sum(amount / 1000000  - win / 1000000) profit, count(1) cnt, count(distinct email) playerCnt
    //               from swagger_transaction_log
    //               where status = 1
    //               and currency = 'TRX'
    //               and ts >= ? AND ts < ?
    //               group by from_unixtime(ts / 1000, "%Y-%m-%d")
    //               order by from_unixtime(ts / 1000, "%Y-%m-%d")`
    //         let resultHub88 = await tronLiveClient.query(sqlHub88, [
    //             startTime,
    //             endTime,
    //         ])
    //         if (resultHub88 && resultHub88.length) {
    //             let conf = {}
    //             let arr = []
    //             let index = 0
    //             conf.name = `${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}hub88流水`
    //             conf.cols = [
    //                 {
    //                     caption: "Date",
    //                     type: "string",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "amount",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "profit",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "Success Orders Count",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "Player Count",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //             ]
    //
    //             for (let item of resultHub88) {
    //                 arr[index] = []
    //                 arr[index][0] = item.date1 ? item.date1 : ""
    //                 arr[index][1] = item.amount ? item.amount : 0
    //                 arr[index][2] = item.profit ? item.profit : 0
    //                 arr[index][3] = item.cnt ? item.cnt : 0
    //                 arr[index][4] = item.playerCnt ? item.playerCnt : 0
    //                 index++
    //             }
    //             conf.rows = arr
    //             const excelRaw = diyExcel(conf)
    //             fs.writeFileSync(
    //                 `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
    //                     .moment(endTime)
    //                     .format("YYYY-MM-DD")}hub88流水.xls`,
    //                 excelRaw,
    //                 "binary"
    //             )
    //             let attachmentObj = {}
    //             attachmentObj.filename = `${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}hub88流水.xls`
    //             attachmentObj.path = `./${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}hub88流水.xls`
    //             attachments.push(attachmentObj)
    //         }
    //
    //         // EM result and currency = 'TRX'  老表没有这个字段
    //         let sqlEM = `select from_unixtime(ts / 1000, "%Y-%m-%d") date1, sum(Amount) amount,
    //           count(1) cnt, count(distinct addr) playerCnt
    //           from live_action_log_v2
    //           where txStatus = 1
    //           and ts >= ? AND ts < ?
    //           and action = ?
    //           and currency = 'TRX'
    //           group by from_unixtime(ts / 1000, "%Y-%m-%d")
    //           order by from_unixtime(ts / 1000, "%Y-%m-%d")`
    //         let resultEMResult = await tronLiveClient.query(sqlEM, [
    //             startTime,
    //             endTime,
    //             "result",
    //         ])
    //         if (resultEMResult && resultEMResult.length) {
    //             let conf = {}
    //             let arr = []
    //             let index = 0
    //             conf.name = `${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}EM玩家赢钱流水`
    //             conf.cols = [
    //                 {
    //                     caption: "Date",
    //                     type: "string",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "amount(result)",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "Success Orders Count",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "Player Count",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //             ]
    //
    //             for (let item of resultEMResult) {
    //                 arr[index] = []
    //                 arr[index][0] = item.date1 ? item.date1 : ""
    //                 arr[index][1] = item.amount ? item.amount : 0
    //                 arr[index][2] = item.cnt ? item.cnt : 0
    //                 arr[index][3] = item.playerCnt ? item.playerCnt : 0
    //                 index++
    //             }
    //             conf.rows = arr
    //             const excelRaw = diyExcel(conf)
    //             fs.writeFileSync(
    //                 `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
    //                     .moment(endTime)
    //                     .format("YYYY-MM-DD")}EM玩家赢钱流水.xls`,
    //                 excelRaw,
    //                 "binary"
    //             )
    //             let attachmentObj = {}
    //             attachmentObj.filename = `${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}EM玩家赢钱流水.xls`
    //             attachmentObj.path = `./${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}EM玩家赢钱流水.xls`
    //             attachments.push(attachmentObj)
    //         }
    //
    //         // EM bet
    //         let resultEMBet = await tronLiveClient.query(sqlEM, [
    //             startTime,
    //             endTime,
    //             "bet",
    //         ])
    //         if (resultEMBet && resultEMBet.length) {
    //             let conf = {}
    //             let arr = []
    //             let index = 0
    //             conf.name = `${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}EM下注流水`
    //             conf.cols = [
    //                 {
    //                     caption: "Date",
    //                     type: "string",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "amount(bet)",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "Success Orders Count",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //                 {
    //                     caption: "Player Count",
    //                     type: "number",
    //                     width: 20,
    //                 },
    //             ]
    //
    //             for (let item of resultEMBet) {
    //                 arr[index] = []
    //                 arr[index][0] = item.date1 ? item.date1 : ""
    //                 arr[index][1] = item.amount ? item.amount : 0
    //                 arr[index][2] = item.cnt ? item.cnt : 0
    //                 arr[index][3] = item.playerCnt ? item.playerCnt : 0
    //                 index++
    //             }
    //             conf.rows = arr
    //             const excelRaw = diyExcel(conf)
    //             fs.writeFileSync(
    //                 `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
    //                     .moment(endTime)
    //                     .format("YYYY-MM-DD")}EM下注流水.xls`,
    //                 excelRaw,
    //                 "binary"
    //             )
    //             let attachmentObj = {}
    //             attachmentObj.filename = `${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}EM下注流水.xls`
    //             attachmentObj.path = `./${utils
    //                 .moment(startTime)
    //                 .format("YYYY-MM-DD")}-${utils
    //                 .moment(endTime)
    //                 .format("YYYY-MM-DD")}EM下注流水.xls`
    //             attachments.push(attachmentObj)
    //         }
    //
    //
    //         console.log("last attachments is", attachments)
    //         await sendMail(attachments)
    //         //
    //         // 删除本地附件
    //         const dirs = attachments.map(e=>e.filename)
    //         for (let currency of dirs) {
    //             fs.unlinkSync(`${__dirname}/${currency}.xls`)
    //             fs.unlinkSync(`${__dirname}/${currency}.xls`)
    //         }
    //     } catch (e) {
    //         console.log(e)
    //     }
    // }
    //
    // task().then(() => {
    //     console.log("end")
    //     process.exit(0)
    // }).catch(e => {
    //     console.log(e)
    //     process.exit(1)
    // })ncy = 'TRX'  老表没有这个字段
    let sqlEM = `select from_unixtime(ts / 1000, "%Y-%m-%d") date1, sum(Amount) amount,
          count(1) cnt, count(distinct addr) playerCnt
          from live_action_log_v2
          where txStatus = 1
          and ts >= ? AND ts < ?
          and action = ?
          and currency = 'TRX'
          group by from_unixtime(ts / 1000, "%Y-%m-%d")
          order by from_unixtime(ts / 1000, "%Y-%m-%d")`
    let resultEMResult = await tronLiveClient.query(sqlEM, [
        startTime,
        endTime,
        "result",
    ])
    if (resultEMResult && resultEMResult.length) {
        let conf = {}
        let arr = []
        let index = 0
        conf.name = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}EM玩家赢钱流水`
        conf.cols = [
            {
                caption: "Date",
                type: "string",
                width: 20,
            },
            {
                caption: "amount(result)",
                type: "number",
                width: 20,
            },
            {
                caption: "Success Orders Count",
                type: "number",
                width: 20,
            },
            {
                caption: "Player Count",
                type: "number",
                width: 20,
            },
        ]

        for (let item of resultEMResult) {
            arr[index] = []
            arr[index][0] = item.date1 ? item.date1 : ""
            arr[index][1] = item.amount ? item.amount : 0
            arr[index][2] = item.cnt ? item.cnt : 0
            arr[index][3] = item.playerCnt ? item.playerCnt : 0
            index++
        }
        conf.rows = arr
        const excelRaw = diyExcel(conf)
        fs.writeFileSync(
            `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
                .moment(endTime)
                .format("YYYY-MM-DD")}EM玩家赢钱流水.xls`,
            excelRaw,
            "binary"
        )
        let attachmentObj = {}
        attachmentObj.filename = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}EM玩家赢钱流水.xls`
        attachmentObj.path = `./${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}EM玩家赢钱流水.xls`
        attachments.push(attachmentObj)
    }

    // EM bet
    let resultEMBet = await tronLiveClient.query(sqlEM, [
        startTime,
        endTime,
        "bet",
    ])
    if (resultEMBet && resultEMBet.length) {
        let conf = {}
        let arr = []
        let index = 0
        conf.name = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}EM下注流水`
        conf.cols = [
            {
                caption: "Date",
                type: "string",
                width: 20,
            },
            {
                caption: "amount(bet)",
                type: "number",
                width: 20,
            },
            {
                caption: "Success Orders Count",
                type: "number",
                width: 20,
            },
            {
                caption: "Player Count",
                type: "number",
                width: 20,
            },
        ]

        for (let item of resultEMBet) {
            arr[index] = []
            arr[index][0] = item.date1 ? item.date1 : ""
            arr[index][1] = item.amount ? item.amount : 0
            arr[index][2] = item.cnt ? item.cnt : 0
            arr[index][3] = item.playerCnt ? item.playerCnt : 0
            index++
        }
        conf.rows = arr
        const excelRaw = diyExcel(conf)
        fs.writeFileSync(
            `./${utils.moment(startTime).format("YYYY-MM-DD")}-${utils
                .moment(endTime)
                .format("YYYY-MM-DD")}EM下注流水.xls`,
            excelRaw,
            "binary"
        )
        let attachmentObj = {}
        attachmentObj.filename = `${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}EM下注流水.xls`
        attachmentObj.path = `./${utils
            .moment(startTime)
            .format("YYYY-MM-DD")}-${utils
            .moment(endTime)
            .format("YYYY-MM-DD")}EM下注流水.xls`
        attachments.push(attachmentObj)
    }


    console.log("last attachments is", attachments)
    // await sendMail(attachments)
    // //
    // // 删除本地附件
    // const dirs = attachments.map(e => e.filename)
    // for (let currency of dirs) {
    //     fs.unlinkSync(`${__dirname}/${currency}`)
    // }
    return attachments
}

module.exports = task