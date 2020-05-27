const {openProductRateSchedule} = require("./productRateSchedule")
const liveTrxStart = require("./liveTrxStart")
const liveUsdtStart = require("./liveUsdtStart")
const liveBalanceAudit = require("./liveBalanceAudit")

const main = async function () {
    await openProductRateSchedule()
    await liveTrxStart()
    await liveUsdtStart()
    await liveBalanceAudit()
}

module.exports = main
