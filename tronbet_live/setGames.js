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
  obj1.amount = 43060975336900;
  obj1.ts = 1589783955000;
  obj1.tx = "37b9af6fa090c6258a77fe162b3e0aec5b0315fcfe259b320f1138c0f9404f81";
  info.push(obj1);

  let obj3 = {};
  //回购燃烧
  obj3.type = 1;
  obj3.addr = "TW8UBosxaTYKAS22WywSVnyjjJr4iEvjNr";
  obj3.amount = 408516594925900;
  obj3.ts = 1589880267000;
  obj3.tx = "f98f26201eef86c9aad885e4d4e6b9aba5ba814e5df020eda1855e4546bc210a";
  info.push(obj3);

  for (let item of info) {
    await insertDB(item);
  }

  process.exit(0);
}

main();
