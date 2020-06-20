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
  startBlockNum: 10804727,
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志
    clearLog: true //启动日志清理
  },
  mysqlConfig: {
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: 'tron_bet_admin',
    db_user: prdCfg.mysql.user,
    db_pwd: prdCfg.mysql.pwd
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    pwd: ''
  },
  tronConfig: {
    tron_url_full: prdCfg.tron_url_full,
    tron_url_solidity: prdCfg.tron_url_solidity,
    tron_url_event: prdCfg.tron_url_event,

    back_tron_url_full: prdCfg.back_tron_url_full,
    back_tron_url_solidity: prdCfg.back_tron_url_solidity,
    back_tron_url_event: prdCfg.back_tron_url_event,

    // tron_url_full: "https://httpapi.tronex.io",
    // tron_url_solidity: "https://httpapi.tronex.io",
    // tron_url_event: "https://api.trongrid.io",

    // back_tron_url_full: "https://httpapi.tronex.io",
    // back_tron_url_solidity: "https://httpapi.tronex.io",
    // back_tron_url_event: "https://api.trongrid.io",

    defaultPk: prdCfg.operatorDice_pk,

    diceOrderAddr: prdCfg.contract.TronBetDice,
    wheel_oracle_addr: prdCfg.contract.TronBetRingOraclize,
    wheel_bet_addr: prdCfg.contract.TronBetRing,
    moon_bet_addr: prdCfg.contract.TronBetMoon,
    moon_oracle_addr: prdCfg.contract.TronBetMoonOraclize,
    pvp_bet_addr: prdCfg.contract.TronBetRingPvp,
    pvp_oracle_addr: prdCfg.contract.TronBetRingPvpOraclize,
    pvp_logic_addr: prdCfg.contract.TronBetRingPvpLogic,
    trc10_bet_addr: prdCfg.contract.TronBetDice10,
    trc10_oracle_addr: prdCfg.contract.TronBetDiceOraclize10,
    trc20_bet_addr: prdCfg.contract.TronBetDice20,
    trc20_oracle_addr: prdCfg.contract.TronBetDiceOraclize20,

    tron_bet_live: prdCfg.contract.TronBetLive,
    tron_bet_live_divider: prdCfg.contract.TronBetLiveDivider,
    tron_bet_live_pool: prdCfg.contract.TronBetLivePool,

    tron_bet_rake_divider: prdCfg.contract.TronBetRakeDivider,
    tron_bet_texas: prdCfg.contract.TronBetTexas,
    tron_bet_rake_pool: prdCfg.contract.TronBetRakePool,

    live_pay: prdCfg.contract.LivePay,
    usdt_address: prdCfg.contract.USDT,
    usdt_pool_owner: prdCfg.contract.USDTPooLOwner,
    live_staking_dividend: prdCfg.contract.LiveStakingDividend,
    win_pool: prdCfg.contract.WinPool,
    win_dividend: prdCfg.contract.WinDividend
  },
  event:{
    // 2020-06-22 00:00:00
    ACTIVITY_START_TS: 1592582400000,
    // 2020-06-28 23:59:59
    ACTIVITY_END_TS: 1593359999000
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
