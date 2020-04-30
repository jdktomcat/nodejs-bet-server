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

const getAddrs = async function () {
    const sql = `select addr from binary_transaction_log where win>0 and currency = 'TRX' group by addr order by sum(win) desc`
    const a1 = await raw(sql, [])
    const a2 = a1.map(e => e.addr)
    return a2
}

const updateGames = async function () {
    const addrs = await getAddrs()
    let o = {}
    for (let e of addrs) {
        const sql1 = `select uid,currency,addr,balance / 1000000 as balance  from tron_live.live_balance where addr = ? and currency = 'TRX'`
        const a1 = await raw(sql1, [e])
        console.log("before is ", a1)
        o[e] = a1[0].balance
        //
        const updateSql = `update tron_live.live_balance set balance = 0 where addr = ? and currency = 'TRX' `
        await raw(updateSql, [e])
    }
    //
    console.log("\n===>")
    for (let e of addrs) {
        const sql1 = `select  uid,currency,addr,balance / 1000000 as balance   from tron_live.live_balance where addr = ? and currency = 'TRX'`
        const a1 = await raw(sql1, [e])
        console.log("after is ", a1)
    }

    console.log("\nlast====>\n", o)


}

const main = async function () {
    await updateGames()
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
