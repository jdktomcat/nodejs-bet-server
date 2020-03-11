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


const fixBalance = async function () {
    const array = [
        {addr: "TRd8JeKkZjmNBB22y3H1puh9gYEx3krCj8", fix: 441.59 * 1e6},
    ]
    for (let e of array) {
        const updateSql = "update tron_live.live_balance set balance = balance + ? where addr = ? and currency = 'TRX' "
        const params = [e.fix, e.addr]
        console.log(updateSql,params)
        await db.exec(updateSql,params);
    }
}


async function main() {
    await fixBalance()
    console.log("fix1111 balance Done");
    //z
    const a123 = require("./resetBalance")
    await a123()
    process.exit(0);
}

main().catch(e=>{
    console.log(e)
    process.exit(1)
})

