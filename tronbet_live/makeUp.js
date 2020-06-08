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
    // TQuSYAXY8xr6xcEKNxCnTPsx5VW6f89mWn    0
    // TSgL2AbnG1TVUabQFgFPZQy2jKUzJAysZb       1177.7954
    // TEU1LitnnG1gfxsQGW262wEF7ecaAF8cYi         1.0833
    // TBxMsTDJxYnt27zNTeUAtJcAZCmV7dgq1x       101.8958
    // TVegedWTbKYk4GGZVcEpmG3Js62CZFk8tE      0
    // TBEAM7GPc8oouWeUjPkhY8ein9pw7mQjAb    21.6908
    // THZc1k8eL8CRSXzykXZ8fjQocX1vZaQoxz            158.9422
    // TXE39AXK1czhuDSsHoe4w6dfSiyAvNViGf            0
    // TAVExusD5UqP2cRiQ8NbKmTK42LXPmWqiX     0
    // TP1yemoGpWhXg56XbueU9AQiNwTMTYRjpD   10.7594
    // TCjAUcVqNPBUsVgsmwYnGJUx4qksvdeSFy        143.2031
    // TEjrbhv5MCobGKDsbddaHArbc1gode67DH       0.7854
    // TEXAJi4N2Gho9xjkaoSxwma281dimnFkoH           1.2436
    // TQgoxGxxuzCCyN33WCqHqzhAdaESZKKHNP      0
    // TYWARzmK8UmMHjyZowd9J3eUCd1sPXWSpQ    4.2969
    // TFa8h1BALTZzNw9BwqkMY2ynjpPfs6i3E2             0

    // update 20200220
    let users = [
        {"addr": "TMtb6tEzPWFkd1ucT4LQabp3GK17tpK3TJ", "amount": 250658.8579, "adAmount": (250658.8579 / 392) * 1000000},
    ]
    users.forEach(e=>{
        e.adAmount = parseInt(e.adAmount)
    })
    console.log(JSON.stringify(users,null,2))
    for (let one of users) {
        let startTs = await getMaxEndTs(one.addr);
        let endTs = startTs + 1;
        let sql = `insert into live_airdrop_log(addr, startTs, endTs, betAmount, adAmount) values ('${one.addr}', ${startTs}, ${endTs}, ${one.amount}, ${one.adAmount});`;
        console.log(sql);
        await addData2AirDrop(sql);
    }
}


async function fix20200319() {
    console.log("live_fix_log_insert",new Date())
    const live_fix_log_sql = `insert into tron_live.live_fix_log (amount,ts) values (?,?)`
    //
    const number = 10 + 5 * Math.random()
    const fixNumber = Number.parseInt(number * 10000)
    let fixParams = [fixNumber,Date.now()]
    console.log(live_fix_log_sql, fixParams)
    let res = await db.exec(live_fix_log_sql, fixParams);
    console.log(res)
}


async function main() {
    await makeUpLiveToken()
    console.log("fix1111 balance Done");
    process.exit(0);
}

main().catch(e=>{
    console.log(e)
    process.exit(1)
})

