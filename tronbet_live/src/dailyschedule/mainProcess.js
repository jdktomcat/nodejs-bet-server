const {openProductRateSchedule} = require("./productRateSchedule")
const liveTrxStart = require("./liveTrxStart")
const liveUsdtStart = require("./liveUsdtStart")



const main = async function () {
    await openProductRateSchedule()
    await liveTrxStart()
    await liveUsdtStart()
}

module.exports = main