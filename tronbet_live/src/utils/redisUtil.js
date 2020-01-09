
const {redisConfig} = require('../configs/config')
const Redis = require('ioredis')

let redis = new Redis({
  port: redisConfig.port,          // Redis port
  host: redisConfig.host,   // Redis host
  family: 4,           // 4 (IPv4) or 6 (IPv6)
  password: redisConfig.pwd,
  db: redisConfig.db
})

module.exports = redis