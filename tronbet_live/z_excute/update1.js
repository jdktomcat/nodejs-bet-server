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

// TDadzsjnk6VQeHeKLCanqHPoZ5qdp1kioV    3780 TRX
// TAMYYbmqMBMmPcRCpj7Fx9dxJ4FZ8XekBo  11620 TRX
// TXATntw1udujrh58yJH1LwoJCosoKs5bpJ    4155 TRX
const test1 = async function () {
    const amountDict = {
        'TDadzsjnk6VQeHeKLCanqHPoZ5qdp1kioV': 3780,
        'TXATntw1udujrh58yJH1LwoJCosoKs5bpJ': 4155,
    }
    //fake data
    // const data = [
    //     {betslipId: "1875353212685520897", status: "0", addr: "TDadzsjnk6VQeHeKLCanqHPoZ5qdp1kioV"},
    //     {betslipId: "1875450408848199682", status: "0", addr: "TXATntw1udujrh58yJH1LwoJCosoKs5bpJ"},
    // ]
    const data = await query_sport_tmp()
    for (let e of data) {
        const addr = e.addr
        const status = Number(e.status)
        const win = Number(amountDict[addr]) * 1e6
        // 只有0的状态
        if (status !== 0) {
            throw new Error("status error : " + JSON.stringify(e))
        }
        if (amountDict[addr] === undefined) {
            throw new Error("status error : " + JSON.stringify(e))
        }
        //1
        await query_balance(addr)
        //2
        await update_balance(addr, win)
        //3
        await query_balance(addr)
        //
        console.log("===========分割线===========\n")
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