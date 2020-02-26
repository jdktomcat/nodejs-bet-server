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
    let sql1 = "select * from tron_bet_admin.sum_addr_detail";
    const data1 = await db.exec(sql1, []);
    let k = {}
    let nData = []
    data1.forEach(e=>{
        const addr = e.addr || ''
        if(k[addr] === undefined){
            k[addr] = 1
            nData.push(e)
        }
    })
    //
    let sql2 = "delete from tron_bet_admin.sum_addr_detail";
    await db.exec(sql2, []);
    for (let ele of nData){
        const sql3 = `insert into tron_bet_admin.sum_addr_detail(day,addr,ts) values (?,?,?)`
        const params3 = [ele.day,ele.addr,ele.ts]
        await db.exec(sql3, params3);
    }
}



async function removeDirtyData2() {
    let sql1 = "select * from tron_bet_admin.sum_dice_data where type = 'all'";
    const data1 = await db.exec(sql1, []);
    let k = {}
    let nData = []
    data1.forEach(e=>{
        const day_str = e.day_str || ''
        if(k[day_str] === undefined){
            k[day_str] = 1
            nData.push(e)
        }
    })
    //
    let sql2 = "delete from tron_bet_admin.sum_dice_data where type = 'all'";
    await db.exec(sql2, []);
    for (let ele of nData){
        const sql3 = `insert into tron_bet_admin.sum_dice_data(type,day_str,data_str,ts) values ('all',?,?,?)`
        const params3 = [ele.day_str,ele.data_str, ele.ts]
        await db.exec(sql3, params3);
    }
}


async function main() {
    await removeDirtyData1()
    await removeDirtyData2()
    console.log("remove data Done");
    process.exit(0);
}

main();


