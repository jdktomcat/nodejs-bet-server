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
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志
    clearLog: true, //启动日志清理
    port: prdCfg.port.tronbet_poker
  },
  mysqlConfig: {
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: 'tronbet_poker_log',
    db_user: prdCfg.mysql.user,
    db_pwd: prdCfg.mysql.pwd
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  mongoConfig: {
    host: prdCfg.mongo.host,
    port: prdCfg.mongo.port,
    db: 'tronbet_poker_data',
    user: prdCfg.mongo.user,
    pwd: prdCfg.mongo.pwd
  },
  userInfoUrl: prdCfg.userInfoUrl,
  tronConfig: {
    tronNode: [
      {
        fullUrl: prdCfg.master_full,
        solidityUrl: prdCfg.master_solidity,
        priority: 1
      },
      {
        fullUrl: prdCfg.slave_full,
        solidityUrl: prdCfg.slave_solidity,
        priority: 2
      },
      {
        fullUrl: prdCfg.master_full,
        solidityUrl: prdCfg.master_solidity,
        priority: 3
      }
    ],

    addrAdmins: ['TS3u31e3bjAtAB9CnKLJ9EVUbhk8wePtog', 'TAHAyhFkRz37o6mYepBtikrrnCNETEFtW5'],

    defaultPk: prdCfg.operatorLive_pk,

    beginBlockNumber: 11328259,

    TRON_TEXAS_PAY_ADDR: prdCfg.contract.TronBetTexas,
    TRON_TEXAS_JACKPOT_ADDR: prdCfg.contract.TronBetTexasJackpot
  },

  // 比赛桌配置
  cupConfig: {
    cupGame: false, // 是否开启比赛
    tableId: 906001, // 比赛桌号
    // 参赛选手地址名单
    // staff hammer weather useless vapor trap misery crowd issue donkey relax eight
    addrPlayers: {
      'TFPs7sdeQsEae95SAQbo8pwzTBinuPwkWR': { name: 'Bluffing Ankles', head: '30001', lv: 99, seatNo: 0 }, // Spencer Dinwiddie
      'TRqvMZKjFVET2A3bSaDE3wB4mAWp63fX94': { name: 'The Announcer', head: '30002', lv: 99, seatNo: 1 }, // Justin Sun
      'TYWxzUL4kr5e398KZTbuS6WeUo8azF4JYR': { name: 'SAFU Master', head: '30003', lv: 99, seatNo: 2 }, // CZ
      'TXEtHyuS2PoikSF7oRpUT6ZBJpmQdqEHMA': { name: 'SlayerS_BoxeR', head: '30004', lv: 99, seatNo: 3 }, // Lim Yo-hwan
      'TVEBd9DsFehG26s4pMVkQzUsEYnFuXecKh': { name: 'Captain Planet', head: '30005', lv: 99, seatNo: 4 }, // Bidder
      'TGjQTVt3vExZjUkxa2DzhPnVjZZ6FAmiVq': { name: 'Bitizen', head: '30006', lv: 99, seatNo: 5 }, // Jared
      'TGCSwZC621EcbmgiiY1RBX8wskT1KGpukt': { name: "dApp'n Dude", head: '30007', lv: 99, seatNo: 6 }, // Vincent
      'TRJJgBX63GRcbmu9TWSUAk3YNrUnFx1Npg': { name: 'Litening', head: '30008', lv: 99, seatNo: 7 }, // Charlie Lee
      'TUeUnuL3dMhKCw8LJSSa4dvrUQdWfMKCNi': { name: 'The Mustache', head: '30009', lv: 99, seatNo: 8 } // Tommy Mustache
    },

    addrVIPs: ['TGKpnHx8RrnmFdJ27Cc4aqV7CH329RqFs5', 'THMtaKo6v62cvY1dQDbTEetL8yc1RoYEXo', 'TSCMZFvbPtNqnTskhJ1jmZ1gMsZP3aAsR5', 'TJDbSqba4LYsJL9nwndnHN5eZnDM3hwd1b'], //裁判员(aj)
    addrGMs: ['TGKpnHx8RrnmFdJ27Cc4aqV7CH329RqFs5'], //管理员/GM(blizzard)
    startTs: 1560528000000, //2019/6/15 00:00:00 //默认比赛开始时间
    endTs: 1560535200000 //2019/6/15 02:00:00 //默认比赛结束时间
  },
  //现金桌配置
  cashConfig: {
    endTs: 0, //2019/6/14 23:30:00 //默认现金桌停服时间
    feeRate: 0.05, //抽成比例
    minPlayers: 2, //最小开启游戏人数
    high_score_mode: false //高分模式(测试用)
  },
  //SNG配置
  sngConfig: {
    feeRate: [0.1, 0.08, 0.075, 0.05, 0.025], //抽成比例
    SNG_RESET_CD: 60000, //SNG 牌桌重置CD(毫秒)
    SNG_BB_LV_CD: 180000 //SNG 升盲CD(毫秒)
  },
  event:{
    // 2020-06-22 00:00:00
    ACTIVITY_START_TS: 1592582400000,
    // 2020-06-28 23:59:59
    ACTIVITY_END_TS: 1592784000000
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
