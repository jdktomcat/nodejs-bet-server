const Common = require("./common");
const SetBalance = require("./setBalance");

const Log = Common.Log;

const main = (async function() {
    Log("declan set game start!");
    await SetBalance.SetBalance("TBqMEQWtqTR9qBMfnP1NWAwukfkX54E7DQ", 0);
})().then(() => {
    Log("declan set game end!");
    process.exit(0);
}).catch(e => {
    Log("declan set game error: ", e);
    process.exit(1);
})

module.exports = main
