const fs = require('fs');
let prdCfg = {};
try {
    prdCfg = require('/data/tronbet_config/config');
} catch (error) {
    console.log('using app config');
}
if(process.env.NODE_ENV === 'test'){
    prdCfg.port.tronbet_live_wallet = 18074
}
let config = {
    env: 'production',
    debug: false,
    app: {
        http_port : prdCfg.port.tronbet_live_wallet,
    },
    mysqlConfig: {
        db_host: prdCfg.mysql.host,
        db_port: prdCfg.mysql.port,
        db_name: 'tron_live',
        db_user: prdCfg.mysql.user,
        db_pwd: prdCfg.mysql.pwd,
        connectionLimit: 30
    },
    redisConfig: {
        host: '127.0.0.1',
        port: 6379,
        db: 1,
        pwd: ''
    },
}

if (process.env.NODE_ENV === 'production' && fs.existsSync(__dirname + '/config.js')) {
    //生产环境
    console.log('>>>Use production config!');
} else if (process.env.NODE_ENV === 'test' && fs.existsSync(__dirname + '/config_test.js')) {
    //测试环境
    config = Object.assign(config, require('./config_test.js'));
}

module.exports = config;
