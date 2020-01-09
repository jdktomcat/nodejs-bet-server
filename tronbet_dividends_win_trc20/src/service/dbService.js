const db = require('../utils/utilMysql');
const { app } = require('../configs/config');
const axios = require('axios');
const exec = db.exec;
const execTrans = db.execTrans;

async function getPreRoundInfo(_round, conn) {
  let sql = 'SELECT round, state FROM tron_live.win_trc20_div_info WHERE round = ? AND state != 2 LIMIT 1;';
  let params = [_round];
  let fun = conn == null ? exec : execTrans;
  let ret = await fun(sql, params, conn);
  return ret ? ret[0] : null;
}

module.exports = {
  getPreRoundInfo
};
