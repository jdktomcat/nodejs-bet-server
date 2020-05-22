const {spawn} = require("child_process");
const restartWinProcess = async function () {
    console.log("----pm2restart---->", new Date());
    const ls = spawn("pm2", ["restart", "tronbet_auto_dividends_win"]);
    ls.stdout.on("data", data => {
        console.log(`tronbet_auto_dividends_win输出：${data}`);
    });

    ls.stderr.on("data", data => {
        console.log(`tronbet_auto_dividends_win错误：${data}`);
    });

    ls.on("close", code => {
        console.log(`tronbet_auto_dividends_win子进程退出码：${code}`);
    });
}
const schedule = require('node-schedule');
const db = require('../utils/dbUtil')

const raw = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}
//tron_bet_wzc.win_ver_v1
const queryDivInfo = async function () {
    let start = new Date();
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    const now = start.getTime() / 1e3
    //
    let sql = 'select send_ts from tron_bet_wzc.win_ver_v1 where send_ts >= ?';
    const data = await raw(sql, [now])
    //
    if (data.length > 0) {
        //分红正常
        console.log("queryDivInfo normal!", new Date().toUTCString())
    } else {
        //
        console.log("queryDivInfo reStartLiveDiv!", new Date().toUTCString())
        await restartWinProcess()
    }
}


const queryDivIfComplete = async function (type) {
    let start = new Date();
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    const now = start.getTime() / 1e3
    //
    let sql = 'select send_ts from tron_live.live_div_info where send_ts >= ? and div_state = ?';
    const data = await raw(sql, [now, type])
    //
    if (data.length > 0) {
        //分红正常
        console.log(`queryDivIfComplete_${type} normal!`, new Date().toUTCString())
    } else {
        console.log(`queryDivIfComplete_${type} reStartLiveDiv!`, new Date().toUTCString())
        await restartWinProcess()
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
    // 4点，即12点profit的时候
    const a1 = schedule.scheduleJob('*/5 4-5 * * *', async function () {
        await compareDate()
    })
}


module.exports =  divSchedule