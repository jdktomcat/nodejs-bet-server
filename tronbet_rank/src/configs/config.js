const fs = require('fs');
const path = require('path');

let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config');
} catch (error) {
  console.log('using app config');
}

let config = {
  env: 'production',
  debug: false,
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true //开启日志
  },
  mysqlConfig: {
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: 'tron_bet_wzc',
    db_user: prdCfg.mysql.user,
    db_pwd: prdCfg.mysql.pwd
  },
  tronConfig: {
    url_full: prdCfg.master_full,
    url_solidity: prdCfg.master_solidity,
    url_event: prdCfg.master_event,
    http_timeout: 5000, //ms
    defaultPk: prdCfg.operatorDice_pk
  },
  award: {
    anteAddr: '411a44e676d4864660d984f6d1f4eb06d0f5cc5208', //正式ANTE合约 411a44e676d4864660d984f6d1f4eb06d0f5cc5208
    // TRX_RANK: [0.5, 0.25, 0.125, 0.0625, 0.0313, 0.0156, 0.0078, 0.0039, 0.0020, 0.001],
    // TRX_RANK_BASIC: [4000, 2000, 1000, 500, 250, 125, 62, 31, 15, 7],
    // ANTE_RANK: [240, 120, 40],
    // TRX_RANK: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    // TRX_RANK_BASIC: [8000, 4000, 2000, 1000, 500, 250, 125, 62, 31, 15],
    // ANTE_RANK: [0, 0, 0],
    TRX_RANK: [0.5, 0.25, 0.125, 0.0625, 0.0313, 0.0156, 0.0078, 0.0039, 0.002, 0.001],
    TRX_RANK_BASIC: [1000, 500, 250, 125, 62, 31, 15, 7, 3, 1],
    ANTE_RANK: [0, 0, 0],

    RANK_SHOW_COUNT: 20,
    RANK_DURATION: 1 * 60 * 60 * 1000, //每轮排名持续时间(ms)
    SCAN_INTERVAL: 30000, //扫描间隔(ms)
    BEGIN_TS: 1546488000000 //开始时间戳(ms) 2019/1/3 12:00:00
  }
};

if (process.env.NODE_ENV === 'production' && fs.existsSync(__dirname + '/config.js')) {
  //生产环境
  console.log('>>>Use production config!');
} else if (process.env.NODE_ENV === 'test' && fs.existsSync(__dirname + '/config_test.js')) {
  //测试环境
  config = Object.assign(config, require('./config_test.js'));
} else if (process.env.NODE_ENV === 'development' && fs.existsSync(__dirname + '/config_dev.js')) {
  //开发环境
  config = Object.assign(config, require('./config_dev.js'));
} else {
  config = Object.assign(config, require('./config_dev.js'));
}

module.exports = config;
