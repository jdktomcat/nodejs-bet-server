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

async function insertDB(info) {
    let sql =
        "insert into tron_bet_admin.ante_burnt_log(types, call_addr, amount, ts, tx_id) values (?, ?, ?, ?, ?) ON DUPLICATE KEY update tx_id = ?";

    let res = await db.exec(sql, [
        info.type,
        info.addr,
        info.amount,
        info.ts,
        info.tx,
        info.tx
    ]);
    console.log("insertDB res", res);
}

async function main() {
    //平台燃烧
    let info = [];
    let obj1 = {};
    obj1.type = 2;
    obj1.addr = "THtbMw6byXuiFhsRv1o1BQRtzvube9X1jx";
    obj1.amount = 46305130798879;
    obj1.ts = 1582794489000;
    obj1.tx = "2dc0917461b94e55dadbdd070e3e720599d5b729345ca3da3957a0afd885eecf";
    info.push(obj1);


    //回购燃烧
    let obj3 = {};
    obj3.type = 1;
    obj3.addr = "THNpF5h4isLgXe7rtw6833nSgTqhfuVJLN";
    obj3.amount = 478965413330000;
    obj3.ts = 1583220348000;
    obj3.tx = "8f158e5555603a4886a21918f4fd5ae92f4b3dd2b39c0a36b3d77a8b281d4003";
    info.push(obj3);

    for (let item of info) {
        await insertDB(item);
    }
    console.log("excute end!")
    process.exit(0);
}

main().catch(e=>{
    console.log("error is ",e)
    process.exit(1)
})
