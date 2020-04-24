
const {redisConfig} = require('../configs/config')

const redis = require("redis").createClient(
    {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.pwd,
        db: redisConfig.db
    }
);

function hget(key, field) {
    return new Promise((resolve, reject) => {
        redis.hget(key, field, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

function hset(key, field, value) {
    return new Promise((resolve, reject) => {
        redis.hset(key, field, value, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

function hincrby(key, field, value) {
    return new Promise((resolve, reject) => {
        redis.hincrby(key, field, value, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

function hdel(key, field) {
    return new Promise((resolve, reject) => {
        redis.hdel(key, field, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

function hgetall(key) {
    return new Promise((resolve, reject) => {
        redis.hgetall(key, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

function redisDel(key) {
    return new Promise((resolve, reject) => {
        redis.del(key, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}


module.exports = {hget, hset, hincrby, hdel, hgetall, redisDel, redis}