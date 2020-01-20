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
    // TronBetRingLogic
    logicAddr: prdCfg.contract.TronBetRingLogic, // 查询状态合约地址
    // TronBetRingOraclize
    oracleAddr: prdCfg.contract.TronBetRingOraclize, // 解决合约地址

    // TronBetRingPvp
    soloOrderAddr: prdCfg.contract.TronBetRingPvp,
    // TronBetRingPvpLogic
    soloLogicAddr: prdCfg.contract.TronBetRingPvpLogic,
    // TronBetRingPvpOraclize
    soloOracleAddr: prdCfg.contract.TronBetRingPvpOraclize,

    startBlockNum: 4424385,

    ACTIVITY_START_TS: 1579046400000, //2019-01-15 08:00:00
    ACTIVITY_END_TS: 1580774400000, //2020-02-04 08:00:00

    WHEEL_MULTI: [50, 5, 2, 3, 2, 3, 2, 3, 2, 5, 2, 5, 2, 3, 2, 3, 2, 3, 2, 5, 2, 5, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 5, 2, 5, 2, 3, 2, 3, 2, 3, 2, 5, 2, 5, 2, 3, 2, 3, 2, 3, 2, 5],

    APP_KEY: 'TRON_BET_WHEEL', //APP_KEY
    RANDOM_SALT_1: 'XfGNDsF0JInUDx!vfkZjttXp4jP4dc^%f', //随机数盐1
    RANDOM_SALT_2: '7y1@&jJvvOk87qbbbfJQ4UymhOVRI4kt', //随机数盐2
    RANDOM_SALT_3: '9N1#s1WTFc01S^#P%', //随机数盐3

    READY_DURATION: 20000, //等待下注事件ms
    MAX_EXIST_TIME: 1800000, //玩家创建房间最长持续时间
    BROADCAST_INTERVAL_TS: 1000, //广播间隔ms
    broadcast_player_info_when_action: true //是否玩家进出推送完整玩家信息列表
  }
};

module.exports = config;
