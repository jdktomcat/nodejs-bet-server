const path = require('path');

let config = {
  env: 'development',
  debug: false,
  app: {
    logPath: path.resolve(__dirname, '../../logs'),
    log: true, //开启日志,
    cronExpr: '*/30 * * * *'
  },
  coinmarketcap: {
    coinExchangeUrl: 'https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    headers: { 'X-CMC_PRO_API_KEY': 'c9272840-8820-4a46-9828-5e2f43c9c5ef' }
  },
  mysqlConfig: {
    db_host: '127.0.0.1',
    db_port: '3306',
    db_name: 'tron_price',
    db_user: 'root',
    db_pwd: '123456',
    connectionLimit: 30
  },
  redisConfig: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
    pwd: ''
  }
};

module.exports = config;
