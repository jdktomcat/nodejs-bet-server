const diceScanStart = require("./diceScanStart")
const winTrxDivStart = require("./winTrxDivStart")

const main = async function () {
    //dice扫块
    diceScanStart()
    //
    await winTrxDivStart()
}

module.exports = main