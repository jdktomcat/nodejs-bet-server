const scanDiceRestart = function () {
    console.log("----reScanDice---->", new Date());
    const cmd = 'pm2 reload tronbet_scan_dice'
    try{
        const child_process = require("child_process")
        const a = child_process.execSync(cmd).toString()
        console.log("scanDiceRestart_out: \n",a)
        return a
    }catch (e) {
        console.log("scanDiceRestart_error: \n",e)
        return e.toString()
    }
}

const diceScan = function () {
    // 每个小时30分的时候重启dice扫描
    // '42 * * * *'
    const schedule = require('node-schedule');
    const a1 = schedule.scheduleJob('25 * * * *', function () {
        console.log(new Date(),"diceScanSchedule")
        scanDiceRestart()
    })

}

module.exports = diceScan
