const path = require('path');

let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config_test');
} catch (error) {
  console.log('using app config');
}

let config = {
  env: 'test',
  debug: false,
  app: {
    http_port: prdCfg.port.tronpoker_jackpot,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    randomSalt: 'hi,can-you-hear-me?'
  },
  mysqlConfig: {
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: 'tronbet_poker_log',
    db_user: prdCfg.mysql.user,
    db_pwd: prdCfg.mysql.pwd,
    connectionLimit: 20
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  mongoConfig: {
    host: prdCfg.mongo.host,
    port: prdCfg.mongo.port,
    db: 'tronbet_poker_data',
    user: prdCfg.mongo.user,
    pwd: prdCfg.mongo.pwd
  },
  tronConfig: {
    startBlockNum: 4424385,
    defaultPk: prdCfg.operatorLive_pk,
    // TronBetTexasJackpot
    jackpotAddr: prdCfg.contract.TronBetTexasJackpot,

    masterFullNode: prdCfg.master_full,
    masterSolidityNode: prdCfg.master_solidity,
    masterEventNode: prdCfg.master_event,

    slaveFullNode: prdCfg.slave_full,
    slaveSolidityNode: prdCfg.slave_solidity,
    slaveEventNode: prdCfg.slave_event
  }
};

module.exports = config;
