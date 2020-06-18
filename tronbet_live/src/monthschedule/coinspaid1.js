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
    const keys = conf.cols.map(e=>e.caption)
    let sbody = ''
    keys.forEach(e => {
        sbody += e + "\t"
    })
    sbody = sbody.trim()
    sbody += "\n"
    //
    const data = conf.rows
    let tmp1 = data[0]
    let tmp2 = tmp1.map((x,i)=>i)
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

const task = async function () {
    // let currencyArray = ["BTC", "ETH", "LTC", "BNB", "BCH", "USDT", "TRX"]
    let currencyArray = ["BTC", "ETH", "LTC", "BNB", "BCH", "USDT"]
    let attachments = []
    for (let currency of currencyArray) {
        let sql =
            "select currency,addr,tag,amount,ts from live_cb_deposit_log where currency=?"
        let result = await tronLiveClient.query(sql, [currency])
        // ctx.app.logger.info(utils.fileName(__filename) + " result", result)
        if (result && result.length) {
            let conf = {}
            let arr = []
            let index = 0
            conf.name = `${currency}充值记录`
            conf.cols = [
                {
                    caption: "currency",
                    type: "string",
                    width: 20,
                },
                {
                    caption: "addr",
                    type: "string",
                    width: 50,
                },
                {
                    caption: "tag",
                    type: "string",
                    width: 20,
                },
                {
                    caption: "amount",
                    type: "number",
                    width: 20,
                },
                {
                    caption: "ts",
                    type: "string",
                    width: 30,
                },
            ]

            for (let item of result) {
                arr[index] = []
                arr[index][0] = item.currency ? item.currency : ""
                arr[index][1] = item.addr ? item.addr : ""
                arr[index][2] = item.tag ? item.tag : ""
                if (item.currency === "USDT" || item.currency === "TRX") {
                    arr[index][3] = item.amount ? Number(item.amount) / 1000000 : 0
                } else {
                    arr[index][3] = item.amount ? Number(item.amount) / 1000000000 : 0
                }
                arr[index][4] = item.ts
                    ? utils.moment(item.ts).format("YYYY-MM-DD HH:mm:ss")
                    : ""
                index++
            }
            // console.log('deposit arr:',arr)
            conf.rows = arr
            const excelRaw = diyExcel(conf)
            fs.writeFileSync(`./${currency}充值记录.xls`, excelRaw, "binary")
            // let attachments = []
            let attachmentObj = {}
            attachmentObj.filename = `${currency}充值记录.xls`
            attachmentObj.path = `./${currency}充值记录.xls`
            attachments.push(attachmentObj)
        }
    }

    // 提现记录
    for (let currency of currencyArray) {
        let sql =
            "select currency,addr,tag,amount,startTs from live_cb_withdraw_log where currency=? and status=1"
        let result = await tronLiveClient.query(sql, [currency])
        // ctx.app.logger.info(utils.fileName(__filename) + " result", result)
        if (result && result.length) {
            let conf = {}
            let arr = []
            let index = 0
            conf.name = `${currency}提现记录`
            conf.cols = [
                {
                    caption: "currency",
                    type: "string",
                },
                {
                    caption: "addr",
                    type: "string",
                    width: 50,
                },
                {
                    caption: "tag",
                    type: "string",
                    width: 20,
                },
                {
                    caption: "amount",
                    type: "number",
                    width: 20,
                },
                {
                    caption: "startTs",
                    type: "string",
                    width: 30,
                },
            ]

            for (let item of result) {
                arr[index] = []
                arr[index][0] = item.currency ? item.currency : ""
                arr[index][1] = item.addr ? item.addr : ""
                arr[index][2] = item.tag ? item.tag : ""
                if (item.currency === "USDT" || item.currency === "TRX") {
                    arr[index][3] = item.amount ? Number(item.amount) / 1000000 : 0
                } else {
                    arr[index][3] = item.amount ? Number(item.amount) / 1000000000 : 0
                }
                arr[index][4] = item.startTs
                    ? utils.moment(item.startTs).format("YYYY-MM-DD HH:mm:ss")
                    : ""
                index++
            }
            conf.rows = arr
            // console.log('withdrawal arr:',arr)
            const excelRaw = diyExcel(conf)
            fs.writeFileSync(`./${currency}提现记录.xls`, excelRaw, "binary")
            // let attachments = []
            let attachmentObj = {}
            attachmentObj.filename = `${currency}提现记录.xls`
            attachmentObj.path = `./${currency}提现记录.xls`
            attachments.push(attachmentObj)
        }
    }
    return attachments
    // console.log("last attachments is", attachments)
    // await sendMail(attachments)
    //
    // // 删除本地附件
    // for (let currency of currencyArray) {
    //     fs.unlinkSync(`${__dirname}/${currency}提现记录.xls`)
    //     fs.unlinkSync(`${__dirname}/${currency}充值记录.xls`)
    // }
}

module.exports = task
