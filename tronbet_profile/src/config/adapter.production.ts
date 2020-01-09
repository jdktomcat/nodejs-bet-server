const redisCache = require('think-cache-redis');
const nunjucks = require('think-view-nunjucks');
const fileSession = require('think-session-file');
const mysql = require('think-model-mysql');
const JWTSession = require('think-session-jwt');
const path = require('path');
import { think } from 'thinkjs';
const isDev = think.env === 'development';

let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config');
} catch (error) {
  console.log('using app config');
}

/**
 * cache adapter config
 * @type {Object}
 */
exports.cache = {
  type: 'redis',
  common: {
    timeout: 24 * 3600 * 1000 // millisecond
  },
  redis: {
    handle: redisCache,
    port: 6379,
    host: '127.0.0.1',
    password: ''
  }
};

/**
 * model adapter config
 * @type {Object}
 */
exports.model = {
  type: 'mysql',
  common: {
    logConnect: isDev,
    logSql: isDev,
    logger: (msg: string) => think.logger.info(msg)
  },
  mysql: {
    handle: mysql,
    database: 'tron_bet_admin',
    prefix: '',
    encoding: 'utf8',
    host: prdCfg.mysql.host,
    port: prdCfg.mysql.port,
    user: prdCfg.mysql.user,
    password: prdCfg.mysql.pwd,
    dateStrings: true,
    connectionLimit: 5,
    pageSize: 20
  },
  mysql2: {
    handle: mysql,
    database: 'tron_bet_wzc',
    prefix: '',
    encoding: 'utf8',
    host: prdCfg.mysql.host,
    port: prdCfg.mysql.port,
    user: prdCfg.mysql.user,
    password: prdCfg.mysql.pwd,
    connectionLimit: 5,
    dateStrings: true,
    pageSize: 20
  }
};

/**
 * session adapter config
 * @type {Object}
 */
exports.session = {
  type: 'jwt',
  common: {
    cookie: {
      name: 'thinkjs'
    }
  },
  jwt: {
    handle: JWTSession,
    secret: 'thisistronbetsssss', // secret is reqired
    tokenType: 'cookie', // ['query', 'body', 'header', 'cookie'], 'cookie' is default
    tokenName: 'jwt', // if tokenType not 'cookie', this will be token name, 'jwt' is default
    sign: {
      // sign options is not required
    },
    verify: {
      // verify options is not required
    }
  }
};

/**
 * view adapter config
 * @type {Object}
 */
exports.view = {
  type: 'nunjucks',
  common: {
    viewPath: path.join(think.ROOT_PATH, 'view'),
    sep: '_',
    extname: '.html'
  },
  nunjucks: {
    handle: nunjucks
  }
};
