//仅根据开发环境覆盖相应字段即可
const path = require('path');

let config = {
  env: 'development', //开发环境设为development
  debug: true, //开发环境设为true
  app: {
    websocket_port: 18051,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true //开启日志
  },
  mysqlConfig: {
    db_host: '127.0.0.1',
    db_port: '3306',
    // db_name: 'tron_bet_local',
    db_name: 'tron_bet_wzc',
    db_user: 'root',
    db_pwd: '123456' //!@Q3wa$ESZ //
    // db_host: '192.169.80.66',
    // db_port: '3306',
    // db_name: 'tron_bet_wzc',
    // db_user: 'root',
    // db_pwd: '' //!@Q3wa$ESZ //
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
    HTTP_TIME_OUT: 5000 //node http request 超时时间(ms)
  },
  dice: {
    ENABLE_RESOLVE: true, //订单处理功能是否开启
    UNFIRMED_ORDER_RESOLVE: true, //处理未确认订单(预处理/盲处理)
    SCAN_ORDER_FROM__NOW_BLOCK: true, //从最新区块扫描是否有新订单(根据最新区块涉及的下单地址查询订单状态)

    LAN_SUPPORT: ['all', 'sys', 'zh', 'ja', 'ko', 'en', 'ru', 'fr'], //多语言支持
    CHAT_LV_LIMIT: 3, //聊天等级限制

    // TronBetDiceOraclize
    randomContractAddress: '41464569888e0f781954c1e53ebfd0c7e96cb9df4a', //随机数合约地址
    // TronBetDice
    tronBetContractAddress: '41bd0a3cc57f6c51edd08c1b72e4333c306288fbf1', //订单合约地址 //4104df1a8dece928795398dec2fc6e93c0d2d90063
    // TronBetPool
    tronBetPoolContractAddress: '41e5ef1570df5e71434f6bc48d629e6ecd5535672c', //奖池合约地址 //41ab8f1549e7f020e3e746fc92fae11f162baddc0d
    // unused
    redpacketContractAddress: '4169bf9d317ed9e4bd43b2cce067f447badc1f643e', //红包合约地址 //TLdCv2dJL1vet4pisCG8iaiaQDDAjm2ZR6

    // 判断最大最小后端不用
    // TronBetPool20
    pool20Addr: '41cce52f063eef6a4c4ba85776ee4dbe63f1e0183d', //415ba6cc9862019de8ef51b3c30fdbd0e90783c993
    // TronBetDice20
    dice20Addr: '415848423b5b3c929c5d3908a14dc09bd8ffebf4bb', //41881a515e149653b49e23a25730a85cf34f0f2d23
    // TronBetDiceOraclize20
    dice20Orcale: '41f051a83529aa4e7c9fded462b241f11a09121755', //4152adfb402b1dab7817c2dd48cd0c329c3076a4d4

    // WinToken
    trc20_support: {
      // 'TCHm2fJxqHQnH4RGfE6fwdEU5rcMGZCqis':{enable:true,decimal:1e6,name:"ANTE",highroll:200}, //ANTE TCN77KWWyUyi2A4Cu7vrh5dnmRyvUuME1E
      'TLLucBdaZFQxtfHRsMmAfFuKVW8t8LW7tS': { enable: true, decimal: 1e6, name: 'WIN', highroll: 500000 } //WINK TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7
    },

    // TronBetPool10
    pool10Addr: '41cff35088a39046bda516cd4d37142c03f2d417bd',
    // TronBetDice10
    dice10Addr: '41d69abb51f818d6b33bc4ae86385ba998ee5a1294',
    // TronBetDiceOraclize10
    dice10Orcale: '4158aed3be44358d8cd617ced4222cc53128ff39ee',
    trc10_support: {
      1000024: { enable: true, decimal: 1e6, name: 'BTT', highroll: 100000 } //BTT
    },

    FUN_CODE_1: 'GoodLuck(uint256,uint256)',
    FUN_CODE_2: 'WelcomeToTronBet(uint256,uint256,string)',
    FUN_CODE_3: 'RainMake()',

    fee_resolve_max: 10000000,
    fee_do_bet_max: 10000000,
    fee_refund_max: 10000000,

    APP_KEY: 'TRON_BET_DICE', //APP_KEY
    RANDOM_SALT_1: 'MA26Hjc*sjj9YOe8GDMv&ymfBSDaqvC1', //随机数盐1
    RANDOM_SALT_2: 'OrAE@23IGe99JkImEgselyVp9brvyPAO', //随机数盐2
    RANDOM_SALT_3: 'b7A(v31$oP._f8uT',

    HIGH_ROLLER_LIMIT: 5000, //高额赔付门槛(trx)
    RARE_WIN_LIMIT: 19, //高倍赔付门槛

    RESET_PLAYER_DATA_INTERVAL: 75, //登陆重加载玩家数据间隔时间（秒）

    MY_LOGS_CAP: 50,
    LASTEST_CHAT_QUEUE_CAP: 50, //聊天内容列表容量
    TOP_BET_RANK_CAP: 20, //总赔付排行榜容量
    LASTEST_BETS_QUEUE_CAP: 10, //最近下注记录列表容量
    HIGH_ROLLERS_QUEUE_CAP: 10, //高额赔付列表容量
    RARE_WINS_QUEUE_CAP: 10, //高倍赔付列表容量

    week_rank_raward: 700000, //周排名奖金(单位TRX)
    week_rank_start_ts: 1541412000, //周排名统计开始时间 2018/11/5 18:0:0
    week_rank_end_ts: 1541995200, //周排名统计截止时间2018/11/12 12:0:0
    week_rank_reward: [160000, 120000, 80000, 50000, 40000, 30000, 28000, 26000, 24000, 22000, 20000, 18000, 16000, 14000, 12000, 10000, 9000, 8000, 7000, 6000], //周排名排名奖励比列

    RAIN_LV_LIMIT: 7, //红包领取等级限制
    RAIN_MIN_ID: 18, //最小红包ID

    PLAYER_EXPIRE: 90, //玩家空闲TTL（秒）

    OB_ADDR: '',

    // 聊天官方id
    MANAGER_LIST: [{ addr: 'TGKpnHx8RrnmFdJ27Cc4aqV7CH329RqFs5', name: 'Admin_SOON', pwd: 'sam' }, { addr: 'TYGVyrQsqVtTYLBsSGEnH8YX3J88WZKJt1', name: 'Ben_MOD', pwd: 'ben' }, { addr: 'TMUDXGz5n8DgyuKt9Ww6VGg417kh36Jgoh', name: 'Simeon_MOD', pwd: 'simeon' }, { addr: 'TDPNfUMA3Uux6DT3DzoxBLWuUKhNa7bGhY', name: 'Crika_MOD', pwd: 'crika' }],

    ACTIVITY_START_TS: 1577174400000,//2019-12-24 16:00:00;
    ACTIVITY_END_TS: 1577836800000,//2020-01-01 08:00:00;

  },
  task: {
    task_bet: 10, //任务投注额要求
    task_7_val: 50, //任务7连续摇出相同骰子 => 绝对值===0 //50

    top_task_id: 9,
    tasks_config: {
      1: { need: 1, trx: 1 },
      2: { need: 1, trx: 1 },
      3: { need: 1, trx: 1 },
      4: { need: 1, trx: 1 },
      5: { need: 1, trx: 1 },
      6: { need: 1, trx: 1 },
      7: { need: 1, trx: 1 },
      8: { need: 1, trx: 1 },
      9: { need: 1, trx: 1 },
      10: { need: 4, trx: { 1: 1, 15: 1, 20: 1, 25: 44, 30: 56, 35: 68, 40: 80, 45: 92, 50: 104, 55: 116, 60: 128, 65: 140, 70: 152, 75: 164, 80: 176, 85: 188, 90: 200, 95: 212 } },
      11: { need: 7, trx: { 1: 1, 15: 1, 20: 1, 25: 66, 30: 84, 35: 102, 40: 120, 45: 138, 50: 156, 55: 174, 60: 192, 65: 210, 70: 228, 75: 246, 80: 264, 85: 282, 90: 300, 95: 318 } },
      12: { need: 9, trx: { 1: 1, 15: 1, 20: 1, 25: 110, 30: 140, 35: 170, 40: 200, 45: 230, 50: 260, 55: 290, 60: 320, 65: 350, 70: 380, 75: 410, 80: 440, 85: 470, 90: 500, 95: 530 } }
    }
  },
  dice_robot: {
    socket_server: 'http://127.0.0.1:9011',
    mnemonic: 'burger album right book gun another victory inner silk misery stairs swap', //生成机器人的助记词
    default_balance_trx: 200, //默认机器人余额(trx) ***
    min_balance_trx: 10, //最小机器人余额(trx) ***
    profit_rate: 1.5, //机器人盈利上缴（默认余额的倍数）
    robots_count: 1, //机器人个数
    bet_trx_min: 10, //最小下注额
    bet_trx_max: 10, //最大下注额
    number_min: 95, //最小预测值
    number_max: 95, //最大预测值
    direction: 0, //预测方向;0:买小 1:买大 -1:随机
    interval_min: 1000, //最小下注间隔时间ms
    interval_max: 3000 //最大下注间隔时间ms,
  }
};

module.exports = config;
