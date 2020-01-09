//仅根据开发环境覆盖相应字段即可
const path = require('path');

let config = {
  env: 'development', //开发环境设为development
  debug: true, //开发环境设为true
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true //开启日志
  },
  mysqlConfig: {
    // db_host: '127.0.0.1',
    // db_port: '3306',
    // db_name: 'tron_bet_dice_test',
    // db_user: 'root',
    // db_pwd: '!@Q3wa$ESZ' //!@Q3wa$ESZ //
    db_host: 'localhost',
    db_port: '3306',
    db_name: 'tron_bet_wzc',
    db_user: 'root',
    db_pwd: '123456' //!@Q3wa$ESZ //
  },
  tronConfig: {
    url_full: 'https://testhttpapi.tronex.io', // https://testapi.trondapps.org:8090
    url_solidity: 'https://testhttpapi.tronex.io', // https://testapi.trondapps.org:8091
    url_event: 'http://47.252.82.6:8090/',
    http_timeout: 5000, //ms
    defaultPk: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07' //TAHAyhFkRz37o6mYepBtikrrnCNETEFtW5
  },
  award: {
    anteAddr: '4119727964e69634d77196fa41fa53fd9798e85a1b', //测试ANTE合约 4119727964e69634d77196fa41fa53fd9798e85a1b

    // TRX_RANK: [4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // ANTE_RANK: [1],

    // 奖励比例
    TRX_RANK: [0.5, 0.25, 0.125, 0.0625, 0.0313, 0.0156, 0.0078, 0.0039, 0.002, 0.001],
    // TRX 保底奖励
    TRX_RANK_BASIC: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    // ANTE_RANK: [1, 1, 1],
    // 前三名空投rank的数值
    ANTE_RANK: [0, 0, 0],

    RANK_SHOW_COUNT: 20,
    RANK_DURATION: 3 * 60 * 1000, //每轮排名持续时间(ms)
    SCAN_INTERVAL: 10000, //扫描间隔(ms)
    BEGIN_TS: 1546486440000 //开始时间戳(ms) 2019/1/3 11:15:00
  }
};

module.exports = config;
