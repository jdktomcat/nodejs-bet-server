const db = require("./src/utils/dbUtil");

const raw = async function (sql,params) {
    console.log(sql)
    console.log(params)
    return await db.exec(sql,params)
}

const update_balance = async function () {
	const sql1 = `select uid,currency,addr,balance / 1000000 from tron_live.live_balance where currency = 'TRX' and addr = 'TTee3vKWqtZaafkuTEtwFd2QHwcyGkNEnj' `
	const rs1 = await raw(sql1,[])
    console.log("before is ",rs1)
    //
    const sql3 = `update tron_live.live_balance set balance = balance - ? where currency = 'TRX' and addr = 'TTee3vKWqtZaafkuTEtwFd2QHwcyGkNEnj' `
    const num = 1000000 * 1e6
    const rs3 = await raw(sql3,[num])
    console.log("update affectedRows is ",rs3.affectedRows)

    //
    const rs2 = await raw(sql1,[])
    console.log("after is ",rs2)
}

const main = async function(){
    await update_balance()
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
