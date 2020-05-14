const db = require("./src/utils/dbUtil");

const raw = async function (updateSql, params) {
    console.log(updateSql, params)
    const t = await db.exec(updateSql, params);
    return t
}

const updateFix = async function () {
    // const addrs = [
    // ]
    // for(let e of addrs){
    //     const querySql = `select uid,currency,addr,balance / 1000000 as balance from tron_live.live_balance where addr = ? and currency = 'TRX'`
    //     const data = await raw(querySql,[e])
    //     console.log(data)
    //     const updateSql = "update tron_live.live_balance set balance = 0 where addr = ? and currency = 'TRX'"
    //     await raw(updateSql,[e])
    //     console.log("--------\n\n")
    // }
}

const main = async function () {
    await updateFix()

}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
