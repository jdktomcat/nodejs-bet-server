const fs = require("fs")
const {sendMail} = require("./mailUtils")
const coinspaid = require("./coinspaid1")
const financial = require("./financial1")
const financialDiv = require("./financialDiv1")
const btt_divide = require("./btt_divide")
const mail = [
    'andrew.li@tron.network',
    // 'jason.zhang@tron.network',
    // 'gordon.huang@tron.network'
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

const coinspaidData = async function () {
    const attachments = await coinspaid()
    const p = {
        mail: mail,
        attachments: attachments,
        title: "充值提现"
    }
    await sendMail(p)
    deleteExcel(attachments)
}

const financialData = async function (startDate, endDate) {
    const attachments = await financial(startDate, endDate)
    const p = {
        mail: mail,
        attachments: attachments,
        title: "live_流水"
    }
    await sendMail(p)
    deleteExcel(attachments)
}

const financialDivData = async function (startDate, endDate) {
    const attachments = await financialDiv(startDate, endDate)
    const p = {
        mail: mail,
        attachments: attachments,
        title: "live_usdt_divide"
    }
    await sendMail(p)
    deleteExcel(attachments)
}

const bttDivideData = async function (startDate, endDate) {
    const attachments = await btt_divide(startDate, endDate)
    const p = {
        mail: mail,
        attachments: attachments,
        title: "btt_monthly_divide"
    }
    await sendMail(p)
    deleteExcel(attachments)
}

const main = async function () {
    const schedule = require('node-schedule');
    // 每个月1号6点（14点）自动触发
    // const a1 = schedule.scheduleJob('0 6 1 * *', async function () {
    const a1 = schedule.scheduleJob('52 * * * *', async function () {
        console.log(new Date(), "test_month_schedule")
        const {startDate, endDate} = getMonth()
        console.log(startDate, endDate)
        await coinspaidData()
        await financialData(startDate, endDate)
        await financialDivData(startDate, endDate)
        // add btt 20200707
        await bttDivideData(startDate,endDate)
    })
}

module.exports = main