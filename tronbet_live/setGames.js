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
const removeDirtyGame = async function () {
    const updateSql = "delete from tron_live.live_online_game where status = '1'"
    console.log("excute sql is: ",updateSql)
    await db.exec(updateSql, [])
}

// TGT6C12BP36s21n5MTwG9Fcxa597UvKDRs  140
// TSo2tj2YXfMhLHpb6GxFombCuErtJrJ8nD  127.74
// TJuJFibqBZGB13ydFCH4AK8zhK18r6dD6k 14050
const fixBalance = async function () {
    const array = ['TGT6C12BP36s21n5MTwG9Fcxa597UvKDRs','TSo2tj2YXfMhLHpb6GxFombCuErtJrJ8nD','TJuJFibqBZGB13ydFCH4AK8zhK18r6dD6k']
    const querySql = "select addr,balance / 1000000 as balance,currency from tron_live.live_balance where addr = ? and currency = 'TRX'"
    const updateSql = "update tron_live.live_balance set balance = 0 where addr = ? and currency = 'TRX' "
    for (let e of array) {
        console.log(querySql,e)
        const a1 = await db.exec(querySql,[e])
        if(a1.length > 0){
            console.log(`${e} data is `,a1.length,a1[0].addr,a1[0].balance,a1[0].currency)
        }
        console.log(updateSql,e)
        await db.exec(updateSql,[e])
    }
    console.log("\n\nafter is===>")
    for (let e of array) {
        console.log(querySql,e)
        const a1 = await db.exec(querySql,[e])
        if(a1.length > 0){
            console.log(`${e} data is `,a1.length,a1[0].addr,a1[0].balance,a1[0].currency)
        }
    }
}


// async function main() {
//     await removeDirtyGame()
//     console.log("======分割线=====\n\n")
//     await fixBalance()
//     console.log("remove gameID Done");
//     process.exit(0);
// }

// main();
