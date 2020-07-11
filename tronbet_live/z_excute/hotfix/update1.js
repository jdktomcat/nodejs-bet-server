const db = require("../../src/utils/dbUtil");

const rawQuery = async function (sql, params) {
    console.log(sql, params)
    const res = await db.exec(sql, params)
    console.log("affectedRows is : " + res.affectedRows + "\n")
    return res
}

const sql1 = `CREATE TABLE tron_bet_event.mine_reward_list (
    log_id bigint(20) NOT NULL AUTO_INCREMENT,
    addr varchar(64) DEFAULT NULL,
    amount varchar(64) DEFAULT NULL,
    tx_id varchar(64) DEFAULT NULL,
    PRIMARY KEY (log_id),
    KEY mine_reward_list_addr_idx (addr)
);`

const test1 = async function(){
    await rawQuery(sql1,[])
}

test1().then(()=>{
    console.log("done!")
    process.exit(0)
}).catch(e=>{
    console.log("error is " + e.toString())
    process.exit(1)
})

module.exports = test1