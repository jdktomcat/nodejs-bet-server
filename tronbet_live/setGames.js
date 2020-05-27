const db = require("./src/utils/dbUtil");

const dropTable = async function () {
	const sql = "DROP TABLE live_balance_audit";
	const rs = await db.exec(sql,[])
}

const createTable = async function () {
	const sql = `CREATE TABLE live_balance_audit (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  addr varchar(64) NOT NULL,
  live_balance bigint(20) unsigned NOT NULL,
  calc_balance bigint(20) NOT NULL,
  flag varchar(32) NOT NULL DEFAULT 'normal', -- normal, malicious
  live_balance_1 bigint(20) unsigned DEFAULT 0,
  live_balance_2 bigint(20) unsigned DEFAULT 0,
  live_balance_3 bigint(20) unsigned DEFAULT 0,
  live_balance_4 bigint(20) unsigned DEFAULT 0,
  live_balance_5 bigint(20) unsigned DEFAULT 0,
  live_balance_6 bigint(20) unsigned DEFAULT 0,
  live_balance_7 bigint(20) unsigned DEFAULT 0,
  live_balance_8 bigint(20) unsigned DEFAULT 0,
  live_balance_9 bigint(20) unsigned DEFAULT 0,
  live_balance_10 bigint(20) unsigned DEFAULT 0,
  live_balance_11 bigint(20) unsigned DEFAULT 0,
  live_balance_12 bigint(20) unsigned DEFAULT 0,
  live_balance_13 bigint(20) unsigned DEFAULT 0,
  live_balance_14 bigint(20) unsigned DEFAULT 0,
  live_balance_15 bigint(20) unsigned DEFAULT 0,
  live_balance_16 bigint(20) unsigned DEFAULT 0,
  live_balance_17 bigint(20) unsigned DEFAULT 0,
  live_balance_18 bigint(20) unsigned DEFAULT 0,
  live_balance_19 bigint(20) unsigned DEFAULT 0,
  live_balance_20 bigint(20) unsigned DEFAULT 0,
  live_balance_21 bigint(20) unsigned DEFAULT 0,
  live_balance_22 bigint(20) unsigned DEFAULT 0,
  live_balance_23 bigint(20) unsigned DEFAULT 0,
  live_balance_24 bigint(20) unsigned DEFAULT 0,
  live_balance_25 bigint(20) unsigned DEFAULT 0,
  live_balance_26 bigint(20) unsigned DEFAULT 0,
  live_balance_27 bigint(20) unsigned DEFAULT 0,
  live_balance_28 bigint(20) unsigned DEFAULT 0,
  live_balance_29 bigint(20) unsigned DEFAULT 0,
  live_balance_30 bigint(20) unsigned DEFAULT 0,
  live_balance_31 bigint(20) unsigned DEFAULT 0,
  create_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modify_time timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY live_balance_audit_addr_index (addr) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8`
	const rs = await db.exec(sql,[])
}

const main = async function(){
    await dropTable()
    await createTable()
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
