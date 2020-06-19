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
    websocket_port: prdCfg.port.tronbet_moon,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true //开启日志
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
    db: 1,
    pwd: ''
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
    HTTP_TIME_OUT: 6300 //node http request 超时时间(ms)
  },
  moon: {
    orcAddr: prdCfg.contract.TronBetMoonOraclize, //随机数合约地址
    moonAddr: prdCfg.contract.TronBetMoon, //订单合约地址
    logicAddr: prdCfg.contract.TronBetMoonLogic, //游戏逻辑合约地址

    APP_KEY: 'TRON_BET_MOON', //APP_KEY
    RANDOM_SALT_1: 'XfGNDsF0JInUDx!vUZjRtXp4jP4dc^%f', //随机数盐1
    RANDOM_SALT_2: '7y1@&jJvvOk87qbtBfJQ4UymhOVRI4kt', //随机数盐2
    RANDOM_SALT_3: '9N1#s1WFD01S^#P%', //随机数盐3

    READY_DURATION: 20000, //等待下注事件ms
    MAX_LOSE: 2000000, //每轮游戏最大赔付上限trx => 自动爆点
    MAX_BET: 20000, //单个玩家最大下注金额trx
    MAX_PAYOUT: 220000, //单个玩家最大赔付下注限制trx
    MAX_RATE: 9999, //最大爆点
    BROADCAST_INTERVAL_TS: 100, //广播间隔ms
    broadcast_player_info_when_action: true, //是否玩家进出推送完整玩家信息列表
    check_key: false, //开启玩家数据验证

    // 2020-06-22 00:00:00
    ACTIVITY_START_TS: 1592755200000,
    // 2020-06-28 23:59:59
    ACTIVITY_END_TS: 1593359999000,

    task_bet: 100, //任务投注额要求
    task_2_val: 0, //任务2要求逃脱倍率
    task_5_val: 2, //任务5要求逃脱倍率
    task_8_val: 5 //任务8要求逃脱倍率
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
