const path = require('path');

let config = {
  env: 'development',
  debug: false,
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    withdrawMaxTimes: 100, //每天最大提取次数
    withdrawMaxAmount: 1000000000000, // 每次最大提取数量
    randomSalt: 'hi,can-you-hear-me?'
  },
  mysqlConfig: {
    db_host: 'localhost',
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
  tronConfig: {
    startBlockNum: 8217400,
    privateKey: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07',
    // TronBetLiveStaker
    stakerAddr: '41a59b50fc1d079e5b45c867953353a43b62cde423',
    // TronBetLive
    withdrawAddr: '41cf5638fc96f7f613eda60c6b05eea683cd7ef5b5',
    // TronBetLivePool
    livePoolAddr: '41b9d8546972e9075edb4259ed0fe728f6f039d812',
    // useless
    anteStkerAddr: '41b2b9efe94cc9f548c2ee1755b217606db7521dcd',

    masterFullNode: 'https://testhttpapi.tronex.io',
    masterSolidityNode: 'https://testhttpapi.tronex.io',
    masterEventNode: 'http://47.252.82.6:8090/',

    slaveFullNode: 'https://testhttpapi.tronex.io',
    slaveSolidityNode: 'https://testhttpapi.tronex.io',
    slaveEventNode: 'http://47.252.82.6:8090/'
  },
  softswiss: {
    BACKEND_URL: '', // aggregator's url (our server)
    SCRIPT_URL: '', // frontend service library location
    CASINO_URL: '', // casino api endpoint (your server)
    AUTH_TOKEN: '', // token used to sign messages
    CASINO_ID: '' // your casino's identifier
  }
};

module.exports = config;
