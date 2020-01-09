//仅根据开发环境覆盖相应字段即可
const path = require('path');

let config = {
  env: 'development', //开发环境设为development
  debug: true, //开发环境设为true
  tronConfig: {
    url_full: 'https://testhttpapi.tronex.io', // https://testapi.trondapps.org:8090
    url_solidity: 'https://testhttpapi.tronex.io', // https://testapi.trondapps.org:8091
    url_event: 'http://47.252.82.6:8090/',
    http_timeout: 5000, //ms
    defaultPk: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07'
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  mysqlConfig: {
    db_host: '127.0.0.1',
    db_port: '3306',
    db_name: 'tron_bet_wzc',
    db_user: 'root',
    db_pwd: '123456' //!@Q3wa$ESZ //
  },
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    reset_ts: 1547784000000, //2019/1/18 12:00
    reset_interval: 86400000, //ms 86400000
    min_lv: 0, //15

    top_task_id: 9,
    tasks_config: {
      1: { need: 1, trx: 1 },
      2: { need: 1, trx: 1 },
      3: { need: 1, trx: 1 },
      4: { need: 1, trx: 1 },
      5: { need: 1, trx: 1 },
      6: { need: 1, trx: 1 },
      7: { need: 1, trx: 1 },
      8: { need: 1, trx: 1 },
      9: { need: 1, trx: 1 },
      10: { need: 4, trx: { 1: 1, 15: 1, 20: 1, 25: 44, 30: 56, 35: 68, 40: 80, 45: 92, 50: 104, 55: 116, 60: 128, 65: 140, 70: 152, 75: 164, 80: 176, 85: 188, 90: 200, 95: 212 } },
      11: { need: 7, trx: { 1: 1, 15: 1, 20: 1, 25: 66, 30: 84, 35: 102, 40: 120, 45: 138, 50: 156, 55: 174, 60: 192, 65: 210, 70: 228, 75: 246, 80: 264, 85: 282, 90: 300, 95: 318 } },
      12: { need: 9, trx: { 1: 1, 15: 1, 20: 1, 25: 110, 30: 140, 35: 170, 40: 200, 45: 230, 50: 260, 55: 290, 60: 320, 65: 350, 70: 380, 75: 410, 80: 440, 85: 470, 90: 500, 95: 530 } }
    }
  }
};

module.exports = config;
