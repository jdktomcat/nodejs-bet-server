const db = require("./src/utils/dbUtil");

async function insertDB(info) {
  let sql =
    "insert into tron_bet_admin.ante_burnt_log(types, call_addr, amount, ts, tx_id) values (?, ?, ?, ?, ?) ON DUPLICATE KEY update tx_id = ?";

  let res = await db.exec(sql, [
    info.type,
    info.addr,
    info.amount,
    info.ts,
    info.tx,
    info.tx
  ]);
  console.log("insertDB res", res);
}

async function main() {
  let info = [];
  let obj1 = {};
  //奖池燃烧
  obj1.type = 2;
  obj1.addr = "THtbMw6byXuiFhsRv1o1BQRtzvube9X1jx";
  obj1.amount = 45648927218100;
  obj1.ts = 1586512608000;
  obj1.tx = "3402628bb5cabb373a2b93388afc6ba78c05dfa586be41b0f623cd7906b299f6";
  info.push(obj1);

  let obj3 = {};
  //回购燃烧
  obj3.type = 1;
  obj3.addr = "THNpF5h4isLgXe7rtw6833nSgTqhfuVJLN";
  obj3.amount = 376007484281000;
  obj3.ts = 1586846238000;
  obj3.tx = "6894c11fd6c6424a04991f06565941028f68b1a5fd3a971a17987867e96967fe";
  info.push(obj3);

  for (let item of info) {
    await insertDB(item);
  }

  process.exit(0);
}

// main();
