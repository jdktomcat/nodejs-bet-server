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
    http_port: prdCfg.port.tronbet_live,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    withdrawMaxTimes: 100, //每天最大提取次数
    withdrawMaxAmount: 1000000000000, // 个人每次每天最大提取数量 100w TRX
    withdrawMaxAmountDaily: 10000000000000, // 个人每次每天最大提取数量 1000w TRX
    profitMin: -5000000, // 最低奖池
    withdrawMaxAmountUSDT: 20000000000, // 个人每次每天最大提取数量 2w USDT
    withdrawMaxAmountUSDTDaily: 200000000000, // 个人每次每天最大提取数量 20w USDT
    profitMinUSDT: -10000, // 最低奖池USDT
    randomSalt: 'hi,can-you-hear-me?',
    fees: 0.008,
    cipherKey: 'randomrandombyyyyyyyyyy1',
    clientURL: 'https://wink.org',
    RankInitTs: 1555646400,
    userInfoUrl: prdCfg.userInfoUrl,
    rankRate: [47.887, 23.943, 11.972, 5.986, 2.993, 1.496, 1.197, 0.958, 0.766, 0.613, 0.49, 0.392, 0.314, 0.251, 0.201, 0.161, 0.129, 0.103, 0.082, 0.066],
    blacklist: { 'TGZTHbshfat5enRMRaZmRen3htTEhpA5hz': true, 'TKVpkrQGhP9nJNiK13qxBrE2GTYRZHxSMu': true, 'TW1aHPKJpDDcs2aUQfM9yaAcBo491YHFAB': true  }
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

    // TronBetLive
    withdrawAddr: prdCfg.contract.TronBetLive,
    // TronBetLivePool
    livePoolAddr: prdCfg.contract.TronBetLivePool,
    // TronBetLiveHotSlots
    rankwardAddr: prdCfg.contract.TronBetLiveHotSlots,
    // LivePay
    livePayAddr: prdCfg.contract.LivePay,
    // USDT
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
    secretKey: "df1d0fa3-0634-48b4-a34c-555fc82a1fd6",
  },
  Binary: {
    secretKey: "1d1622455b6cb36ef2211b76facc3079cbe9a738",
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

module.exports = config;
