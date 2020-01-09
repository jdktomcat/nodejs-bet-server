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
    connectionLimit: 10
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  tronConfig: {
    privateKey: prdCfg.operatorLive_pk,
    // TronBetRakePool
    livePoolAddr: prdCfg.contract.TronBetRakePool,

    masterFullNode: prdCfg.master_full,
    masterSolidityNode: prdCfg.master_solidity,
    masterEventNode: prdCfg.master_event,

    slaveFullNode: prdCfg.slave_full,
    slaveSolidityNode: prdCfg.slave_solidity,
    slaveEventNode: prdCfg.slave_event
  },
  softswiss: {
    BACKEND_URL: '', // aggregator's url (our server)
    SCRIPT_URL: '', // frontend service library location
    CASINO_URL: '', // casino api endpoint (your server)
    AUTH_TOKEN: '', // token used to sign messages
    CASINO_ID: '' // your casino's identifier
  },
  addition:{
    START_TS: 1578042000000,// 2020-01-03 17:00:00
    END_TS: 1578128400000,// 2020-01-04 17:00:00
    RATE: 1.8
  }
};

module.exports = config;
