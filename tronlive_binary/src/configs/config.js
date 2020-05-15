const fs = require('fs');
const path = require('path');
let Binary = {
  secretKey : ''
}
let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config');
} catch (error) {
  console.log('using app config');
}
if(prdCfg.Binary === undefined){
  prdCfg.Binary = Binary
}
let config = {
  env: 'production',
  debug: false,
  app: {
    http_port: prdCfg.port.tronlive_binary,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    randomSalt: 'hi!can-you-hear-me?'
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
  Binary: {
    secretKey: prdCfg.Binary.secretKey,
  },
  event:{
    ACTIVITY_START_TS: 1580108400000,//Mon Jan 27 2020 15:00:00
    ACTIVITY_END_TS: 1580799600000,//Tue Feb 04 2020 15:00:00
  },
  addition:{
    START_TS: 1589859000000,
    END_TS: 1590031800000,
    RATE: 2
  }
};

if (process.env.NODE_ENV === 'production' && fs.existsSync(__dirname + '/config.js')) {
  //生产环境
  console.log('>>>Use production config!');
} else if (process.env.NODE_ENV === 'test' && fs.existsSync(__dirname + '/config_test.js')) {
  //测试环境
  config = Object.assign(config, require('./config_test.js'));
}


module.exports = config;
