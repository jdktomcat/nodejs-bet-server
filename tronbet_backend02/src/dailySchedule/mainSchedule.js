const diceScanStart = require("./diceScanStart")
const winTrxDivStart = require("./winTrxDivStart")
const diceTrxDivStart = require("./diceTrxDivStart")
const diceAllScanReload = require("./diceAllScanReload")

const main = async function () {
    //dice扫块
    diceScanStart()
    //
    await diceTrxDivStart()
    //
    await diceAllScanReload()
    //
    await winTrxDivStart()
}


module.exports = main