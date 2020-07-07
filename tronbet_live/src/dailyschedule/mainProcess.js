const {openProductRateSchedule} = require("./productRateSchedule")
const liveTrxStart = require("./liveTrxStart")
const liveUsdtStart = require("./liveUsdtStart")
const liveBalanceAudit = require("./liveBalanceAudit")
// const liveScanReload = require("./liveScanReload")
const monthSchedule = require("./../monthschedule/main")

const main = async function () {
    await openProductRateSchedule()
    //屏蔽测试环境
    if(process.env.NODE_ENV !== 'test'){
        console.log("prd_schedule_start")
        await liveTrxStart()
        await liveUsdtStart()
        await liveBalanceAudit()
    }
    await monthSchedule()
}

module.exports = main
