const {openProductRateSchedule} = require("./productRateSchedule")
const liveTrxStart = require("./liveTrxStart")
const winTrxDivStart = require("./winTrxDivStart")



const main = async function () {
    await openProductRateSchedule()
    await liveTrxStart()
    await winTrxDivStart()
}

module.exports = main