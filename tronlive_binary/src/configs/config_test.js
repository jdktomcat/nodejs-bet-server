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
    http_port: 18073,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    randomSalt: 'hi,can-you-hear-me?'
  },
  mysqlConfig: {
    db_host: 'localhost',
    db_port: 3306,
    db_name: 'tron_live',
    db_user: 'root',
    db_pwd: '123456',
    connectionLimit: 30
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  Binary: {
    secretKey: "1d1622455b6cb36ef2211b76facc3079cbe9a738",
  },
  event:{
    ACTIVITY_START_TS: 1579996800000,//2020-01-26 00:00:00;
    ACTIVITY_END_TS: 1580774400000,//2020-02-04 00:00:00;
  },
  addition:{
    START_TS: 1589500800000,
    END_TS: 1590031800000,
    RATE: 2
  }
};

module.exports = config;
