//仅根据开发环境覆盖相应字段即可
const path = require('path');

let config = {
  env: 'development', //开发环境设为development
  debug: true, //开发环境设为true
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志
    init_ts: 1563850800, //初始截止时间戳 2019/7/23 11:00 NEW DICE
    duration: 86400, //每轮有效时间（秒） 86400
    time_out: 1200, //超时时间（秒）
    // TronBetDiceDivider
    dividends_addr: '41aa74b0d0645c842221ac68dc9dc4a4f3db6c6729', //分红合约地址
    // TronBetPool
    pool_addr: '41e5ef1570df5e71434f6bc48d629e6ecd5535672c', //奖池合约地址
    min_pool_trx: 1, //最小分红奖池（单位TRX）
    min_interval_ts: 60, //发奖最小间隔时间(秒)
    pool_save_trx: 10000, //奖池保留1000万TRX
    test_trx: 10, //测试要发送的TRX数量 0:按实际奖池数量发送 ***
    ignore_round_in_db: 0 //忽略数据库中不存在的轮次 ***
  },
  tronConfig: {
    node: {
      master: {
        url_full: 'https://testhttpapi.tronex.io',
        url_solidity: 'https://testhttpapi.tronex.io',
        url_event: 'http://47.252.82.6:8090',
        defaultPk: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07'
      },
      slave: {
        url_full: 'https://testhttpapi.tronex.io',
        url_solidity: 'https://testhttpapi.tronex.io',
        url_event: 'http://47.252.82.6:8090',
        defaultPk: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07'
      }
    },
    IGNORE_SOLIDITY_NODE_SCAN: true, //忽略检测静态节点状态
    SCAN_NODE_INTERVAL: 3100, //node 扫描间隔(ms)
    HTTP_TIME_OUT: 15000 //node http request 超时时间(ms)
  },
  redisConfig: {
    host: '127.0.0.1', //192.169.80.66
    port: 6379,
    db: 0,
    pwd: ''
  },
  mysqlConfig: {
    db_host: '127.0.0.1',
    db_port: '3306',
    db_name: 'tron_bet_wzc', // ***
    db_user: 'root',
    db_pwd: '123456' // *** localhost=!@Q3wa$ESZ lan:123456 wan:
  }
};

module.exports = config;
