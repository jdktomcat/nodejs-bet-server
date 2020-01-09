//仅根据开发环境覆盖相应字段即可
const path = require('path');

let config = {
  env: 'development', //开发环境设为development
  debug: true, //开发环境设为true
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志
    clearLog: true //启动日志清理
  },
  mysqlConfig: {
    db_host: '127.0.0.1',
    db_port: '3306',
    db_name: 'tron_bet_wzc', // ***
    db_user: 'root',
    db_pwd: '123456' // *** localhost=!@Q3wa$ESZ lan:123456 wan:
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

    beginBlockNumber: 1614394,
    //TVkNuE1BYxECWq85d8UR9zsv6WppBns9iH
    // TronBetDiceOraclize
    RANDOM_CONTRACT_ADDRESS: '41464569888e0f781954c1e53ebfd0c7e96cb9df4a',
    //v3:TEEXEWrkMFKapSMJ6mErg39ELFKDqEs6w3 v2:TJZUQ7ZGPVy7pC2QXc5oZjr7wBgu6tX44e v1:TSpSmXD61aKrVJAeCKMUxJJdr5jHQo9XC2
    // TronBetDice
    TRON_BET_CONTRACT_ADDRESS: ['41bd0a3cc57f6c51edd08c1b72e4333c306288fbf1'], //用来判断dice事件版本
    // TronBetDiceDivider
    DICE_DIVIDENDS_CONTRACT_ADDRESS: '41aa74b0d0645c842221ac68dc9dc4a4f3db6c6729', //dice分红合约地址
    // TronBetDividerPlus
    WIN_DIVIDENDS_CONTRACT_ADDRESS: '41d62d73db3c046df77484938506797665024f215b' //win分红合约地址
  }
};

module.exports = config;
