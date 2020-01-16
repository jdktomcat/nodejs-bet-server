//仅根据开发环境覆盖相应字段即可
const path = require('path');

let config = {
  env: 'development', //开发环境设为development
  debug: true, //开发环境设为true
  app: {
    websocket_port: 18052,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true //开启日志
  },
  mysqlConfig: {
    db_host: 'localhost',
    db_port: '3306',
    db_name: 'tron_bet_admin',
    db_user: 'root',
    db_pwd: '123456' //!@Q3wa$ESZ
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
        url_full: 'https://testhttpapi.tronex.io', // https://testapi.trondapps.org:8090
        url_solidity: 'https://testhttpapi.tronex.io', // https://testapi.trondapps.org:8091
        url_event: 'http://47.252.82.6:8090/',
        defaultPk: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07'
      },
      slave: {
        url_full: 'https://testhttpapi.tronex.io',
        url_solidity: 'https://testhttpapi.tronex.io',
        url_event: 'http://47.252.82.6:8090/',
        defaultPk: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07'
      }
    },
    IGNORE_SOLIDITY_NODE_SCAN: true, //忽略检测静态节点状态
    SCAN_NODE_INTERVAL: 3100, //node 扫描间隔(ms)
    HTTP_TIME_OUT: 3200 //node http request 超时时间(ms)
  },
  moon: {
    //mainnet 测试合约
    // TronBetMoonOraclize
    orcAddr: '41c96778cfdec72336dbdd01cd5452a3476f2dde06', //随机数合约地址 //4133f2af17d7943354872a4b2a5cfbe4c29eeda827
    // TronBetMoon
    moonAddr: '419044c565120b86ca8231de6604849ab206b261db', //订单合约地址 //41207f236d170aefaf3b21f696d59c814b19fc0640
    // TronBetMoonLogic
    logicAddr: '411a9875b31e8e3ae349b04b1cae95d36dc42326a5', //游戏逻辑合约地址 //41947745306e81ce865143c1607366c61a5fe8bb13

    // orcAddr: '414550aa0a12962df1db1241fce82d3e571306422f', //随机数合约地址
    // moonAddr: '41924c0c33b193b2fe5988128313bcae00e9245f37', //订单合约地址
    // logicAddr: '413575fdcdef7d11028b66b40d441ded6bc4c4afbd', //奖池合约地址

    APP_KEY: 'TRON_BET_MOON', //APP_KEY
    RANDOM_SALT_1: 'XfGNDsF0JInUDx!vUZjttXp4jP4dc^%f', //随机数盐1
    RANDOM_SALT_2: '7y1@&jJvvOk87qbttfJQ4UymhOVRI4kt', //随机数盐2
    RANDOM_SALT_3: '9N1#s1WFc01S^#P%', //随机数盐3

    READY_DURATION: 20000, //等待下注事件ms
    MAX_LOSE: 500000, //每轮游戏最大赔付上限trx => 自动爆点
    MAX_BET: 1000, //单个玩家最大下注金额trx
    MAX_PAYOUT: 11000, //单个玩家最大赔付下注限制trx
    MAX_RATE: 9999, //最大爆点
    BROADCAST_INTERVAL_TS: 100, //广播间隔ms
    broadcast_player_info_when_action: true, //是否玩家进出推送完整玩家信息列表
    check_key: false, //开启玩家数据验证


    ACTIVITY_START_TS: 1579046400000, //2019-01-15 08:00:00
    ACTIVITY_END_TS: 1580774400000, //2020-02-04 08:00:00


    task_bet: 10, //任务投注额要求
    task_2_val: 0, //任务2要求逃脱倍率
    task_5_val: 1, //任务5要求逃脱倍率
    task_8_val: 2 //任务8要求逃脱倍率
  }
};

module.exports = config;
