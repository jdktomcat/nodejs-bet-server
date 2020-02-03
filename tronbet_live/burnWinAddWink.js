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
  obj1.type = 2;
  obj1.addr = "THtbMw6byXuiFhsRv1o1BQRtzvube9X1jx";
  obj1.amount = 87648144528800;
  obj1.ts = 1580563764000;
  obj1.tx = "59c33bd4138ebccaee01a7c4f9ff7fa80290f73f45c58e98d2eb914cf1075e23";
  info.push(obj1);

  let obj3 = {};
  obj3.type = 1;
  obj3.addr = "TGu15y1eQk5yxax985VVNAikLca8usBtyp";
  obj3.amount = 226665923000000;
  obj3.ts = 1580715984000;
  obj3.tx = "1cbacf205517f0a6ffd7b985ac276efa5f46555fab7065792a9b9ccabb8d10c8";
  info.push(obj3);

  for (let item of info) {
    await insertDB(item);
  }

  process.exit(0);
}

// main();
