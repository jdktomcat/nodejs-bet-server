const path = require('path');

let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config_test');
} catch (error) {
  console.log('using app config');
}

let config = {
  env: 'test',
  debug: false,
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    cronExpr: '*/1 * * * *'
  },
  coinmarketcap: {
    coinExchangeUrl: prdCfg.coinmarketcap.coinExchangeUrl,
    headers: prdCfg.coinmarketcap.headers
  },
  mysqlConfig: {
    db_host: prdCfg.mysql.host,
    db_port: prdCfg.mysql.port,
    db_name: 'tron_price',
    db_user: prdCfg.mysql.user,
    db_pwd: prdCfg.mysql.pwd,
    connectionLimit: 2
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  }
};

module.exports = config;
