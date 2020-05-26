let config = {
    env: 'test',
    debug: false,
    mysqlConfig: {
        db_host: 'localhost',
        db_port: '3306',
        db_name: 'tron_live',
        db_user: 'root',
        db_pwd: '123456',
        connectionLimit : 5,
    },
    redisConfig: {
        host: '127.0.0.1',
        port: 6379,
        db: 1,
        pwd: 'tronbet_201811'
    },
}

module.exports = config;
