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
    //     {"addr": "TAqqSP1FK9yXJjnD4kMjXxKMN6PAfYktu4", "amount": 137826.491, "adAmount": 368.52 * 1000000},
    //     {"addr": "TDadzsjnk6VQeHeKLCanqHPoZ5qdp1kioV", "amount": 743683.34, "adAmount": 1988.45813 * 1000000},
    //     {"addr": "TBzw5164Bi16TSrTFvLdxBPk3cJDCMcxEx", "amount": 29920, "adAmount": 80 * 1000000},
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





async function addDirtyData1() {
    let sql1 = "select * from tron_bet_admin.sum_addr_detail";
    const data1 = await db.exec(sql1, []);
    let k = {}
    let nData = []
    data1.forEach(e=>{
        const addr = e.addr || ''
        if(k[addr] === undefined){
            k[addr] = 1
            nData.push(e)
        }
    })
    for (let ele of nData){
        const sql3 = `insert into tron_bet_admin.sum_addr_detail(day,addr,ts) values (?,?,?)`
        const params3 = [ele.day,ele.addr,ele.ts]
        await db.exec(sql3, params3);
    }
}



async function addDirtyData2() {
    let sql1 = "select * from tron_bet_admin.sum_dice_data where type = 'all'";
    const data1 = await db.exec(sql1, []);
    let k = {}
    let nData = []
    data1.forEach(e=>{
        const day_str = e.day_str || ''
        if(k[day_str] === undefined){
            k[day_str] = 1
            nData.push(e)
        }
    })
    for (let ele of nData){
        const sql3 = `insert into tron_bet_admin.sum_dice_data(type,day_str,data_str,ts) values ('dailydata',?,?,?)`
        const params3 = ['all',ele.day_str,ele.data_str, ele.ts]
        await db.exec(sql3, params3);
    }
}


async function main() {
    await addDirtyData1()
    await addDirtyData2()
    console.log("remove data Done");
    process.exit(0);
}

main();
