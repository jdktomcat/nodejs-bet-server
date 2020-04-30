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

const updateGames1 = async function () {
    const sql1 = `CREATE TABLE tron_live.back_live_profit_log (
        days int(11) NOT NULL,
        profit bigint(20) NOT NULL,
        PRIMARY KEY (days)
) ENGINE=InnoDB DEFAULT CHARSET=utf8`
    const a1 = await raw(sql1, [])
    console.log("\nlast====>\n", a1)
}

const updateGames2 = async function () {
    const sql1 =`
        CREATE TABLE tron_live.back_live_div_info (
        round  int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
        total_token  bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计已冻结trx数(单位sun)',
        total_trx  bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红TRX(单位sun)',
        mark_ts  bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '统计分红数据时间戳',
        send_ts  bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
        div_state  tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
        rank_trx  bigint(20) unsigned NOT NULL DEFAULT '0',
        PRIMARY KEY (round)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='live token分红总揽'
`
    const a1 = await raw(sql1, [])
    console.log("\nlast====>\n", a1)
}


const updateGames3 = async function () {
    const sql1 = `insert into tron_live.back_live_div_info select * from tron_live.live_div_info`
    const sql2 = `insert into tron_live.back_live_profit_log select * from tron_live.live_profit_log`
    const a1 = await raw(sql1, [])
    const a2 = await raw(sql2, [])
    console.log(a1)
    console.log(a2)
}

const main = async function () {
    await updateGames1()
    await updateGames2()
    await updateGames3()
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
