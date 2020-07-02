const db = require("../../src/utils/dbUtil");

const rawQuery = async function (sql, params) {
    console.log(sql, params)
    const res = await db.exec(sql, params)
    console.log("affectedRows is : " + res.affectedRows + "\n")
    return res
}

const sql1 = `CREATE TABLE tron_bet_event.mine_box (
    log_id bigint(20) NOT NULL AUTO_INCREMENT,
    addr varchar(64) DEFAULT NULL,
    amount varchar(64) DEFAULT NULL,
    currency varchar(64) DEFAULT NULL,
    type varchar(64) DEFAULT NULL,
    boxNum varchar(64) DEFAULT NULL,
    ts bigint(20) DEFAULT NULL,
    PRIMARY KEY (log_id),
    KEY mine_box_addr_idx (addr)
);`

const sql2 = `CREATE TABLE tron_bet_event.mine_box_count (
    log_id bigint(20) NOT NULL AUTO_INCREMENT,
    addr varchar(64) DEFAULT NULL,
    type varchar(64) DEFAULT NULL,
    boxNum bigint(20) unsigned DEFAULT 0,
    PRIMARY KEY (log_id),
    KEY mine_box_count_addr_idx (addr)
);`

const sql3 = `CREATE TABLE tron_bet_event.mine_send_log (
    log_id bigint(20) NOT NULL AUTO_INCREMENT,
    addr varchar(64) DEFAULT NULL,
    amount varchar(64) DEFAULT NULL,
    currency varchar(64) DEFAULT NULL,
    tx_id varchar(64) DEFAULT NULL,
    ts bigint(20) DEFAULT NULL,
    PRIMARY KEY (log_id),
    KEY mine_send_log_addr_idx (addr)
);`


const sql4 = `CREATE TABLE tron_bet_event.mine_letter (
    log_id bigint(20) NOT NULL AUTO_INCREMENT,
    addr varchar(64) DEFAULT NULL,
    letter_D bigint(20) unsigned DEFAULT 0,
    letter_I bigint(20) unsigned DEFAULT 0,
    letter_C bigint(20) unsigned DEFAULT 0,
    letter_E bigint(20) unsigned DEFAULT 0,
    letter_W bigint(20) unsigned DEFAULT 0,
    letter_N bigint(20) unsigned DEFAULT 0,
    letter_T bigint(20) unsigned DEFAULT 0,
    letter_R bigint(20) unsigned DEFAULT 0,
    letter_X bigint(20) unsigned DEFAULT 0,
    letter_K bigint(20) unsigned DEFAULT 0,
    PRIMARY KEY (log_id),
    KEY mine_letter_addr_idx (addr)
);`


const test1 = async function(){
    await rawQuery(sql1,[])
    await rawQuery(sql2,[])
    await rawQuery(sql3,[])
    await rawQuery(sql4,[])
}

test1().then(()=>{
    console.log("done!")
    process.exit(0)
}).catch(e=>{
    console.log("error is " + e.toString())
    process.exit(1)
})

module.exports = test1