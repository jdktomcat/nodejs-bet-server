//仅根据开发环境覆盖相应字段即可
const path = require('path');

let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config_test');
} catch (error) {
  console.log('using app config');
}

let config = {
  env: 'test', //开发环境设为test
  debug: true, //开发环境设为true
  tronConfig: {
    url_full: prdCfg.master_full,
    url_solidity: prdCfg.master_solidity,
    url_event: prdCfg.master_event,
    http_timeout: 5000, //node http request 超时时间(ms)
    defaultPk: prdCfg.operatorDice_pk
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  mysqlConfig: {
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: 'tron_bet_wzc',
    db_user: prdCfg.mysql.user,
    db_pwd: prdCfg.mysql.pwd
  },
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    reset_ts: 1547784000000, //2019/1/18 12:00
    reset_interval: 86400000, //ms 86400000
    min_lv: 15,

    top_task_id: 9,
    tasks_config: {
      1: { need: 30, trx: 10 },
      2: { need: 30, trx: 10 },
      3: { need: 20, trx: 15 },
      4: { need: 20, trx: 15 },
      5: { need: 20, trx: 15 },
      6: { need: 10, trx: 15 },
      7: { need: 1, trx: 30 },
      8: { need: 5, trx: 25 },
      9: { need: 5, trx: 25 },
      10: { need: 4, trx: { 15: 20, 20: 32, 25: 44, 30: 56, 35: 68, 40: 80, 45: 92, 50: 104, 55: 116, 60: 128, 65: 140, 70: 152, 75: 164, 80: 176, 85: 188, 90: 200, 95: 212 } },
      11: { need: 7, trx: { 15: 30, 20: 48, 25: 66, 30: 84, 35: 102, 40: 120, 45: 138, 50: 156, 55: 174, 60: 192, 65: 210, 70: 228, 75: 246, 80: 264, 85: 282, 90: 300, 95: 318 } },
      12: { need: 9, trx: { 15: 50, 20: 80, 25: 110, 30: 140, 35: 170, 40: 200, 45: 230, 50: 260, 55: 290, 60: 320, 65: 350, 70: 380, 75: 410, 80: 440, 85: 470, 90: 500, 95: 530 } }
    }
  }
};

module.exports = config;
