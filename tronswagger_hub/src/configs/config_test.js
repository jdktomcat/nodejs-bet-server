const path = require('path');

let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config_test');
} catch (error) {
  console.log('using app config');
}

let config = {
  env: 'dev',
  debug: false,
  app: {
    http_port: prdCfg.port.tronswagger_hub,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    randomSalt: 'hi,can-you-hear-me?'
  },
  mysqlConfig: {
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: 'tron_live',
    db_user: prdCfg.mysql.user,
    db_pwd: prdCfg.mysql.pwd,
    connectionLimit: 30
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  tronConfig: {
    privateKey: prdCfg.operatorLive_pk,

    masterFullNode: prdCfg.master_full,
    masterSolidityNode: prdCfg.master_solidity,
    masterEventNode: prdCfg.master_event,

    slaveFullNode: prdCfg.slave_full,
    slaveSolidityNode: prdCfg.slave_solidity,
    slaveEventNode: prdCfg.slave_event
  },
  swaghub: {
    host: prdCfg.swaghub.host,
    operator_id: prdCfg.swaghub.operator_id,
    swagPublick: prdCfg.swaghub.swagPublick,
    publicKey: prdCfg.swaghub.publicKey,
    privetKey: prdCfg.swaghub.privetKey
  },
  event:{
    ACTIVITY_START_TS: 1579996800000,//2020-01-26 00:00:00;
    ACTIVITY_END_TS: 1580774400000,//2020-02-04 00:00:00;
  }
};

module.exports = config;
