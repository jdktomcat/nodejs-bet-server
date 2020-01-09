const path = require('path');

let config = {
  env: 'development',
  debug: false,
  app: {
    http_port: 18071,
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
    connectionLimit: 20
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  mongoConfig: {
    host: '127.0.0.1',
    port: 27017,
    db: 'poker11',
    user: 'poker11',
    pwd: '123456'
  },
  tronConfig: {
    startBlockNum: 1614394,
    // TronBetTexasJackpot
    jackpotAddr: '412b46030a69de541beecce77a13097a5feceb31f8',
    defaultPk: '',

    masterFullNode: 'https://testhttpapi.tronex.io',
    masterSolidityNode: 'https://testhttpapi.tronex.io',
    masterEventNode: 'http://47.252.82.6:8090',

    slaveFullNode: 'https://testhttpapi.tronex.io',
    slaveSolidityNode: 'https://testhttpapi.tronex.io',
    slaveEventNode: 'http://47.252.82.6:8090'
  }
};

module.exports = config;
