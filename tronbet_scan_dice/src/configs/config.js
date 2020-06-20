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
    log: true, //开启日志
    clearLog: true //启动日志清理
  },
  mysqlConfig: {
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: 'tron_bet_wzc',
    db_user: prdCfg.mysql.user,
    db_pwd: prdCfg.mysql.pwd
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    pwd: ''
  },
  tronConfig: {
    tron_url_full: prdCfg.tron_url_full,
    tron_url_solidity: prdCfg.tron_url_solidity,
    tron_url_event: prdCfg.tron_url_event,

    back_tron_url_full: prdCfg.back_tron_url_full,
    back_tron_url_solidity: prdCfg.back_tron_url_solidity,
    back_tron_url_event: prdCfg.back_tron_url_event,

    defaultPk: prdCfg.operatorDice_pk,

    beginBlockNumber: 10817771,

    RANDOM_CONTRACT_ADDRESS: prdCfg.contract.TronBetDiceOraclize,
    // 扫雷游戏下注合约地址
    MINE_CONTRACT_ADDRESS: prdCfg.contract.TronBetMineOraclize,

    TRON_BET_CONTRACT_ADDRESS: ['', '', '', prdCfg.contract.TronBetDice], //用来判断dice事件版本
    DICE_DIVIDENDS_CONTRACT_ADDRESS: prdCfg.contract.TronBetDiceDivider, //dice分红合约地址
    WIN_DIVIDENDS_CONTRACT_ADDRESS: prdCfg.contract.TronBetDividerPlus //win分红合约地址
  },
  event:{
    // 2020-06-22 00:00:00
    ACTIVITY_START_TS: 1592582400000,
    // 2020-06-28 23:59:59
    ACTIVITY_END_TS: 1593359999000
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
