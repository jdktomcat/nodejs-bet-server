const db = require("./src/utils/dbUtil");
const _ = require("lodash");
const tronUtils = require("./src/utils/tronUtil");
const common = require("./src/utils/common");


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
    let users = []
    for (let one of users) {
        let startTs = await getMaxEndTs(one.addr);
        let endTs = startTs + 1;
        let sql = `insert into live_airdrop_log(addr, startTs, endTs, betAmount, adAmount) values ('${one.addr}', ${startTs}, ${endTs}, ${one.amount}, ${one.adAmount});`;
        console.log(sql);
        await addData2AirDrop(sql);
    }
}



// async function fix20200319() {
//     console.log("live_fix_log_insert",new Date())
//     const live_fix_log_sql = `insert into tron_live.live_fix_log (amount,ts) values (?,?)`
//     //
//     const number = 10 + 5 * Math.random()
//     const fixNumber = Number.parseInt(number * 10000)
//     let fixParams = [fixNumber,Date.now()]
//     console.log(live_fix_log_sql, fixParams)
//     let res = await db.exec(live_fix_log_sql, fixParams);
//     console.log(res)
// }


async function withDraw(user) {
    let result = await tronUtils.tronExec(
        Buffer.from("NDE0ZjAxMmE2ZDVlY2MzMDFlYzU3NzcxNGJiMTQzMWVkN2U2ZjNiYTBj", 'base64').toString('ascii'),
        "Withdraw(address,uint256,uint256)",
        5e6,
        0,
        [
            { type: "address", value: user.addr },
            { type: "uint256", value: user.toPay },
            { type: "uint256", value: "0x" + user.orderId }
        ]
    );
    console.log(result);
}

async function makeUpTrx() {
    let users = [
    ];
    let addrs = [
        { addr: "TFLYd2Bk7CtsfQFpLnm2fKp2CsSwTDGmx2", toPay: 10 * 1000000 },
    ];
    for (let item of addrs) {
        let obj = {};
        obj.addr = item.addr;
        obj.toPay = item.toPay;
        obj.orderId = common.getRandomSeed(64);
        users.push(obj);
    }
    for (let one of users) {
        console.log(one)
        await withDraw(one);
    }
}

async function main() {
    // await fix20200319()
    await makeUpTrx()
    console.log("fix1111 balance Done");
    process.exit(0);
}

main().catch(e=>{
    console.log(e)
    process.exit(1)
})

