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

async function withDraw(user) {
  let result = await tronUtils.tronExec(
    "414f012a6d5ecc301ec577714bb1431ed7e6f3ba0c",
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
    //    {addr : 'TQRMbC9WRmqatjeZShNBznsBUj1Ypo2Ndc', orderId : '7fa82bb5c13a77ab976ac5eec02a94587ec7f39accc63b18ddcb405515ed2b9e', toPay :     1},
  ];
  let addrs = [
    // { addr: "TXoFurxNd8bAcsKsTZBefNZf46WMcghzCS", toPay: 713 * 1000000 },
    // { addr: "TNHKWxV78wVz6JKZ7AGFz3uxYmjXuNqZxZ", toPay: 803 * 1000000 },
    // { addr: "TZBhbN9VagMQzTWkVxiMUeCCpcAMrHP2Ub", toPay: 5000 * 1000000 }
    // { addr: "TV3Tunez5eP76LxpiTiCCA9PM4SKar6xQq", toPay: 300879.2 * 1000000 }
  ];
  for (let item of addrs) {
    let obj = {};
    obj.addr = item.addr;
    obj.toPay = item.toPay;
    obj.orderId = common.getRandomSeed(64);
    users.push(obj);
  }
  for (let one of users) {
    await withDraw(one);
  }
}

async function makeUpLiveToken() {
  let users = [
    { addr: "TQRMbC9WRmqatjeZShNBznsBUj1Ypo2Ndc", amount: 1, adAmount: 100 }
  ];
  for (let one of users) {
    let startTs = await getMaxEndTs(one.addr);
    let endTs = startTs + 1;
    let sql = `insert into live_airdrop_log(addr, startTs, endTs, betAmount, adAmount) values ('${one.addr}', ${startTs}, ${endTs}, ${one.amount}, ${one.adAmount});`;
    console.log(sql);
    await addData2AirDrop(sql);
  }
}

async function main() {
  // await makeUpTrx();
  // await makeUpLiveToken()
  console.log("makeup Done");
  process.exit(0);
}

main();
