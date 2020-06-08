const path = require("path");

let prdCfg = {};
try {
  prdCfg = require("/Users/sid.tang/workspace/work-project/wink/nodejs-bet-server/tronbet_config/config_test");
} catch (error) {
  console.log("using app config");
}

let config = {
  env: "dev",
  debug: false,
  app: {
    http_port: 8370,
    logPath: path.resolve(__dirname, "../../logs"),
    log: true, //开启日志,
    startTs: 1579996800000, //2019-01-26 00:00:00
    endTs: 1580774400000, //2020-02-04 00:00:00
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
    // 这个需要确认
    // 发奖的私钥
    privateKey: prdCfg.operatorDice_pk,
    // 发奖的私钥 对应的公钥
    payPKHex: "TYmLSP22fzNNHozSXN6ANQF97zp8rhRP7K",

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
    suitPrices: { 3: 9, 5: 10, 7: 60, 10: 300 },
    suitScore: { 3: 4, 5: 16, 7: 100, 10: 1000 },
    goodPrices: [2.7, 2.7, 2.7, 10, 10, 43, 43, 132, 132, 132],
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
  rewards: [
    160000,
    80000,
    40000,
    20000,
    10000,
    7000,
    5000,
    4000,
    3000,
    2000,
    1000,
    1000,
    1000,
    1000,
    1000,
    800,
    800,
    800,
    800,
    800,
    600,
    600,
    600,
    600,
    600,
    500,
    500,
    500,
    500,
    500,
    400,
    400,
    400,
    400,
    400,
    300,
    300,
    300,
    300,
    300,
    100,
    100,
    100,
    100,
    100,
    100,
    100,
    100,
    100,
    100
  ],
  activity:{
    championship: {
      startTime:'2020-06-15 00:00:00',
      endTime:'2020-06-24 23:59:59',
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

module.exports = config;
