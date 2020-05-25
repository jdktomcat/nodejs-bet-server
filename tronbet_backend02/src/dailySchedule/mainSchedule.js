const diceScanStart = require("./diceScanStart")
const winTrxDivStart = require("./winTrxDivStart")
const diceTrxDivStart = require("./diceTrxDivStart")
const diceAllScanReload = require("./diceAllScanReload")
const diceRankReload = require("./diceRankReload")

const main = async function () {
    //dice scan
    await diceScanStart()
    // 所有dice scan
    await diceAllScanReload()
    // 排行榜
    await diceRankReload()

    //
    // dice div
    await diceTrxDivStart()
    // win div
    await winTrxDivStart()
}


module.exports = main