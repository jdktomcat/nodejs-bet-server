const {redisConfig} = require('../configs/config')

/**
 * redis config
 * @type {RedisClient}
 */
const redis = require("redis").createClient({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.pwd,
        db: redisConfig.db
    }
)

module.exports = {redis}
