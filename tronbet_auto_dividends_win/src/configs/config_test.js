//仅根据开发环境覆盖相应字段即可
const path = require('path');

let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config_test');
} catch (error) {
  console.log('using app config');
}

let config = {
  env: 'test', //开发环境设为test
  debug: true, //开发环境设为true
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志
    init_ts: 1545537600, //初始截止时间戳 2018/12/23 12:0:0 NEW DICE
    duration: 86400, //每轮有效时间（秒） 86400
    time_out: 3600, //超时时间（秒）
    // TronBetDividerPlus
    dividends_addr: prdCfg.contract.TronBetDividerPlus, //分红合约地址
    // TronBetPoolPlus
    pool_addr: prdCfg.contract.TronBetPoolPlus, //奖池合约地址
    pool_58addr: prdCfg.contract.TronBetPoolPlusBase58Check, //奖池合约地址
    finance_58addr: prdCfg.financeBase58Check, //财务地址
    min_pool_trx: 1, //最小分红奖池（单位TRX）
    min_interval_ts: 60, //发奖最小间隔时间(秒)
    pool_save_trx: 0, //WIN奖池保留0TRX
    test_trx: 0, //测试要发送的TRX数量 0:按实际奖池数量发送 ***
    ignore_round_in_db: 0 //忽略数据库中不存在的轮次 ***
  },
  tronConfig: {
    node: {
      master: {
        url_full: prdCfg.master_full,
        url_solidity: prdCfg.master_solidity,
        url_event: prdCfg.master_event,
        defaultPk: prdCfg.operatorDice_pk
      },
      slave: {
        url_full: prdCfg.slave_full,
        url_solidity: prdCfg.slave_solidity,
        url_event: prdCfg.slave_event,
        defaultPk: prdCfg.operatorDice_pk
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
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: 'tron_bet_wzc',
    db_user: prdCfg.mysql.user,
    db_pwd: prdCfg.mysql.pwd
  },
  support_trc10_list: {
    // TronBetPool10
    BTT: { tokenID: prdCfg.contract.BttTokenId, tokenName: 'BTT', testRound: 0, decimail: 6, save_token: 20000000, poolAddr: prdCfg.contract.TronBetPool10, awardPK: '' }
  }
};

module.exports = config;
