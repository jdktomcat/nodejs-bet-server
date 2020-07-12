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
  startBlockNum: 21271165,  //2020-07-07 08:00:48
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

    defaultPk: prdCfg.operatorDice_pk,

    // TronBetDice
    diceOrderAddr: prdCfg.contract.TronBetDice,
    // TronBetRingOraclize
    wheel_oracle_addr: prdCfg.contract.TronBetRingOraclize,
    // TronBetRing
    wheel_bet_addr: prdCfg.contract.TronBetRing,
    // TronBetMoon
    moon_bet_addr: prdCfg.contract.TronBetMoon,
    // TronBetMoonOraclize
    moon_oracle_addr: prdCfg.contract.TronBetMoonOraclize,
    // TronBetRingPvp
    pvp_bet_addr: prdCfg.contract.TronBetRingPvp,
    // TronBetRingPvpOraclize
    pvp_oracle_addr: prdCfg.contract.TronBetRingPvpOraclize,
    // TronBetRingPvpLogic
    pvp_logic_addr: prdCfg.contract.TronBetRingPvpLogic,
    // TronBetDice10
    trc10_bet_addr: prdCfg.contract.TronBetDice10,
    // TronBetDiceOraclize10
    trc10_oracle_addr: prdCfg.contract.TronBetDiceOraclize10,
    // TronBetDice20
    trc20_bet_addr: prdCfg.contract.TronBetDice20,
    // TronBetDiceOraclize20
    trc20_oracle_addr: prdCfg.contract.TronBetDiceOraclize20,
    // TronBetLive
    tron_bet_live: prdCfg.contract.TronBetLive,
    // TronBetLiveDivider
    tron_bet_live_divider: prdCfg.contract.TronBetLiveDivider,
    // TronBetLivePool
    tron_bet_live_pool: prdCfg.contract.TronBetLivePool,
    // TronBetRakeDivider
    tron_bet_rake_divider: prdCfg.contract.TronBetRakeDivider,
    // TronBetTexas
    tron_bet_texas: prdCfg.contract.TronBetTexas,
    // TronBetRakePool
    tron_bet_rake_pool: prdCfg.contract.TronBetRakePool,
    // LivePay
    live_pay: prdCfg.contract.LivePay,
    // USDT
    usdt_address: prdCfg.contract.USDT,
    // USDTPooLOwner
    usdt_pool_owner: prdCfg.contract.USDTPooLOwner,
    // LiveStakingDividend
    live_staking_dividend: prdCfg.contract.LiveStakingDividend,
    // WinPool
    win_pool: prdCfg.contract.WinPool,
    // WinDividend
    win_dividend: prdCfg.contract.WinDividend
  },
  event:{
    // 2020-06-15 00:00:00
    ACTIVITY_START_TS: 1592150400000,
    // 2020-06-16 23:59:59
    ACTIVITY_END_TS: 1592323199000
  }
};

module.exports = config;
