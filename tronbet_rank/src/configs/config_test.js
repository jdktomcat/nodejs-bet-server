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
    anteAddr: '41a081a7965b1116d69bca9f39767fce19e1668b24', //测试ANTE合约 4119727964e69634d77196fa41fa53fd9798e85a1b

    // 奖励比例
    TRX_RANK: [0.5, 0.25, 0.125, 0.0625, 0.0313, 0.0156, 0.0078, 0.0039, 0.002, 0.001],
    // TRX 保底奖励
    TRX_RANK_BASIC: [1000, 500, 250, 125, 62, 31, 15, 7, 3, 1],
    // 前三名空投rank的数值
    ANTE_RANK: [0, 0, 0],

    RANK_SHOW_COUNT: 20,
    RANK_DURATION: 1 * 60 * 60 * 1000, //每轮排名持续时间(ms)
    SCAN_INTERVAL: 30000, //扫描间隔(ms)
    BEGIN_TS: 1546486440000 //开始时间戳(ms) 2019/1/3 11:15:00
  }
};

module.exports = config;
