const fs = require("fs")
const {sendMail} = require("./mailUtils")
const coinspaid = require("./coinspaid1")
const financial = require("./financial1")
const financialDiv = require("./financialDiv1")
const btt_divide = require("./btt_divide")
const trx_sum = require("./trx_sum")
const mail = [
    'andrew.li@tron.network',
    'jason.zhang@tron.network',
    'gordon.huang@tron.network'
]

const deleteExcel = function (attachments) {
    for (let e of attachments) {
        const p = e.path
        fs.unlinkSync(p)
    }
}

const getMonth = function () {
    const now = new Date()
    let nowMonth = now.getUTCMonth() + 1
    nowMonth = String(nowMonth).length < 2 ? "0" + nowMonth : String(nowMonth)
    let endString = now.getFullYear() + "-" + nowMonth + "-" + "01"
    //
    now.setUTCMonth(now.getUTCMonth() - 1)
    let lastMonth = now.getUTCMonth() + 1
    lastMonth = String(lastMonth).length < 2 ? "0" + lastMonth : String(lastMonth)
    let startString = now.getFullYear() + "-" + lastMonth + "-" + "01"
    return {
        startDate: startString,
        endDate: endString,
    }
}

const zipDeal = function (name, attachments, array) {
    const zip = new require('node-zip')();
    for (let e of attachments) {
        // zip.file('file1.txt', fs.readFileSync(path.join(__dirname, 'file1.txt')));
        zip.file(e.filename, fs.readFileSync(e.path));
    }
    const data = zip.generate({base64: false, compression: 'DEFLATE'});
    const fileName = name + ".zip"
    fs.writeFileSync(fileName, data, 'binary');
    //移除
    deleteExcel(attachments)
    const obj = {
        filename: fileName,
        path: "./" + fileName
    }
    array.push(obj)
}

const getData = async function (startDate, endDate) {
    // [ { filename: '2020-06-01-2020-07-01sport流水.xls',
    //     path: './2020-06-01-2020-07-01sport流水.xls' },
    //     { filename: '2020-06-01-2020-07-01hub88流水.xls']
    // deposit withdraw
    const d_w = await coinspaid()
    // live流水
    const live_log = await financial(startDate, endDate)
    // usdt
    const usdt_log = await financialDiv(startDate, endDate)
    // btt 流水
    const btt_log = await btt_divide(startDate, endDate)
    //
    // divide
    const divide_log = await trx_sum(startDate, endDate)
    // 合并
    let a = []
    zipDeal('充值提现', d_w, a)
    zipDeal('live流水', live_log, a)
    zipDeal('usdt_divide', usdt_log, a)
    zipDeal('btt流水', btt_log, a)
    zipDeal('trx_divide_sum', divide_log, a)
    console.log("last a is ", a)
    await sendMail({
        mail: mail,
        attachments: a,
        title: "月度数据"
    })
    deleteExcel(a)
}

const main = async function () {
    const schedule = require('node-schedule');
    // 每个月1号6点（10点）自动触发
    // const a1 = schedule.scheduleJob('0 2 1 * *', async function () {
    // for test
    const a1 = schedule.scheduleJob('40 * * * *', async function () {
        console.log(new Date(), "test_month_schedule")
        // const {startDate, endDate} = getMonth()
        const startDate = '2020-04-01'
        const endDate = '2020-07-11'
        console.log(startDate, endDate)
        await getData(startDate, endDate)
    })
}

module.exports = main