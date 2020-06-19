const fs = require('fs');
const path = require('path');

let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config');
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
    randomSalt: 'x!hi,can-you-hear-me?'
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
    // 2020-06-22 00:00:00
    ACTIVITY_START_TS: 1592755200000,
    // 2020-06-28 23:59:59
    ACTIVITY_END_TS: 1593359999000
  }
};
// wallet url
config.live_wallet_url = 'http://127.0.0.1:18074'
//
if (process.env.NODE_ENV === 'production' && fs.existsSync(__dirname + '/config.js')) {
  //生产环境
  console.log('>>>Use production config!');
} else if (process.env.NODE_ENV === 'test' && fs.existsSync(__dirname + '/config_test.js')) {
  //测试环境
  config = Object.assign(config, require('./config_test.js'));
} else if (process.env.NODE_ENV === 'development' && fs.existsSync(__dirname + '/config_test.js')) {
  //开发环境
  config = Object.assign(config, require('./config_dev.js'));
} else {
  config = Object.assign(config, require('./config_dev.js'));
}

module.exports = config;
