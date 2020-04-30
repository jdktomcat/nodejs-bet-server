const db = require("./src/utils/dbUtil");

const queryBalance = async function (array) {
    const sql = `select a.uid,a.currency,a.addr,a.balance / 1000000000 as balance,b.email from tron_live.live_balance as a left join tron_live.live_account b on a.uid = b.uid where a.uid = b.uid and a.uid = ? and a.currency = ? and a.addr = ? and b.email = ?`
    const a1 = array.length
    let a2 = 0
    for (let e of array) {
        const p = [e.uid, e.currency, e.addr, e.email]
        const a = await db.exec(sql, p)
        if (a.length > 0) {
            a2 += 1
        }
        console.log(sql, JSON.stringify(p), ' and result is', a)
    }
    return a2 === a1
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
    // const array = [
    //     {
    //         uid: '42869',
    //         addr: "bnb1vheud6fefdfhds3u5qwh6dvt8rdkw0ktxafrr2",
    //         email: 'gfbrown1411@gmail.com',
    //         fix: 16.02 * 1e9,
    //         currency: "BNB"
    //     },
    // ]
    // const ifUpdate = await queryBalance(array)
    // //
    // console.log("ifUpdate: ", ifUpdate)
    // if (ifUpdate) {
    //     console.log("begin ____> update")
    //     await updateAddBalance(array)
    //     //
    //     console.log("------>after is")
    //     await queryBalance(array)
    // } else {
    //     console.log("please check your params")
    // }
}


const raw = async function (updateSql, params) {
    console.log(updateSql, params)
    const t = await db.exec(updateSql, params);
    return t
}

const updateGames2 = async function () {
    const sql1 = `
        CREATE TABLE tron_live.back_live_fix_log (
        log_id bigint(20) NOT NULL AUTO_INCREMENT,
        amount bigint(20) DEFAULT NULL,
        ts bigint(20) DEFAULT NULL,
        PRIMARY KEY (log_id),
        KEY back_live_fix_log_ts_index (ts)
) ENGINE=InnoDB AUTO_INCREMENT=354 DEFAULT CHARSET=utf8
`
    const a1 = await raw(sql1, [])
    //
    const sql2 = `insert into tron_live.back_live_fix_log select * from tron_live.live_fix_log`
    const a2 = await raw(sql2, [])
    console.log("\nlast====>\n", a1)
    console.log("\nlast====>\n", a2)
}


const updateGames3 = async function () {
    const sql1 = `update tron_live.live_balance set balance = balance * 0.01 where addr = 'TUegyE57yFmju8WQoQDsn9gAef68Mh4bPs' and currency = 'TRX'`
    const a1 = await raw(sql1, [])
    console.log(a1)
}

const main = async function () {
    await updateGames2()
    // await updateGames3()
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
