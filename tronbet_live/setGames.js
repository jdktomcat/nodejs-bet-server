const db = require("./src/utils/dbUtil");

async function fixprofit() {
    let sql = "select * from live_profit_log where days > 18330"
    let res = await db.exec(sql, []);
    console.log(sql)
    //
    let sql3 = "delete from live_profit_log where days > 18330"
    let res1 = await db.exec(sql3, []);
    //
    console.log(sql3)
}

async function fixUSDT() {
    let sql = "SELECT * FROM live_trc20_profit_log WHERE currency = 'USDT' AND days > 18330"
    let res = await db.exec(sql, []);
    console.log(sql)
    //
    let sql3 = "delete FROM live_trc20_profit_log WHERE currency = 'USDT' AND days > 18330"
    let res1 = await db.exec(sql3, []);
    //
    console.log(sql3)
}

const main = async function(){
    await fixprofit()
    console.log("============>")
    await fixUSDT()
    process.exit(0)
}

main().catch(e=>{
    console.log(e)
    process.exit(1)
})
