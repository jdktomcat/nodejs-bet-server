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

const updateTable = async function () {
    const sql1 = `CREATE TABLE tron_live.platipus_transaction_log (
  log_id bigint(20) NOT NULL AUTO_INCREMENT,
  transaction_id varchar(64) DEFAULT NULL,
  round_id varchar(64) DEFAULT NULL,
  game_id varchar(64) DEFAULT NULL,
  game_name varchar(64) DEFAULT NULL,
  type varchar(64) DEFAULT NULL,
  addr varchar(64) DEFAULT NULL,
  uid varchar(64) DEFAULT NULL,
  amount bigint(20) DEFAULT NULL,
  currency varchar(64) DEFAULT NULL,
  adAmount float DEFAULT '0',
  ts bigint(20) DEFAULT NULL,
  status smallint(5) unsigned DEFAULT '1',
  PRIMARY KEY (log_id),
  UNIQUE KEY TransactionId_unikey (transaction_id),
  KEY platipus_transaction_log_addr_idx (addr),
  KEY platipus_transaction_log_ts_index (ts)
)`
    await db.exec(sql1, []);
    //
}


const test = async function () {
    await updateTable()
}
test().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
