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
    const addr = [
        'TJwWYdtkbKmPb6N8wXxUyhtgHAF4GzqqN6',
        'TWRX8VYtjE19DvjHKGtgeH2cAMJTQv988y',
        'TLfD5vPXqBxaXk2TfZw7pAanTpCRENCmUW',
        'TRSM44ApG4cu6QiGefCjPs4RXNKNkSz2vq',
        'TSoCt1cNqiQzEYbXYZTtqouDFe6wJoghUK',
        'TBUBnLxPcy4iBC6pewZaHZZ1ptzoBZ6hV6',
        'TM2qHmUTpNhsFGVutbNGShV1hEjRabUqwf',
        'TKETM8NJdhc7ocm5CJKCj8z61pvYJdSjHH',
        'TSCGR7ymcuohrJtNUSQLBF7n7cH7oPQpPL'
    ]
    for(let e of addr){
        let sql =
        "update tron_live.live_balance set balance = 0 where addr = ? and currency = 'TRX'";
        console.log(sql,e)
        await db.exec(sql, ",params is " +[e]);
    }
    //
    console.log("update end,debug---->balance")
    const sql2 = `
            select
            a.addr,
            a.balance / 1000000 as balance,
            a.currency
            from live_balance a
        where a.addr in (
        'TJwWYdtkbKmPb6N8wXxUyhtgHAF4GzqqN6',
        'TWRX8VYtjE19DvjHKGtgeH2cAMJTQv988y',
        'TLfD5vPXqBxaXk2TfZw7pAanTpCRENCmUW',
        'TRSM44ApG4cu6QiGefCjPs4RXNKNkSz2vq',
        'TSoCt1cNqiQzEYbXYZTtqouDFe6wJoghUK',
        'TBUBnLxPcy4iBC6pewZaHZZ1ptzoBZ6hV6',
        'TM2qHmUTpNhsFGVutbNGShV1hEjRabUqwf',
        'TKETM8NJdhc7ocm5CJKCj8z61pvYJdSjHH',
        'TSCGR7ymcuohrJtNUSQLBF7n7cH7oPQpPL'
        )
    `
    const o = await db.exec(sql2, []);
    for(let k of o){
        console.log(`${k.addr} now balance is ${k.balance} ${k.currency}`)
    }

}
fixBalance()

