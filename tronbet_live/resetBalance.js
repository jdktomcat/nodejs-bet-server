const db = require("./src/utils/dbUtil");

const formatData = (data) => {
    data.forEach(e => {
        if (['TRX', 'USDT'].includes(e.currency)) {
            e.balance = e.balance / 1e6
        } else {
            e.balance = e.balance / 1e9
        }
    })
}

const queryBalance = async function (array) {
    const sql = `
    select 
        a.uid,
        a.currency,
        a.addr,
        a.balance
        from tron_live.live_balance as a 
    where a.uid = ? and a.currency = ? and a.addr = ? `
    const a1 = array.length
    let a2 = 0
    for (let e of array) {
        const p = [e.uid, e.currency, e.addr]
        const a = await db.exec(sql, p)
        if (a.length > 0) {
            a2 += 1
        }
        formatData(a)
        console.log(sql, JSON.stringify(p), ' and result is', a)
    }
    return a2 === a1
}


const updateAddBalance = async function (array) {
    for (let e of array) {
        const updateSql = "update tron_live.live_balance set balance = 0 where addr = ? and uid = ? and currency = ? "
        const params = [e.addr, e.uid, e.currency]
        console.log(updateSql, params)
        await db.exec(updateSql, params);
    }
}

const fixBalance = async function () {
    const array = [
        {
            uid: '51726',
            addr: "TVYUzg14rJ39Vykix46kmc4qt7zVamFkhv",
            currency: "TRX"
        },
        {
            uid: '50780',
            addr: "TTpAahQQ3hipS3rrNW8jBffEVnyYXBtUJo",
            currency: "TRX"
        },
    ]
    const ifUpdate = await queryBalance(array)
    //
    console.log("\nifUpdate: ", ifUpdate)
    // if (true) {
    if (ifUpdate) {
        console.log("begin ____> update")
        await updateAddBalance(array)
        //
        console.log("------>after is")
        await queryBalance(array)
    } else {
        console.log("please check your params")
    }
}


async function main() {
    await fixBalance()
    console.log("fix2 balance Done");
    process.exit(0);
}

// main().catch(e => {
//     console.log(e)
//     process.exit(1)
// });
module.exports = main