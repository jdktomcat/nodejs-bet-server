//仅根据开发环境覆盖相应字段即可
const path = require('path');

let config = {
  env: 'development', //开发环境设为development
  debug: true, //开发环境设为true
  app: {
    websocket_port: 18053,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true //开启日志
  },
  mysqlConfig: {
    db_host: 'localhost',
    db_port: '3306',
    db_name: 'tron_bet_wzc',
    db_user: 'root',
    db_pwd: '123456'
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  tronConfig: {
    // tron_url_full: 'https://api.shasta.trongrid.io', // https://testapi.trondapps.org:8090
    // tron_url_solidity: 'https://api.shasta.trongrid.io', // https://testapi.trondapps.org:8091
    // tron_url_event: 'https://api.shasta.trongrid.io/',
    // tron_url_full: 'http://10.4.24.126:8090', // https://testapi.trondapps.org:8090 ***
    // tron_url_solidity: 'http://10.4.24.126:8091', // https://testapi.trondapps.org:8091 ***
    // tron_url_event: 'https://api.trongrid.io/',

    defaultPk: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07',

    // back_tron_url_full: 'https://api.shasta.trongrid.io', // https://testapi.trondapps.org:8090 ***
    // back_tron_url_solidity: 'https://api.shasta.trongrid.io', // https://testapi.trondapps.org:8091 ***
    // back_tron_url_event: 'https://api.trongrid.io/', // ***
    tron_url_full: 'https://testhttpapi.tronex.io', // https://testapi.trondapps.org:8090 ***
    tron_url_solidity: 'https://testhttpapi.tronex.io', // https://testapi.trondapps.org:8091 ***
    tron_url_event: 'http://47.252.82.6:8090/', // ***

    back_tron_url_full: 'https://testhttpapi.tronex.io', // https://testapi.trondapps.org:8090 ***
    back_tron_url_solidity: 'https://testhttpapi.tronex.io', // https://testapi.trondapps.org:8091 ***
    back_tron_url_event: 'http://47.252.82.6:8090/' // ***
  },
  wheel: {
    // orcAddr : '416515c83499593c1d14e54dca1672d5c551722779', //随机数合约地址
    // moonAddr : '41df718cfb30fc168ca163f2a9ed44b3d329ba3504', //订单合约地址
    // logicAddr : '419cf6d5a6e0ff356e260432016f3afafec0235af9', //奖池合约地址

    // TronBetRingLogic
    logicAddr: '418c25820533915b6aab0c66e6a68fb5093724295d', // 查询状态合约地址
    // TronBetRingOraclize
    oracleAddr: '415c5c069d6cecaaa2ccddae776135cb48700ee3c6', // 解决合约地址

    // TronBetRingPvp
    soloOrderAddr: '410095a7d0c6bb9105dba8a132ef5224e6ed1fb59d',
    // TronBetRingPvpLogic
    soloLogicAddr: '41b35367007851201f3a8b63e818c90b457bdbcd7e',
    // TronBetRingPvpOraclize
    soloOracleAddr: '41208a5d14565df14c07023189fcfbfe3974829d0e',

    startBlockNum: 1614394,
    
    ACTIVITY_START_TS: 1577174400000,//2019-12-24 16:00:00;
    ACTIVITY_END_TS: 1577836800000,//2020-01-01 08:00:00;

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
