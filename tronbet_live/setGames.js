// const redisUtil = require("./src/utils/redisUtil");
// const axios = require("axios");
// const game = require("./src/service/games");
//
// async function gameGames() {
//   let games = await game.parseGames();
//   await redisUtil.hset("tronlive:gamelist", "games", JSON.stringify(games));
//   console.log(games);
// }
//
// async function main() {
//   await gameGames();
//   process.exit(0);
// }
//
// main();


const db = require("./src/utils/dbUtil");
async function fixBalance() {
    let sqlbefore = "select * from live_balance where addr = '0x5b6abfaa7a32f2e5ab35b6918c93f4593a311b1f' and currency = 'ETH'";
    let rs1 = await db.exec(sqlbefore)
    console.log("before is --->",rs1)
    //
    let sql =
    "update live_balance set balance = balance + ? where addr = '0x5b6abfaa7a32f2e5ab35b6918c93f4593a311b1f' and currency = 'ETH'";
    let balance = 0.48 * 1e9
    let res = await db.exec(sql, [balance]);
    console.log("update res->",res)
    //
    let rs2 = await db.exec(sqlbefore)
    console.log("after is --->",rs2)
}
fixBalance()
