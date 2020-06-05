const db = require("../src/utils/dbUtil");

const rawQuery = async function (sql, params) {
    console.log(sql, params)
    const res = await db.exec(sql, params)
    console.log("res is : " + JSON.stringify(res) + "\n")
    return res
}

const query_balance = async function (addr) {
    const sql = "select * from tron_live.live_balance where addr = ? and currency = 'TRX'"
    await rawQuery(sql, [addr])
}

const update_balance = async function (addr, amount) {
    const sql = "update tron_live.live_balance set balance = balance + ? where addr = ? and currency = 'TRX'"
    await rawQuery(sql, [amount, addr])
}

const query_sport_tmp = async function () {
    const sql = `
    select * from sports_transaction_log where betslipId in
    (
        '1875353212685520897',
        '1875450408848199682'
    )
    `
    const a = await rawQuery(sql, [])
    return a
}

const update_sport_id = async function () {
    const sql = `
    update sports_transaction_log set status = 50 where betslipId in
    (
        '1875353212685520897',
        '1875450408848199682'
    )
    `
    const a = await rawQuery(sql, [])
    return a
}

const test1 = async function () {
    const a = await query_sport_tmp()
    if(a.length === 2){
        await update_sport_id()
    }
}


const main = (async function () {
    //
    console.log("just a test")
    await test1()


    //
})().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})

// export
module.exports = main