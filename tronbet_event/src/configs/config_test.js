const path = require("path");

let prdCfg = {};
try {
  prdCfg = require("/data/tronbet_config/config_test");
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
    startTs: 1579046400000, //2019-01-15 08:00:00
    endTs: 1580774400000, //2020-02-04 08:00:00
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
    // 10 种牌 越来越难得 就是这个逻辑
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

    // 兑换设置 花多少TRX
    // suitPrices: { 3: 9, 5: 10, 7: 60, 10: 300 },
    suitPrices: { 3: 6, 5: 10, 7: 50, 10: 300 },

    // 兑换设置 奖励多少积分  积分是排行榜用的
    suitScore: { 3: 4, 5: 16, 7: 100, 10: 1000 },

    // 出售价格
    // goodPrices: [2.7, 2.7, 2.7, 10, 10, 43, 43, 132, 132, 132],
    goodPrices: [1, 1, 1, 2, 2, 5, 5, 10, 10, 10],

    // 兑换设置 奖励多少抽奖次数
    lottery: { 3: 0, 5: 1, 7: 3, 10: 12 },
    lotteryRate: [
      50000,
      50000,
      400000,
      20000,
      200000,
      10000,
      20000,
      20000,
      20000
    ]
    // lotteryRate: [
    //   40000,
    //   40000,
    //   400000,
    //   20000,
    //   200000,
    //   10000,
    //   20925,
    //   20925,
    //   20925
    // ]
  },

  // 机器人玩家
  robots:[
    "TDMbZZamUSBQxqibxPKKJuLL9uUtoDze9F",
    "TJC2mFUU5KmmG5y2yAfVDNcAcvCEGjTmjN",
    // "TESYBpeWAahPMkQZXSP8Qdvss5YUMj9i5F",
    // "TL5FGa68dFyKBeG16nnrUJ7kqpQUkYMZxz",
    // "TSzTSzkyQncUDuKrUiroaPMkssw9AmzyfM",
    // "TUhrbBhq876hkDQ9oMNt5iPNWcVZrMn1t1",
    // "TXfvi46PaSewZZmhaRZqq1CXjdRHZdsPrb",
    // "TYWGoTKuJeq4faisGjsWB2raCASbhvmAbv",
    // "TJFCPdsqcyF6eGXe5qqAgooKo1RHT7wJ6B",
    // "TKjRw6LjhyoUmTbYjEBa9koo6NuQCxFqDS",
    // "TSdneu1JfZnninXFb9i8eWyJFJYj9dHnJo",
    // "TWpTPFGfaeqzZmSCYMY1FcMuD9mxT1FESd",
    // "TPjKez25464jaWE35gjuepGFTGw7pMdwMe",
    // "TJ41oyccgmLShPXrZLTdR4iPznG1WEjrDu",
    // "TSDMzCk21erbySzu7yygpjBZMY1cXpZMrZ",
    // "TEecHTnDevcYnCwxFAne7qDLHEnGzA4eap",
    // "TMJi7uqEV1uGHKMNMX2kHjwEpSj5o6p1c1",
    // "TJakFvbJPWRYssi1tudp1WYkNijFYiktJo",
    // "TDM84Pnt61PdctkqyaHmBm7yzaPNX1eK4T",
    // "TJjN22dY77zkvqHmS6BgAR3hR8kDekPhCX",
  ],

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
  ]

  // rewards: [
  //   160000,
  //   80000,
  //   40000,
  //   20000,
  //   10000,
  //   7000,
  //   5000,
  //   4000,
  //   3000,
  //   2000,
  //   1000,
  //   1000,
  //   1000,
  //   1000,
  //   1000,
  //   800,
  //   800,
  //   800,
  //   800,
  //   800,
  //   600,
  //   600,
  //   600,
  //   600,
  //   600,
  //   500,
  //   500,
  //   500,
  //   500,
  //   500,
  //   400,
  //   400,
  //   400,
  //   400,
  //   400,
  //   300,
  //   300,
  //   300,
  //   300,
  //   300,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100,
  //   100
  // ]
};

module.exports = config;
