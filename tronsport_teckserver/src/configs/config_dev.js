const path = require('path');

let config = {
  env: 'development',
  debug: false,
  app: {
    http_port: 18068,
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    withdrawMaxTimes: 100, //每天最大提取次数
    withdrawMaxAmount: 1000000000000, // 每次最大提取数量
    randomSalt: 'hi,can-you-hear-me?',
    RankInitTs: 1555646400,
    userInfoUrl: 'http://3.15.85.91:18050/beter/userOverViewInfo?addr='
  },
  tranStatus: {
    bet: 0, //下注
    refund: 10, // 退款
    cancel: 20, // cancel, 之后不能在有其他操作
    settle: 30, // 完成   之后可以回滚
    rollback: 40, // 回滚  之后可以输赢
    win: 50, // win    之后回滚操作
    lost: 51,
    discard: 53
  },
  mysqlConfig: {
    db_host: 'localhost',
    db_port: '3306',
    db_name: 'tron_live',
    db_user: 'root',
    db_pwd: '123456',
    connectionLimit: 5
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  },
  event:{
    ACTIVITY_START_TS: 1579996800000,//2020-01-26 00:00:00;
    ACTIVITY_END_TS: 1580774400000,//2020-02-04 00:00:00;
  },
  addition:{
    START_TS: 1579996800000,//2020-01-26 00:00:00;
    END_TS: 1580774400000,//2020-02-04 00:00:00;
    RATE: 1.5
  },
  tronConfig: {
    privateKey: 'e50c19fc82723d11d3d5fdbc5b4c69b3617945499600456793070ceafd9c3d07',

    masterFullNode: 'https://testhttpapi.tronex.io',
    masterSolidityNode: 'https://testhttpapi.tronex.io',
    masterEventNode: 'http://47.252.82.6:8090',

    slaveFullNode: 'https://testhttpapi.tronex.io',
    slaveSolidityNode: 'https://testhttpapi.tronex.io',
    slaveEventNode: 'http://47.252.82.6:8090'
  },
  bettech: {
    publicKey: `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAvetrMOTA9BlWTUFb6WeJ
kjKAgaAfmmlzDZuO3tkKtr6cztZerzMU0ElIDS6VUme2bvHaASca1rBeQ6QygqIu
xkLDheSrvcbOEkfjdCWCfmlwBI6JybU7Bk94/z7ooVkLqBmOZ71m9ti5RWfD2Be8
XGeSUQGNn7TW1KiQo2bLLFp8hXezNnnMyeos6rIMwSIqcDIhYu9WsES7ClpMQ12j
QpIePocTbz388j+AezAADZh7w6CqdzVhAFvgEm3LUbbJu9jbfE/mWA0xRG1O2hXU
R9+bka6TuJG+CNZFEtF7VfGtMPMXBNe7IYVXfZ9CGOVCJQeKqIMNqUcYdE5wcpMo
I7eJeo+QAgcnyoP/1CFw/emRjInwO7m6lki4u7mT9RJONzE2ZmNrZr+YvVJo8W2W
KVs2n2+6o4NAybzI2kKTQoHaHD0u3q4lJRXmc5RoBX/tWlXCHms+uwM39YuxC8c1
Gv6U2qJZAfOqieJaq/qQdtql6L1H//d0n0p6nOJrwrf0VHY0sD6NJgTyQSd2EOtw
hcgT20o+1hRfiIXFMJP5j6fAnTl0y+7+5f74XtBOHcb4wva0uHCZNdVf+vuj22ce
ReYpcXq/3g5f8aKjXh9kbTczLyqMtqMbNN0h+FQn7Y9i5rk96nWZB2vg346NcyMN
2N7tcwi1WdJ62RULsL40x2UCAwEAAQ==
-----END PUBLIC KEY-----`
  }
};

module.exports = config;
