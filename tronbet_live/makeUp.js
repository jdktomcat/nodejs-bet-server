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
        // {"addr": "TBzw5164Bi16TSrTFvLdxBPk3cJDCMcxEx", "amount": 213000, "adAmount": 600 * 1000000},
    ]
    for (let one of users) {
        let startTs = await getMaxEndTs(one.addr);
        let endTs = startTs + 1;
        let sql = `insert into live_airdrop_log(addr, startTs, endTs, betAmount, adAmount) values ('${one.addr}', ${startTs}, ${endTs}, ${one.amount}, ${one.adAmount});`;
        console.log(sql);
        await addData2AirDrop(sql);
    }
}


async function fix20200319() {
    const sql = 'delete from live_fix_log where log_id = 2'
    let res = await db.exec(sql, []);
    console.log(res)
}


async function main() {
    await fix20200319()
    console.log("fix1111 balance Done");
    process.exit(0);
}

main().catch(e=>{
    console.log(e)
    process.exit(1)
})

