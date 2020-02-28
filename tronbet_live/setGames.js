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


const removeDirtyGame = async function () {
    const db = require("./src/utils/dbUtil");
    const updateSql = "delete from live_online_game where status = '1'"
    console.log("excute sql is: ",updateSql)
    await db.exec(updateSql, [])
}


async function main() {
    await removeDirtyGame()
    console.log("remove gameID Done");
    process.exit(0);
}

main();
