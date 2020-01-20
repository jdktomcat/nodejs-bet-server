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
    websocket_port: prdCfg.port.tronbet_dice,
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
    HTTP_TIME_OUT: 5000 //node http request 超时时间(ms)
  },
  dice: {
    ENABLE_RESOLVE: true, //订单处理功能是否开启
    UNFIRMED_ORDER_RESOLVE: true, //处理未确认订单(预处理/盲处理)
    SCAN_ORDER_FROM__NOW_BLOCK: true, //从最新区块扫描是否有新订单(根据最新区块涉及的下单地址查询订单状态)

    LAN_SUPPORT: ['all', 'sys', 'zh', 'ja', 'ko', 'en', 'ru', 'fr'], //多语言支持
    CHAT_LV_LIMIT: 3, //聊天等级限制

    randomContractAddress: prdCfg.contract.TronBetDiceOraclize, //随机数合约地址
    tronBetContractAddress: prdCfg.contract.TronBetDice, //订单合约地址
    tronBetPoolContractAddress: prdCfg.contract.TronBetPool, //奖池合约地址
    redpacketContractAddress: prdCfg.contract.Useless, //红包合约地址

    pool20Addr: prdCfg.contract.TronBetPool20,
    dice20Addr: prdCfg.contract.TronBetDice20,
    dice20Orcale: prdCfg.contract.TronBetDiceOraclize20,

    // WinToken
    trc20_support: {},

    pool10Addr: prdCfg.contract.TronBetPool10,
    dice10Addr: prdCfg.contract.TronBetDice10,
    dice10Orcale: prdCfg.contract.TronBetDiceOraclize10,

    trc10_support: {},

    FUN_CODE_1: 'GoodLuck(uint256,uint256)',
    FUN_CODE_2: 'WelcomeToTronBet(uint256,uint256,string)',
    FUN_CODE_3: 'RainMake()',

    fee_resolve_max: 10000000,
    fee_do_bet_max: 10000000,
    fee_refund_max: 10000000,

    APP_KEY: 'TRON_BET_DICE', //APP_KEY
    RANDOM_SALT_1: 'NA26Hjc*sjj9YOe8GDMv&ymfBDDaqvC1', //随机数盐1
    RANDOM_SALT_2: 'OrAE@23IGe99JkImEgselyVD9brvyPAO', //随机数盐2
    RANDOM_SALT_3: 'b7A(v21$oP._f8uT',

    HIGH_ROLLER_LIMIT: 5000, //高额赔付门槛(trx)
    RARE_WIN_LIMIT: 19, //高倍赔付门槛

    RESET_PLAYER_DATA_INTERVAL: 75, //登陆重加载玩家数据间隔时间（秒）

    MY_LOGS_CAP: 50,
    LASTEST_CHAT_QUEUE_CAP: 50, //聊天内容列表容量
    TOP_BET_RANK_CAP: 20, //总赔付排行榜容量
    LASTEST_BETS_QUEUE_CAP: 50, //最近下注记录列表容量
    HIGH_ROLLERS_QUEUE_CAP: 50, //高额赔付列表容量
    RARE_WINS_QUEUE_CAP: 50, //高倍赔付列表容量

    week_rank_raward: 700000, //周排名奖金(单位TRX)
    week_rank_start_ts: 1541412000, //周排名统计开始时间 2018/11/5 18:0:0
    week_rank_end_ts: 1541995200, //周排名统计截止时间2018/11/12 12:0:0
    week_rank_reward: [160000, 120000, 80000, 50000, 40000, 30000, 28000, 26000, 24000, 22000, 20000, 18000, 16000, 14000, 12000, 10000, 9000, 8000, 7000, 6000], //周排名排名奖励比列

    RAIN_LV_LIMIT: 7, //红包领取等级限制
    RAIN_MIN_ID: 18, //最小红包ID

    PLAYER_EXPIRE: 90, //玩家空闲TTL（秒）

    OB_ADDR: '',

    MANAGER_LIST: [{ addr: 'TGKpnHx8RrnmFdJ27Cc4aqV7CH329RqFs5', name: 'Admin_SOON', pwd: 'sam', img: 20001 }, { addr: 'TYGVyrQsqVtTYLBsSGEnH8YX3J88WZKJt1', name: 'Ben_MOD', pwd: 'ben', img: 20002 }, { addr: 'TMUDXGz5n8DgyuKt9Ww6VGg417kh36Jgoh', name: 'Simeon_MOD', pwd: 'simeon' }, { addr: 'TDPNfUMA3Uux6DT3DzoxBLWuUKhNa7bGhY', name: 'Crika_MOD', pwd: 'crika' }],

    ACTIVITY_START_TS: 1577174400000,//2019-12-24 16:00:00;
    ACTIVITY_END_TS: 1577836800000,//2020-01-01 08:00:00;

  },
  task: {
    task_bet: 100, //任务投注额要求
    task_7_val: 0, //任务7连续摇出相同骰子 => 绝对值===0

    top_task_id: 9,
    tasks_config: {
      1: { need: 30, trx: 10 },
      2: { need: 30, trx: 10 },
      3: { need: 20, trx: 15 },
      4: { need: 20, trx: 15 },
      5: { need: 20, trx: 15 },
      6: { need: 10, trx: 15 },
      7: { need: 1, trx: 30 },
      8: { need: 5, trx: 25 },
      9: { need: 5, trx: 25 },
      10: {
        need: 4,
        trx: {
          15: 20,
          20: 32,
          25: 44,
          30: 56,
          35: 68,
          40: 80,
          45: 92,
          50: 104,
          55: 116,
          60: 128,
          65: 140,
          70: 152,
          75: 164,
          80: 176,
          85: 188,
          90: 200,
          95: 212
        }
      },
      11: {
        need: 7,
        trx: {
          15: 30,
          20: 48,
          25: 66,
          30: 84,
          35: 102,
          40: 120,
          45: 138,
          50: 156,
          55: 174,
          60: 192,
          65: 210,
          70: 228,
          75: 246,
          80: 264,
          85: 282,
          90: 300,
          95: 318
        }
      },
      12: {
        need: 9,
        trx: {
          15: 50,
          20: 80,
          25: 110,
          30: 140,
          35: 170,
          40: 200,
          45: 230,
          50: 260,
          55: 290,
          60: 320,
          65: 350,
          70: 380,
          75: 410,
          80: 440,
          85: 470,
          90: 500,
          95: 530
        }
      }
    }
  },
  dice_robot: {
    socket_server: 'http://127.0.0.1:8011',
    mnemonic: 'host portion drop satisfy fish reflect true avoid before divide quality neutral', //生成机器人的助记词
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

config.dice.trc20_support[prdCfg.contract.WinTokenBase58Check] = { enable: true, decimal: 1e6, name: 'WIN', highroll: 500000 };
config.dice.trc10_support[prdCfg.contract.BttTokenId] = { enable: true, decimal: 1e6, name: 'BTT', highroll: 100000 };

module.exports = config;
