const path = require('path');

let config = {
  env: 'development',
  debug: false,
  app: {
    http_port: 18072,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    randomSalt: 'hi,can-you-hear-me?'
  },
  mysqlConfig: {
    db_host: '127.0.0.1',
    db_port: '3306',
    db_name: 'tron_live',
    db_user: 'root',
    db_pwd: '123456',
    connectionLimit: 5
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  event:{
    ACTIVITY_START_TS: 1579996800000,//2020-01-26 00:00:00;
    ACTIVITY_END_TS: 1580774400000,//2020-02-04 00:00:00;
  },
  tronConfig: {
    privateKey: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07',

    masterFullNode: 'https://testhttpapi.tronex.io',
    masterSolidityNode: 'https://testhttpapi.tronex.io',
    masterEventNode: 'http://47.252.82.6:8090/',

    slaveFullNode: 'https://testhttpapi.tronex.io',
    slaveSolidityNode: 'https://testhttpapi.tronex.io',
    slaveEventNode: 'http://47.252.82.6:8090/'
  },
  EveryMatrix: {
    LoginName: 'EMOpenUser2019',
    Password: 'EM!@#avg$%^&*()_2019'
  }
};

module.exports = config;
