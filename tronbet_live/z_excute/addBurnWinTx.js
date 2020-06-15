const db = require("../src/utils/dbUtil");

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

async function addBurnWinTx() {
  let info = [];
  let obj1 = {};
  //奖池燃烧
  obj1.type = 2;
  obj1.addr = "THtbMw6byXuiFhsRv1o1BQRtzvube9X1jx";
  obj1.amount = 54496991154300;
  obj1.ts = 1592210241000;
  obj1.tx = "753812f4084a5ae9f90f9692f1742271c176700c07b05dfd8a828eb645b9a7ae";
  info.push(obj1);

  let obj3 = {};
  //回购燃烧
  obj3.type = 1;
  obj3.addr = "TW8UBosxaTYKAS22WywSVnyjjJr4iEvjNr";
  obj3.amount = 48401626984800;
  obj3.ts = 1592204529000;
  obj3.tx = "b2c6de8290b5a0b81ce60545cf95c9ba4cc4317b85c545c5edbc693a6244e9d7";
  info.push(obj3);

  for (let item of info) {
    await insertDB(item);
  }

  process.exit(0);
}

async function main() {
    await addBurnWinTx()
    process.exit(0);
}

main().catch(e=>{
    console.log(e)
    process.exit(1)
})
