// const process = function () {
//     console.log("----liveScanReload---->", new Date());
//     const cmd = 'pm2 reload scan_live'
//     try {
//         const child_process = require("child_process")
//         const a = child_process.execSync(cmd).toString()
//         console.log("liveScanReload_out: \n", a)
//         return a
//     } catch (e) {
//         console.log("liveScanReload_error: \n", e)
//         return e.toString()
//     }
// }
//
// const liveScanSchedule = function () {
//     // 每个小时30分的时候重启live扫描
//     const schedule = require('node-schedule');
//     const a1 = schedule.scheduleJob('30 * * * *', function () {
//         console.log(new Date(), "liveScanReload")
//         process()
//     })
// }
//
// module.exports = liveScanSchedule
