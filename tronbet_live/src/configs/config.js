const fs = require('fs');
const path = require('path');
const blacklist = require('./blacklist');
let Platinus = {
  secretKey : ''
}
let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config');
} catch (error) {
  console.log('using app config');
}
if(prdCfg.Platinus === undefined){
  prdCfg.Platinus = Platinus
}
let config = {
  env: 'production',
  debug: false,
  app: {
    http_port: prdCfg.port.tronbet_live,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    withdrawMaxTimes: 20, //个人每天最大提取次数
    withdrawMaxAmount: 500000000000, // 个人每次每天最大提取数量 50w TRX
    // withdrawMaxAmountDaily: 7000000000000, // 个人每次每天最大提取数量 700w TRX
    withdrawMaxAmountDaily: 7000000000, // 个人每次每天最大提取数量 700w TRX
    profitMin: -8000000, // 最低奖池
    withdrawMaxAmountUSDT: 10000000000, // 个人每次每天最大提取数量 1w USDT
    withdrawMaxAmountUSDTDaily: 50000000000, // 个人每次每天最大提取数量 5w USDT
    profitMinUSDT: -10000, // 最低奖池USDT
    randomSalt: 'hi,can-you-hear-me?',
    fees: 0.008,
    cipherKey: 'randomrandombyyyyyyyyyy1',
    clientURL: 'https://wink.org',
    RankInitTs: 1555646400,
    userInfoUrl: prdCfg.userInfoUrl,
    rankRate: [47.887, 23.943, 11.972, 5.986, 2.993, 1.496, 1.197, 0.958, 0.766, 0.613, 0.49, 0.392, 0.314, 0.251, 0.201, 0.161, 0.129, 0.103, 0.082, 0.066],
    // blacklist: { 'TGZTHbshfat5enRMRaZmRen3htTEhpA5hz': true, 'TKVpkrQGhP9nJNiK13qxBrE2GTYRZHxSMu': true, 'TW1aHPKJpDDcs2aUQfM9yaAcBo491YHFAB': true,'TCt5SterEopvsvKcZCjGQ9XTqNf9bDXDyr': true,'TUsPCrcLJPUvyi9SFJVgfGPSjmc4G16YE6': true,'TNAXtunrUYWoHcTp9o98KHn8ooTLGwH8iM': true,'TFPYSwYtA3nE9h4dxv7Zj3m9RR5fBkMRJo': true }
    blacklist: blacklist
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

    withdrawAddr: prdCfg.contract.TronBetLive,
    livePoolAddr: prdCfg.contract.TronBetLivePool,
    rankwardAddr: prdCfg.contract.TronBetLiveHotSlots,
    livePayAddr: prdCfg.contract.LivePay,
    usdtAddress: prdCfg.contract.USDT,

    masterFullNode: prdCfg.master_full,
    masterSolidityNode: prdCfg.master_solidity,
    masterEventNode: prdCfg.master_event,

    slaveFullNode: prdCfg.slave_full,
    slaveSolidityNode: prdCfg.slave_solidity,
    slaveEventNode: prdCfg.slave_event
  },
  EveryMatrix: {
    LoginName: prdCfg.EveryMatrix.LoginName,
    Password: prdCfg.EveryMatrix.Password
  },
  coinspaid: {
    host: prdCfg.coinspaid.host,
    key: prdCfg.coinspaid.key,
    secret: prdCfg.coinspaid.secret
  },
  mail: {
    port: prdCfg.mail.port,
    host: prdCfg.mail.host,
    user: prdCfg.mail.user,
    pass: prdCfg.mail.pass,
    from: 'Welcome',
    registerSub: 'Wink.org Verification'
  },
  swaghub: {
    host: prdCfg.swaghub.host,
    operator_id: prdCfg.swaghub.operator_id,
    swagPublick: prdCfg.swaghub.swagPublick,
    publicKey: prdCfg.swaghub.publicKey,
    privetKey: prdCfg.swaghub.privetKey
  },
  Platinus: {
    secretKey: prdCfg.Platinus.secretKey,
  },
  currency: ['BTC', 'LTC', 'BCH', 'ETH', 'BNB'],
  withdrawMaxConf: {
    BTC: 2,
    LTC: 300,
    ETH: 100,
    BCH: 90,
    BNB: 500
  }
};

if (process.env.NODE_ENV === 'production' && fs.existsSync(__dirname + '/config.js')) {
  //生产环境
  console.log('>>>Use production config!');
  // add cp key
  config.Binary = {}
  config.Binary.secretKey = ''
  // config.Binary.secretKey = prdCfg.Binary.secretKey
  //
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
