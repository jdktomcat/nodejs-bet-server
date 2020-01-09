const db = require('../utils/dbUtil');

async function insertTRXUSD(price, count, time) {
  let now = new Date().getTime();
  let sql = 'INSERT INTO TRX_USD(price, count, last_updated, created_at, updated_at) VALUES (?, ?, ?, ?, ?)';
  let res = await db.exec(sql, [price, count, time, now, now]);
  return res;
}

async function insertTRXEUR(price, count, time) {
  let now = new Date().getTime();
  let sql = 'INSERT INTO TRX_EUR(price, count, last_updated, created_at, updated_at) VALUES (?, ?, ?, ?, ?)';
  let res = await db.exec(sql, [price, count, time, now, now]);
  return res;
}

async function insertUSDEUR(price, count) {
  let now = new Date().getTime();
  let sql = 'INSERT INTO USD_EUR(price, count, last_updated, created_at, updated_at) VALUES (?, ?, ?, ?, ?)';
  let res = await db.exec(sql, [price, count, now, now, now]);
  return res;
}

module.exports = {
  insertTRXUSD,
  insertTRXEUR,
  insertUSDEUR
};
