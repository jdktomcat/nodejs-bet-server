const db = require("./src/utils/dbUtil");
// TX57b1dn4orgiAERk2xHYn5LMF9r78wDYE                        8700 TRX
// TXATntw1udujrh58yJH1LwoJCosoKs5bpJ                           14000 TRX
// TRYPmyHKycRvmJp5jPgGuLPDP3CjiS3Nsz                        12156 TRX
// TBasnkGWV1ka1TxdQ5o9UEmKU1WMCa9MDC             122 TRX
// TXzKiGvNBNXw71WQijmdzwCyEABGfQAfX8                      504 TRX
const balanceDict = {
    'TX57b1dn4orgiAERk2xHYn5LMF9r78wDYE': 8700,
    'TXATntw1udujrh58yJH1LwoJCosoKs5bpJ': 14000,
    'TRYPmyHKycRvmJp5jPgGuLPDP3CjiS3Nsz': 12156,
    'TBasnkGWV1ka1TxdQ5o9UEmKU1WMCa9MDC': 122,
    'TXzKiGvNBNXw71WQijmdzwCyEABGfQAfX8': 504,
}

const query_balance = async function (addr) {
    const sql = "select * from tron_live.live_balance where addr = ? and currency = 'TRX'"
    const params = [addr]
    console.log(sql, params)
    const a = await db.exec(sql, params)
    console.log("balance info is ", a)
    //
}

const update_balance = async function (addr) {
    const balance = balanceDict[addr] || ''
    if (balance === '') {
        throw new Error("error " + addr)
    }
    const update_balance_sql = "update tron_live.live_balance set balance = balance + ? where addr = ? and currency = 'TRX'"
    const params = [balance * 1e6, addr]
    console.log(update_balance_sql, params)
    await db.exec(update_balance_sql, params)
    //
}


const main = async function () {
    const ticketId = [
        '1875329104476246017',
        '1875450408848199683',
        '1875522850283200514',
        '1875373007531286529',
        '1875009360946663425'
    ]
    const sql = `
    select * from sports_transaction_log where betslipId in
    (
        '1875329104476246017',
        '1875450408848199683',
        '1875522850283200514',
        '1875373007531286529',
        '1875009360946663425'
    )
    `
    let data = await db.exec(sql, []);
    if (data.length === 0) {
        console.log("normal")
        //
        for (let e of data) {
            //
            const betslipId = e.betslipId
            const addr = e.addr
            //
            if (ticketId.includes(betslipId)) {
                //
                await query_balance(addr)
                //
                //update 流水
                const win = Number(balanceDict[addr]) * 1e6
                const sql1 = `update sports_transaction_log set status = 50, win = ? where addr = ? and betslipId = ?`
                console.log(sql1, [win, addr, betslipId])
                await db.exec(sql1, [win, addr, betslipId])
                //
                await update_balance(addr)
                //再查一次
                await query_balance(addr)
                console.log("\n")
            }
        }
    } else {
        console.log("error")
    }
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})

