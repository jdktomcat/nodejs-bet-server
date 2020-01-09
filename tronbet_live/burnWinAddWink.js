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
  obj1.amount = 1374436821600;
  obj1.ts = 1577435502000;
  obj1.tx = "f864242eaeea953343def98f9e4dd415977270c9a30d9534d90ee736d9029ee7";
  info.push(obj1);

  let obj2 = {};
  obj2.type = 2;
  obj2.addr = "THtbMw6byXuiFhsRv1o1BQRtzvube9X1jx";
  obj2.amount = 52629319184200;
  obj2.ts = 1577419311000;
  obj2.tx = "b90070ab768499de75c48b83ddb42c478efaacb638e0ad85352d087d21613928";
  info.push(obj2);

  let obj3 = {};
  obj3.type = 1;
  obj3.addr = "TEA1MCjwRhwKp3NvDis7vcpByt7kMYqRRn";
  obj3.amount = 106023831440000;
  obj3.ts = 1577440476000;
  obj3.tx = "ffbba1c2eb0f8225e0b3867b8e81a62f92b7e1a4d62042fb222362c0c229331c";
  info.push(obj3);

  for (let item of info) {
    await insertDB(item);
  }

  process.exit(0);
}

// main();
