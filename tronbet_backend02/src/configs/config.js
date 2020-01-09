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
        http_port : prdCfg.port.tronbet_backend02,
        logPath: path.resolve(__dirname, '../../logs'),
        log: true, //开启日志,
        withdrawMaxTimes : 100,   //每天最大提取次数
        withdrawMaxAmount: 1000000000000,   // 每次最大提取数量
        randomSalt : 'hi,can-you-hear-me?',
        RankInitTs : 1555646400,
        rankRate : [
            47.887,
            23.943,
            11.972,
            5.986,
            2.993,
            1.496,
            1.197,
            0.958,
            0.766,
            0.613,
            0.490,
            0.392,
            0.314,
            0.251,
            0.201,
            0.161,
            0.129,
            0.103,
            0.082,
            0.066,
        ]
    },
    mysqlConfig: {
        read_db_host: prdCfg.mysql.read_db_host,
        db_host: prdCfg.mysql.host,
        db_host2: prdCfg.mysql.host,
        db_port: '3306',
        db_name: 'tron_bet_admin',
        db_name2: 'tron_live',
        db_user: prdCfg.mysql.user,
        db_pwd: prdCfg.mysql.pwd,
        connectionLimit : 10,
    },
    redisConfig: {
        host: '127.0.0.1',
        port: 6379,
        db: 1,
        pwd: ''
    },
    tronConfig: {
        privateKey : '11111111111111111111111111',

        withdrawAddr : prdCfg.contract.TronBetLive,
        livePoolAddr : prdCfg.contract.TronBetLivePool,

        masterFullNode: prdCfg.master_full,
        masterSolidityNode: prdCfg.master_solidity,
        masterEventNode: prdCfg.master_event,

        slaveFullNode: prdCfg.slave_full,
        slaveSolidityNode: prdCfg.slave_solidity,
        slaveEventNode: prdCfg.slave_event
    },
    EveryMatrix: {
        LoginName: prdCfg.EveryMatrix.LoginName,
        Password: prdCfg.EveryMatrix.Password
    }
}

config.liveUrl = "http://localhost:18066"
if (process.env.NODE_ENV === 'production' && fs.existsSync(__dirname + '/config.js')) {
    //生产环境
    console.log('>>>Use production config!');
    config.liveUrl = "https://pro-live.wink.org"
} else if (process.env.NODE_ENV === 'test' && fs.existsSync(__dirname + '/config_test.js')) {
    //测试环境
    config = Object.assign(config, require('./config_test.js'));
} else if (process.env.NODE_ENV === 'development' && fs.existsSync(__dirname + '/config_dev.js')) {
    //开发环境
    config = Object.assign(config, require('./config_dev.js'));
} else {
    config = Object.assign(config, require('./config_dev.js'));
}

module.exports = config;
