const {spawn} = require("child_process");
const reStartLiveDiv = async function () {
    console.log("====");
    const ls = spawn("pm2", ["restart", "tronlive_dividends"]);
    ls.stdout.on("data", data => {
        console.log(`livetrxRestart输出：${data}`);
    });

    ls.stderr.on("data", data => {
        console.log(`livetrxRestart错误：${data}`);
    });

    ls.on("close", code => {
        console.log(`livetrxRestart子进程退出码：${code}`);
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

const queryDetail = async function () {
    let sql = 'select send_ts from tron_live.live_div_info order by round desc limit 1';
    const data = await raw(sql, [])
    const a = data[0].send_ts
    const ts = a * 1000
    return ts
}

const queryDiv = async function (div_state) {
    let sql = 'select send_ts from tron_live.live_div_info order by round desc limit 1';
    if (div_state === '2') {
        sql = 'select send_ts from tron_live.live_div_info where div_state = 2 order by round desc limit 1';
    }
    const data = await raw(sql, [])
    const a = data[0].send_ts
    const ts = a * 1000
    return ts
}

const queryDivIsOver = async function () {
    let sql = 'select div_state from tron_live.live_div_info order by round desc limit 1';
    const data = await raw(sql, [])
    const a = data[0].div_state || '1'
    if(a === '1'){
        return true
    }else {
        return false
    }
}

const compareDate = async function (div_state) {
    const date1 = await queryDiv(div_state)
    let start = new Date();
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    const now = start.getTime()
    //
    if(div_state === 3){
        //20分钟特殊处理,每过20分钟还是没完成，直接重启
        const isReStart = queryDivIsOver()
        console.log("debug20livestart--->",new Date())
        if(isReStart){
            await reStartLiveDiv()
        }
    }
    if (date1 < now) {
        await reStartLiveDiv()
    } else {
        console.log(`分红正常${div_state}---->`, new Date(date1), new Date(start))
    }
}


const divSchedule = function () {
    // 3点，即11点profit的时候
    const a1 = schedule.scheduleJob('*/10 3-4 * * *', async function () {
        await compareDate('1')
    })
    const a2 = schedule.scheduleJob('*/15 3-4 * * *', async function () {
        await compareDate('2')
    })
    //
    const a3 = schedule.scheduleJob('*/20 3-4 * * *', async function () {
        await compareDate('3')
    })
    // 15点，即23点profit的时候
    const b1 = schedule.scheduleJob('*/10 15-16 * * *', async function () {
        await compareDate('1')
    })
    const b2 = schedule.scheduleJob('*/15 15-16 * * *', async function () {
        await compareDate('2')
    })
    //
    const b3 = schedule.scheduleJob('*/20 15-16 * * *', async function () {
        await compareDate('3')
    })
}


module.exports = {
    divSchedule
}
