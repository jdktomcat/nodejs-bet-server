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
    http_port: prdCfg.port.tronsport_teckserver,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    randomSalt: 'hi!can-you-hear-me?',
    RankInitTs: 1555646400,
    userInfoUrl: prdCfg.userInfoUrl
  },
  tranStatus: {
    bet: 0, //下注
    refund: 10, // 退款
    cancel: 20, // cancel, 之后不能在有其他操作
    settle: 30, // 完成   之后可以回滚
    rollback: 40, // 回滚  之后可以输赢
    win: 50, // win    之后回滚操作
    lost: 51,
    discard: 53
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
  bettech: {
    publicKey: prdCfg.bettech.publicKey
  },
  event:{
    ACTIVITY_START_TS: 1579046400000, //2019-01-15 08:00:00
    ACTIVITY_END_TS: 1580774400000, //2020-02-04 08:00:00
  },
  addition:{
    START_TS: 1577955600000,// 2020-01-02 17:00:00
    END_TS: 1578042000000,// 2020-01-03 17:00:00;
    RATE: 1.5
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
