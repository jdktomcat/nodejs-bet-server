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

    beginBlockNumber: 4424385,
    // TronBetDiceOraclize
    RANDOM_CONTRACT_ADDRESS: prdCfg.contract.TronBetDiceOraclize,
    // TronBetDice
    TRON_BET_CONTRACT_ADDRESS: ['', '', '', prdCfg.contract.TronBetDice], //用来判断dice事件版本
    // TronBetDiceDivider
    DICE_DIVIDENDS_CONTRACT_ADDRESS: prdCfg.contract.TronBetDiceDivider, //dice分红合约地址
    // TronBetDividerPlus
    WIN_DIVIDENDS_CONTRACT_ADDRESS: prdCfg.contract.TronBetDividerPlus //win分红合约地址
  }
};

module.exports = config;
