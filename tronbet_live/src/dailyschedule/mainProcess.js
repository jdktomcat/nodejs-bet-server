const {openProductRateSchedule} = require("./productRateSchedule")
const liveTrxStart = require("./liveTrxStart")
const winTrxDivStart = require("./winTrxDivStart")
const liveUsdtStart = require("./liveUsdtStart")



const main = async function () {
    await openProductRateSchedule()
    await liveTrxStart()
    await winTrxDivStart()
    await liveUsdtStart()
}

module.exports = main