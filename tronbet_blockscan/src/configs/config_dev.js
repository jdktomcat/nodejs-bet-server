const path = require('path');

let config = {
  env: 'development',
  debug: false,
  startBlockNum: 1614394,
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志
    clearLog: true //启动日志清理
  },
  mysqlConfig: {
    db_host: '127.0.0.1',
    db_port: '3306',
    db_name: 'tron_bet_admin',
    db_user: 'root',
    db_pwd: '123456'
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    pwd: ''
  },
  tronConfig: {
    tron_url_full: 'https://testhttpapi.tronex.io',
    tron_url_solidity: 'https://testhttpapi.tronex.io',
    tron_url_event: 'http://47.252.82.6:8090',

    back_tron_url_full: 'https://testhttpapi.tronex.io',
    back_tron_url_solidity: 'https://testhttpapi.tronex.io',
    back_tron_url_event: 'http://47.252.82.6:8090',

    defaultPk: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07', // ***

    // TronBetDice
    diceOrderAddr: '41bd0a3cc57f6c51edd08c1b72e4333c306288fbf1',
    // TronBetRingOraclize
    wheel_oracle_addr: '41464569888e0f781954c1e53ebfd0c7e96cb9df4a',
    // TronBetRing
    wheel_bet_addr: '41a0bed839386152daffe21f4c6daa7e3cbfdfc1a4',
    // TronBetMoon
    moon_bet_addr: '419044c565120b86ca8231de6604849ab206b261db',
    // TronBetMoonOraclize
    moon_oracle_addr: '41c96778cfdec72336dbdd01cd5452a3476f2dde06',
    // TronBetRingPvp
    pvp_bet_addr: '410095a7d0c6bb9105dba8a132ef5224e6ed1fb59d',
    // TronBetRingPvpOraclize
    pvp_oracle_addr: '41208a5d14565df14c07023189fcfbfe3974829d0e',
    // TronBetRingPvpLogic
    pvp_logic_addr: '41b35367007851201f3a8b63e818c90b457bdbcd7e',
    // TronBetDice10
    trc10_bet_addr: '41d69abb51f818d6b33bc4ae86385ba998ee5a1294',
    // TronBetDiceOraclize10
    trc10_oracle_addr: '4158aed3be44358d8cd617ced4222cc53128ff39ee',
    // TronBetLive
    tron_bet_live: '416035c6d3723b3073f2c381bcccf8a997f74aa05c',
    // TronBetLiveDivider
    tron_bet_live_divider: '41b84815fdd92da940d9ecdf66f28bd94061dca43e',
    // TronBetLivePool
    tron_bet_live_pool: '41fc340e8f198cd9297538f2383e16d7e301378875',
    // TronBetRakeDivider
    tron_bet_rake_divider: '41c02630221c91f8060c0d4c2474263bde878f53e7',
    // TronBetTexas
    tron_bet_texas: '41c1a21b142985de7c30350639db23cffc9705d4ac',
    // TronBetRakePool
    tron_bet_rake_pool: '4105d275888d859f2a897668d83f1584e4ec00f789',
    live_pay: '',
    usdt_address: '',
    usdt_pool_owner: '',
    live_staking_dividend: '',
    win_pool: '',
    win_dividend: ''
  },
  event:{
    // 2020-06-15 00:00:00
    ACTIVITY_START_TS: 1592150400000,
    // 2020-06-16 23:59:59
    ACTIVITY_END_TS: 1592323199000
  }
};

module.exports = config;
