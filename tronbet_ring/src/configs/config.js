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
    websocket_port: prdCfg.port.tronbet_ring,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true //开启日志
  },
  mysqlConfig: {
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: 'tron_bet_wzc',
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
    tron_url_full: prdCfg.master_full,
    tron_url_solidity: prdCfg.master_solidity,
    tron_url_event: prdCfg.master_event,

    back_tron_url_full: prdCfg.slave_full,
    back_tron_url_solidity: prdCfg.slave_solidity,
    back_tron_url_event: prdCfg.slave_event,

    defaultPk: prdCfg.operatorDice_pk
  },
  wheel: {
    logicAddr: prdCfg.contract.TronBetRingLogic, // 查询状态合约地址
    oracleAddr: prdCfg.contract.TronBetRingOraclize, // 解决合约地址

    soloOrderAddr: prdCfg.contract.TronBetRingPvp,
    soloLogicAddr: prdCfg.contract.TronBetRingPvpLogic,
    soloOracleAddr: prdCfg.contract.TronBetRingPvpOraclize,

    startBlockNum: 10813882,

    // 2020-06-22 00:00:00
    ACTIVITY_START_TS: 1592755200000,
    // 2020-06-28 23:59:59
    ACTIVITY_END_TS: 1593359999000,

    WHEEL_MULTI: [50, 5, 2, 3, 2, 3, 2, 3, 2, 5, 2, 5, 2, 3, 2, 3, 2, 3, 2, 5, 2, 5, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 5, 2, 5, 2, 3, 2, 3, 2, 3, 2, 5, 2, 5, 2, 3, 2, 3, 2, 3, 2, 5],

    APP_KEY: 'TRON_BET_WHEEL', //APP_KEY
    RANDOM_SALT_1: 'XfGNDsF0JIDDDx!vVkZjttXp4jP4dc^%f', //随机数盐1
    RANDOM_SALT_2: '7y1@&jJvvOk87qbbbBJQ4UymhOVRI4kt', //随机数盐2
    RANDOM_SALT_3: '9N1#s1WTFc11S^#P%', //随机数盐3

    READY_DURATION: 20000, //等待下注事件ms
    MAX_EXIST_TIME: 1800000, //玩家创建房间最长持续时间
    BROADCAST_INTERVAL_TS: 1000, //广播间隔ms
    broadcast_player_info_when_action: true //是否玩家进出推送完整玩家信息列表
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
