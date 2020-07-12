const {openProductRateSchedule} = require("./productRateSchedule")
const liveTrxStart = require("./liveTrxStart")
const liveUsdtStart = require("./liveUsdtStart")
const liveBalanceAudit = require("./liveBalanceAudit")
// const liveScanReload = require("./liveScanReload")
const monthSchedule = require("./../monthschedule/main")
const hub88Black = require("./hub88Black")

const main = async function () {
    await openProductRateSchedule()
    //屏蔽测试环境
    if(process.env.NODE_ENV !== 'test'){
        console.log("prd_schedule_start")
        await liveTrxStart()
        await liveUsdtStart()
        await liveBalanceAudit()
        //
        await monthSchedule()
        //
        await hub88Black()
    }
}

module.exports = main
