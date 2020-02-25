const db = require("./src/utils/dbUtil");
const _ = require("lodash");

async function getMaxEndTs(addr) {
    let sql =
        "select max(endTs) endTs from tron_live.live_airdrop_log where addr = ?";
    let res = await db.exec(sql, [addr]);
    if (_.isEmpty(res)) return 0;
    return res[0].endTs || 0;
}

async function addData2AirDrop(sql) {
    let res = await db.exec(sql, []);
}

async function makeUpLiveToken() {
    // update 20200220
    let users = [
        {"addr": "TAqqSP1FK9yXJjnD4kMjXxKMN6PAfYktu4", "amount": 137826.491, "adAmount": 368.52 * 1000000},
        {"addr": "TDadzsjnk6VQeHeKLCanqHPoZ5qdp1kioV", "amount": 743683.34, "adAmount": 1988.45813 * 1000000},
        {"addr": "TBzw5164Bi16TSrTFvLdxBPk3cJDCMcxEx", "amount": 29920, "adAmount": 80 * 1000000},
    ]
    for (let one of users) {
        let startTs = await getMaxEndTs(one.addr);
        let endTs = startTs + 1;
        let sql = `insert into live_airdrop_log(addr, startTs, endTs, betAmount, adAmount) values ('${one.addr}', ${startTs}, ${endTs}, ${one.amount}, ${one.adAmount});`;
        console.log(sql);
        await addData2AirDrop(sql);
    }
}
//
// async function main() {
//     await makeUpLiveToken()
//     console.log("makeup Done");
//     process.exit(0);
// }
//
// main();


async function alterTable() {
    const sql = "ALTER TABLE tron_live.live_online_game ADD is_new VARCHAR (1) DEFAULT '0' "
    let res = await db.exec(sql, []);
    console.log(sql)
    console.log("res is ",res)
    //
    const sql2 = `CREATE TABLE tron_bet_admin.sum_addr_detail (
        id int(11) NOT NULL AUTO_INCREMENT,
        day varchar(20) DEFAULT NULL,
        addr varchar(255) DEFAULT NULL,
        ts bigint(20) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY sum_dice_data_index1 (day)
    )`
    let res2 = await db.exec(sql2, []);
    console.log(sql2)
    console.log("res is ",res2)
}

alterTable().then(e=>{
    process.exit(0);
})
