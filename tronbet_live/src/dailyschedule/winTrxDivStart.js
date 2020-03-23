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

const queryDiv = async function () {
    let sql = 'select * from tron_bet_wzc.win_ver_v1 order by ver desc limit 1';
    const data = await raw(sql, [])
    const a = data[0].send_ts
    const ts = a * 1000
    return ts
}

const queryDivIsOver = async function () {
    let sql = 'select * from tron_bet_wzc.win_ver_v1 order by ver desc limit 1';
    const data = await raw(sql, [])
    const a = data[0].div_state || '1'
    console.log('queryDivIsOver div_state', new Date(), '--->', a)
    if (a === '1') {
        return true
    } else {
        return false
    }
}

const isDivNormal = async function () {
    const date1 = await queryDiv()
    let start = new Date();
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    const now = start.getTime()
    if (date1 < now) {
        return false
    } else {
        console.log("div normal ,now is ", new Date(date1), new Date(start))
        return true
    }
}

const compareDate = async function () {
    const isStart = isDivNormal()
    if (isStart) {
        const min = new Date().getUTCMinutes()
        if (min >= 23 && min <= 59) {
            //25分钟后判断是否完成，or restart
            const isNotOver = await queryDivIsOver()
            console.log("div isNotOver is", isNotOver)
            if (isNotOver) {
                await restartWinProcess()
            }
        }
    } else {
        //每5分钟检测一次
        await restartWinProcess()
    }
}


const divSchedule = function () {
    // 4点，即12点profit的时候
    const a1 = schedule.scheduleJob('*/5 4-5 * * *', async function () {
        await compareDate()
    })
}


module.exports =  divSchedule