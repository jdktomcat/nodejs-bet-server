const db = require("./src/utils/dbUtil");
const queryBalance = async function (params) {
    const querySql = "select * from tron_live.live_balance where addr = ? and currency = 'TRX' "
    const a = await db.exec(querySql,[params.addr]);
    console.log(querySql)
    console.log([params.addr])
    console.log(JSON.stringify(a))
}


const updateBalance = async function (params) {
    await queryBalance(params)
    const updateSql = "update tron_live.live_balance set balance = balance + ? where addr = ? and currency = 'TRX' "
    const a = await db.exec(updateSql,[params.fix,params.addr]);
    console.log(updateSql)
    console.log([params.fix,params.addr])
}

const resetBalance = async function (params) {
    await queryBalance(params)
    const resetSql = "update tron_live.live_balance set balance = 0 where addr = ? and currency = 'TRX' "
    const a = await db.exec(resetSql,[params.addr]);
    console.log(resetSql)
    console.log([params.addr])
}


const fixBalance = async function () {
    const array = [
        {addr: "TGYAK2KT8xP9kmDbPTAnfT3e1RGzYLnRAT", fix: 18800 * 1e6},
        {addr: "TRd8JeKkZjmNBB22y3H1puh9gYEx3krCj8", fix: 29413.41 * 1e6},
        {addr: "TTc6NCKE5kHg2KzxB3XqLsKhcUh5Uafg4v", fix: 0},
        {addr: "TLLJfLK1VdjieYj9xEmZZjV24pVN3WKQ5q", fix: 0},
    ]
    for (let e of array) {
        if(e.fix === 0){
            await resetBalance(e)
        }else if(e.fix > 0){
            await updateBalance(e)
        }
        console.log("------------>\n")
    }
}


module.exports = fixBalance