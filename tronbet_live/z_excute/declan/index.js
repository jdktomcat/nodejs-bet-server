const Common = require("./common");
const SetBalance = require("./setBalance");

const Log = Common.Log;

const main = (async function() {
    Log("declan set game start!");
    await SetBalance.AddBalanceAndBalanceOffset("TAvpRSYPBwz4kocq3Z6cVN6X2T9STLVmRe", 981.98757 * 1e6);
    await SetBalance.AddBalanceAndBalanceOffset("TMUTJP5GuQCVzViKKVEBBaXGq9A27JsAfN", 12440 * 1e6);
})().then(() => {
    Log("declan set game end!");
    process.exit(0);
}).catch(e => {
    Log("declan set game error: ", e);
    process.exit(1);
})

module.exports = main
