const fs = require("fs");
const path = require("path");

let prdCfg = {};
try {
  prdCfg = require("/Users/sid.tang/workspace/work-project/wink/nodejs-bet-server/tronbet_config/config");
} catch (error) {
  console.log("using app config");
}

let config = {
  env: "dev",
  debug: false,
  app: {
    http_port: prdCfg.port.tronbet_event01,
    logPath: path.resolve(__dirname, "../../logs"),
    log: true, //开启日志,
    startTs: 1580108400000,//Mon Jan 27 2020 15:00:00
    endTs: 1580799600000,//Tue Feb 04 2020 15:00:00
    interval: 86400000,
    randomSalt: "hi,can-you-hear-me?"
  },
  mysqlConfig: {
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: "tron_bet_event",
    db_user: prdCfg.mysql.user,
    db_pwd: prdCfg.mysql.pwd,
    connectionLimit: 10
  },
  redisConfig: {
    host: "127.0.0.1",
    port: 6379,
    db: 1,
    pwd: ""
  },
  tronConfig: {
    // 发奖的私钥
    // privateKey: prdCfg.operatorDice_pk,
    privateKey: prdCfg.event_pk,
    // 发奖的私钥 对应的公钥
    // payPKHex: "TYmLSP22fzNNHozSXN6ANQF97zp8rhRP7K",
    payPKHex: prdCfg.event_pk_hex,

    masterFullNode: prdCfg.master_full,
    masterSolidityNode: prdCfg.master_solidity,
    masterEventNode: prdCfg.master_event,

    slaveFullNode: prdCfg.slave_full,
    slaveSolidityNode: prdCfg.slave_solidity,
    slaveEventNode: prdCfg.slave_event
  },
  boxConf: {
    goodsRate: [
      10000,
      20000,
      30000,
      33000,
      36000,
      36900,
      37800,
      38076,
      38352,
      38628
    ],
    // suitPrices: { 3: 9, 5: 10, 7: 60, 10: 300 },
    suitPrices: { 3: 6, 5: 10, 7: 50, 10: 300 },

    suitScore: { 3: 4, 5: 16, 7: 100, 10: 1000 },

    // goodPrices: [2.7, 2.7, 2.7, 10, 10, 43, 43, 132, 132, 132],
    goodPrices: [1, 1, 1, 2, 2, 5, 5, 10, 10, 10],

    lottery: { 3: 0, 5: 1, 7: 3, 10: 12 },
    lotteryRate: [
      60000,
      60000,
      500000,
      40000,
      250000,
      20000,
      1000,
      1000,
      60000,
    ]
  },
  // 日排行奖励配置
  rewards: [
    88888,
    36666,
    18888,
    6666,
    3888,
    1888,
    888,
    888,
    888,
    888,
    888,
    888,
    888,
    888,
    888,
    666,
    666,
    666,
    666,
    666,
    388,
    388,
    388,
    388,
    388,
    388,
    388,
    388,
    388,
    388,
    166,
    166,
    166,
    166,
    166,
    166,
    166,
    166,
    166,
    166,
    88,
    88,
    88,
    88,
    88,
    88,
    88,
    88,
    88,
    88
  ],
  activity:{
    startTime:'2020-06-15 00:00:00',
    endTime:'2020-06-24 23:59:59',
    championship: {
      startTime:'2020-06-15 00:00:00',
      endTime:'2020-06-24 23:59:59',
      top:50,
      prize:{
        1:400000,2:200000,3:100000,4:30000,5:30000,
        6:30000, 7:30000, 8:30000, 9:30000, 10:30000,
        11:5000, 12:5000, 13:5000, 14:5000, 15:5000,
        16:5000, 17:5000, 18:5000, 19:5000, 20:5000,
        21:2500, 22:2500, 23:2500, 24:2500, 25:2500,
        26:2500, 27:2500, 28:2500, 29:2500, 30:2500,
        31:1000, 32:1000, 33:1000, 34:1000, 35:1000,
        36:1000, 37:1000, 38:1000, 39:1000, 40:1000,
        41:500, 42:500, 43:500, 44:500, 45:500,
        46:500, 47:500, 48:500, 49:500, 50:500
      },
      stage:[
        {
          name:'第一阶段',
          rate:0.001,
          startTime:'2020-06-15 00:00:00',
          endTime:'2020-06-21 23:59:59'
        },
        {
          name:'第二阶段',
          rate:0.002,
          startTime:'2020-06-22 00:00:00',
          endTime:'2020-06-23 23:59:59'
        },
        {
          name:'第三阶段',
          rate:0.003,
          startTime:'2020-06-24 00:00:00',
          endTime:'2020-06-24 23:59:59'
        }
      ]
    },
    flight:{
      startTime:'2020-06-15 00:00:00',
      endTime:'2020-06-24 23:59:59',
      minAmount:30,
      rate:0.004,
      plant:[
        {
          id:0,
          name:'Earth',
          fuel:20,
          minPrize:50,
          maxPrize:200
        },
        {
          id:1,
          name:'Moon',
          fuel:40,
          minPrize:100,
          maxPrize:400
        },
        {
          id:2,
          name:'Mars',
          fuel:80,
          minPrize:200,
          maxPrize:800
        },
        {
          id:3,
          name:'Mercury',
          fuel:160,
          minPrize:400,
          maxPrize:1600
        },
        {
          id:4,
          name:'Venus',
          fuel:320,
          minPrize:800,
          maxPrize:3200
        },
        {
          id:5,
          name:'Jupiter',
          fuel:640,
          minPrize:1600,
          maxPrize:6400
        },
        {
          id:6,
          name:'Saturn',
          fuel:1280,
          minPrize:3200,
          maxPrize:12800
        },
        {
          id:7,
          name:'Uranus',
          fuel:2560,
          minPrize:6400,
          maxPrize:25600
        },
        {
          id:8,
          name:'Uranus',
          fuel:5120,
          minPrize:12800,
          maxPrize:51200
        },
        {
          id:9,
          name:'Sun',
          fuel: 10240,
          minPrize:25600,
          maxPrize:102400
        }
      ]
    }
  }
};

if (
  process.env.NODE_ENV === "production" &&
  fs.existsSync(__dirname + "/config.js")
) {
  //生产环境
  console.log(">>>Use production config!");
} else if (
  process.env.NODE_ENV === "test" &&
  fs.existsSync(__dirname + "/config_test.js")
) {
  //测试环境
  console.log(">>>Use test config!");
  config = Object.assign(config, require("./config_test.js"));
} else if (
  process.env.NODE_ENV === "development" &&
  fs.existsSync(__dirname + "/config_dev.js")
) {
  //开发环境
  config = Object.assign(config, require("./config_dev.js"));
} else {
  config = Object.assign(config, require("./config_dev.js"));
}

module.exports = config;
