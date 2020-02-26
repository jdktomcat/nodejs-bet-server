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

async function removeDirtyData1() {
    let sql2 = "delete from tron_bet_admin.sum_addr_detail";
    //数据过大，先删除再生成
    console.log(sql2)
    await db.exec(sql2, []);
}



async function removeDirtyData2() {
    let sql2 = "delete from tron_bet_admin.sum_dice_data where type = 'all'";
    console.log(sql2)
    await db.exec(sql2, []);
}


async function main() {
    await removeDirtyData1()
    await removeDirtyData2()
    console.log("remove data Done");
    process.exit(0);
}

main();


