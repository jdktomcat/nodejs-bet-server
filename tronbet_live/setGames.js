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
        {uid:'48117',addr: "bnb1vheud6fefdfhds3u5qwh6dvt8rdkw0ktxafrr2", fix: 0.10912 * 1e9, currency: "BNB"},
        {uid:'48367',addr: "0x94a90b5d2933389cb674a00dc06ae53d3bdfac84", fix: 13.9 / 1000 * 1e9, currency: "ETH"},
        {uid:'49432',addr: "0xc8316d3df9bd250ef57fe3cdf434850481796b9e", fix: 13.9 / 1000 * 1e9, currency: "ETH"},
        {uid:'49272',addr: "0xebe3ee5ea1e931ee966e626b7bbe26cb3a6f103e", fix: 10 / 1000 * 1e9, currency: "ETH"},
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