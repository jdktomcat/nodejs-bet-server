const scanDiceAllRestart = function () {
    console.log("----reScanAllDice---->", new Date());
    const cmd = 'pm2 reload scan_dice'
    try{
        const child_process = require("child_process")
        const a = child_process.execSync(cmd).toString()
        console.log("reScanAllDice_out: \n",a)
        return a
    }catch (e) {
        console.log("reScanAllDice_error: \n",e)
        return e.toString()
    }
}

const diceScanSchedule = function () {
    // 每个小时30分的时候重启所有的dice扫描
    // '42 * * * *'
    const schedule = require('node-schedule');
    const a1 = schedule.scheduleJob('30 * * * *', async function () {
        console.log(new Date(),"diceScanSchedule")
        await scanDiceAllRestart()
    })

}

module.exports = diceScanSchedule
