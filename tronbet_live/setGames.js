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
    return  t
}

const test333 = async function () {
    const querySql = `
CREATE TABLE tron_live.binary_transaction_log (
    log_id bigint(20) NOT NULL AUTO_INCREMENT,
    transaction_id varchar(64) DEFAULT NULL,
    addr varchar(64) DEFAULT NULL,
    asset varchar(20) DEFAULT NULL,
    kind varchar(20) DEFAULT NULL,
    amount bigint(20),
    win  bigint(20) DEFAULT 0,
    adAmount  bigint(20) DEFAULT 0,
    currency varchar(20) DEFAULT NULL,
    status varchar(20) DEFAULT NULL,
    quote_open float DEFAULT 0,
    quote_close float DEFAULT 0,
    created_at  bigint(20) DEFAULT NULL,
    profitability  float DEFAULT 0,
    expiration_date  bigint(20) DEFAULT NULL,
    expiration_type  varchar(20) DEFAULT NULL,
  PRIMARY KEY (log_id),
  KEY binary_integration_addr_index (addr),
  KEY binary_integration_transaction_index (transaction_id),
  KEY binary_integration_status_index (status),
  KEY binary_integration_created_at_index (created_at),
  KEY binary_integration_expiration_date_index (expiration_date)
)
    `
    // const value = 0.0144 * 1e9
    const t2 = await raw(querySql,[])
    console.log(t2)
}



const updateGames = async function () {
    const redisUtil = require("./src/utils/redisUtil");
    const {parseGames} = require("./src/service/games")
    const a = await parseGames()
    await redisUtil.hset("tronlive:gamelist", "games", JSON.stringify(a));
    console.log("last is ,",a)


}

const main = async function(){
    await test333()
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
