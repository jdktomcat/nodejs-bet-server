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
        {addr: "TPUMuJZkokoXHxfXCjoerXnybBtg9LS8hT", fix: 683 * 1e6},
        {addr: "TQnckPMjwkP2uYNW26euwxgDhdzTBoWuPt", fix: 3839 * 1e6},
        {addr: "TN6rWvxATrd1XywjHceDYm2UxS7khegErV", fix: 1300 * 1e6},
        {addr: "TCVvvBLJLe53F3rz9vmHEvdpMvTCK4TmxS", fix: 170 * 1e6},
        {addr: "TDUofcLnJoLotdt7JKhjTgN5N4ZRHCD8m1", fix: 17760.03222 * 1e6},
        {addr: "TAKYEtb9xtxG5czmkvvsmvF8ui1Y4Sn8cD", fix: 14593.34716 * 1e6},
        {addr: "TUURWq51iQ9Yt5XrGpJgXk8rJUGm8Qn5YE", fix: 20032 * 1e6},
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
    console.log("fix balance Done");
    process.exit(0);
}

main();

