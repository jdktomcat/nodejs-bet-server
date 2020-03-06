const db = require("./src/utils/dbUtil");

const queryBalance = async function (array) {
    const sql = `select * from live_balance where uid = ? and currency = ?`
    for (let e of array) {
        const p = [e.uid,e.currency]
        const a = await db.exec(sql, p)
        console.log(sql, p, ' and result is', a)
    }
}


const updateAddBalance = async function (array) {
    for (let e of array) {
        const updateSql = "update tron_live.live_balance set balance = balance + ? where uid = ? and currency = ? "
        const params = [e.fix, e.uid, e.currency]
        console.log(updateSql, params)
        await db.exec(updateSql, params);
    }
}


const fixBalance = async function () {
    const array = [
        {uid:'50957',addr: "LRPTZ7aWqZJpeaTnvcUUQKhnhotfL5wyBN", fix: 1.21 * 1e9, currency: "LTC", email:"cokekatum@gmail.com"},
        {uid:'42869',addr: "bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23", fix: 16.825 * 1e9, currency: "BNB", email:"gfbrown1411@gmail.com"},
        {uid:'46585',addr: "bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23", fix: 1.377965 * 1e9, currency: "BNB", email:"duonglonganh@gmail.com"},
    ]
    await queryBalance(array)
    //
    console.log("begin ____> update")
    await updateAddBalance(array)
    //
    console.log("------>after is")
    await queryBalance(array)
}


async function main() {
    await fixBalance()
    console.log("fix balance Done");
    process.exit(0);
}

main().catch(e => {
    console.log(e)
    process.exit(1)
});