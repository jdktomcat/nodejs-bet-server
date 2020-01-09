const path = require('path');

let config = {
  env: 'development',
  debug: false,
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    randomSalt: 'hi,can-you-hear-me?'
  },
  mysqlConfig: {
    db_host: 'localhost',
    db_port: '3306',
    db_name: 'tronbet_poker_log',
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
  tronConfig: {
    privateKey: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07',
    // TronBetRakePool
    livePoolAddr: '4115975a7734f2092a6e87f3b51af5f7a1a1e48ac3',

    masterFullNode: 'https://testhttpapi.tronex.io',
    masterSolidityNode: 'https://testhttpapi.tronex.io',
    masterEventNode: 'http://47.252.82.6:8090',

    slaveFullNode: 'https://testhttpapi.tronex.io',
    slaveSolidityNode: 'https://testhttpapi.tronex.io',
    slaveEventNode: 'http://47.252.82.6:8090'
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
