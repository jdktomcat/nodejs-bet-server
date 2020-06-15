const Common = require("./common");
const SetBalance = require("./setBalance");

const Log = Common.Log;

const main = (async function() {
    Log("declan set game start!");
    await SetBalance.AddBalanceAndBalanceOffset("TV1JGKUpA8eZ9g69gFxViDzYRTEcLdsVwf", 6585385958);
})().then(() => {
    Log("declan set game end!");
    process.exit(0);
}).catch(e => {
    Log("declan set game error: ", e);
    process.exit(1);
})

module.exports = main
