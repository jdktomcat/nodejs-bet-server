const process_desc = "tronbet_auto_dividends_"
const schedule = require('node-schedule');
const db = require('../utils/dbUtil')
const reloadProcess = function () {
    console.log("----tronbet_auto_dividends---->", new Date());
    const cmd = 'pm2 reload tronbet_auto_dividends'
    try {
        const child_process = require("child_process")
        const a = child_process.execSync(cmd).toString()
        console.log(process_desc + "reloadProcess_out: \n", a)
        return a
    } catch (e) {
        console.log(process_desc + "reloadProcess_error: \n", e)
        return e.toString()
    }
}
const raw = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}

const queryDivInfo = async function () {
    let start = new Date();
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    const now = start.getTime() / 1e3
    //
    let sql = 'select send_ts from tron_bet_wzc.dice_ver_v1 where send_ts >= ?';
    const data = await raw(sql, [now])
    //
    if (data.length > 0) {
        //分红正常
        console.log(process_desc + "queryDivInfo_normal!", new Date().toUTCString())
    } else {
        //
        console.log(process_desc + "queryDivInfo_restart!", new Date().toUTCString())
        await reloadProcess()
    }
}


const queryDivIfComplete = async function (type) {
    let start = new Date();
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    const now = start.getTime() / 1e3
    //
    let sql = 'select send_ts from tron_bet_wzc.dice_ver_v1 where send_ts >= ? and div_state = ?';
    const data = await raw(sql, [now, type])
    //
    if (data.length > 0) {
        //分红正常
        console.log(`${process_desc}queryDivIfComplete_${type} normal!`, new Date().toUTCString())
    } else {
        console.log(`${process_desc}queryDivIfComplete_${type} restart`, new Date().toUTCString())
        await reloadProcess()
    }
}

const compareDate = async function () {
    // 5分钟检查一下11点后是否正常
    await queryDivInfo()
    //
    const min = new Date().getUTCMinutes()
    if (min > 6 && min < 20) {
        //判断条数
        await queryDivIfComplete('1')
    } else if (min >= 20 && min <= 59) {
        //25分钟后判断是否完成，or restart
        await queryDivIfComplete('2')
    }
}


const divSchedule = function () {
    // 3点，即11点profit的时候
    const a1 = schedule.scheduleJob('*/5 3-4 * * *', async function () {
        await compareDate()
    })
}


module.exports = divSchedule