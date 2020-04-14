const {spawn} = require("child_process");
const redisUtils = require('../utils/redisUtil');
const reStartLiveDiv = async function () {
    console.log("----pm2restart---->", new Date());
    const ls = spawn("pm2", ["restart", "tronlive_dividends_trc20"]);
    //
    const desc = 'liveUsdtRestart'
    ls.stdout.on("data", data => {
        console.log(`${desc}输出：${data}`);
    });

    ls.stderr.on("data", data => {
        console.log(`${desc}错误：${data}`);
    });

    ls.on("close", code => {
        console.log(`${desc}子进程退出码：${code}`);
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
    let sql = 'select start from tron_live.live_trc20_div_info order by round desc limit 1';
    const data = await raw(sql, [])
    const a = data[0].start
    const ts = a * 1000
    return ts
}

const queryDivIsOver = async function () {
    let sql = 'select state as div_state from tron_live.live_trc20_div_info order by round desc limit 1';
    const data = await raw(sql, [])
    const a = data[0].div_state || '1'
    console.log('queryDivIsOver div_state', new Date(), '--->', a)
    if (a === '1') {
        return true
    } else {
        return false
    }
}

const queryDivDetailNumber = async function () {
    let sql = 'select round,div_state from tron_live.live_trc20_div_info order by round desc limit 1';
    const data = await raw(sql, [])
    const a = data[0].div_state || '1'
    if (a === '1') {
        const roundTmp = data[0].round
        const round = Number(roundTmp)
        if (!isNaN(round)) {
            let sql = 'select count(1) as count from live_trc20_div_detail where round = ?';
            const countInfo = await raw(sql, [round])
            const count = countInfo[0].count || 0
            const min = new Date().getUTCMinutes()
            console.log("live_div_detail count is: ", count, ', min is', min)
            if (min > 6 && min <= 12 && count <= 2750) {
                return true
            } else if (min > 12 && min < 18 && count <= 5000) {
                return true
            } else if (min >= 18 && min < 23 && count <= 9000) {
                return true
            }
        }
    }
    return false
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
    const min = new Date().getUTCMinutes()
    if (min > 6 && min <= 16) {
        const profit = await redisUtils.hget('tronlive:realtime', 'usdt');
        if(profit > 0){
            const normal = await isDivNormal()
            if(!normal){
                console.log('usdt div fail,and restart')
                await reStartLiveDiv()
            }
        }
    } else if (min >= 17 && min <= 33) {
        //25分钟后判断是否完成，or restart
        const isNotOver = await queryDivIsOver()
        console.log("div isNotOver is", isNotOver)
        if (isNotOver) {
            await reStartLiveDiv()
        }
    }
}


const divSchedule = function () {
    // 4点，即12点profit的时候
    const a1 = schedule.scheduleJob('*/5 4-5 * * *', async function () {
        await compareDate()
    })
    // 16点，即24点profit的时候
    const b1 = schedule.scheduleJob('*/5 16-17 * * *', async function () {
        await compareDate()
    })
}


module.exports = divSchedule
