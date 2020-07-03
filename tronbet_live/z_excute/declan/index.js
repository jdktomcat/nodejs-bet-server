const Common = require("./common");
const SetBalance = require("./setBalance");

const Log = Common.Log;

const main = (async function() {
    Log("declan set game start!");
    // await SetBalance.AddBalance("TTee3vKWqtZaafkuTEtwFd2QHwcyGkNEnj", 1e6 * 1e6);
    await SetBalance.AddBalance("TRjG49QTLNqu9CESrp7f2QBVjDJf4XQpkC", 568500 * 1e6);
})().then(() => {
    Log("declan set game end!");
    process.exit(0);
}).catch(e => {
    Log("declan set game error: ", e);
    process.exit(1);
})

module.exports = main
