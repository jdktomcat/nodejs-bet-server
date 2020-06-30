const {openProductRateSchedule} = require("./productRateSchedule")
const liveTrxStart = require("./liveTrxStart")
const liveUsdtStart = require("./liveUsdtStart")
const liveBalanceAudit = require("./liveBalanceAudit")
// const liveScanReload = require("./liveScanReload")
const monthSchedule = require("./../monthschedule/main")

const main = async function () {
    await openProductRateSchedule()
    await liveTrxStart()
    await liveUsdtStart()
    await liveBalanceAudit()
    // 扫描
    // liveScanReload()
    //
    monthSchedule()
}

module.exports = main
