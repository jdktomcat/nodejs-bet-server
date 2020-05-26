const db = require("./src/utils/dbUtil");

const update2020526 = async function () {
    const addr = [
            'TSDNKq7X9E3DJP9jFyPwoVUPA63bK83pdK'
        ]
    for(let e of addr){
        const sql1 = `select uid,currency,addr,balance / 1000000 as balance  from tron_live.live_balance where addr = ? and currency = 'TRX'`
        const a1 = await db.exec(sql1,[e])
        console.log("before is ",a1)
        const updateSql = `update tron_live.live_balance set balance = 0 where addr = ? and currency = 'TRX' `
        await db.exec(updateSql,[e])
    }
    console.log("\n\n===>\n")
    for(let e of addr){
        const sql1 = `select  uid,currency,addr,balance / 1000000 as balance   from tron_live.live_balance where addr = ? and currency = 'TRX'`
        const a1 = await db.exec(sql1,[e])
        console.log("after is ",a1)
    }

}

const main = async function(){
    await update2020526()
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
