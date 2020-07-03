
const {redisConfig} = require('../configs/config')

const redis = require("redis").createClient(
    {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.pwd,
        db: redisConfig.db
    }
);


module.exports = redis