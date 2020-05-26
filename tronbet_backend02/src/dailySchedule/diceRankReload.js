const scanDiceRestart = function () {
    console.log("----diceRankReload---->", new Date());
    const cmd = 'pm2 reload tronbet_rank'
    try{
        const child_process = require("child_process")
        const a = child_process.execSync(cmd).toString()
        console.log("diceRankReload_out: \n",a)
        return a
    }catch (e) {
        console.log("diceRankReload_error: \n",e)
        return e.toString()
    }
}

const rankSchedule = function () {
    // 每个小时30分的时候重启dice扫描
    // '42 * * * *'
    const schedule = require('node-schedule');
    const a1 = schedule.scheduleJob('20 * * * *', function () {
        console.log(new Date(),"diceRankReload")
        scanDiceRestart()
    })

}

module.exports = rankSchedule
