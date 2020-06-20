const {redisConfig} = require('../configs/config')

const redis = require("redis").createClient({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.pwd,
    db: redisConfig.db
});

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

/**
 * 获取字符串值
 * @param key 键值
 * @returns {Promise<unknown>}
 */
function get(key) {
    return new Promise((resolve, reject) => {
        redis.get(key, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

/**
 * 设置键值
 * @param key 键
 * @param value 值
 * @returns {Promise<unknown>}
 */
function set(key, value) {
    return new Promise((resolve, reject) => {
        redis.set(key, value, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

/**
 * 左推列表
 *
 * @param key 键
 * @param values 值
 * @returns {Promise<unknown>}
 */
function lpush(key, values) {
    return new Promise((resolve, reject) => {
        redis.lpush(key, values, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

/**
 * 分页查询
 *
 * @param key  列表键
 * @param limit 分页
 * @returns {Promise<unknown>}
 */
function lrange(key, limit) {
    return new Promise((resolve, reject) => {
        redis.lrange(key, 0, limit, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

/**
 * 删除
 * @param key 键
 * @returns {Promise<unknown>}
 */
function redisDel(key) {
    return new Promise((resolve, reject) => {
        redis.del(key, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}


module.exports = {hget, hset, hincrby, hdel, hgetall, redisDel, get, set, lpush, lrange}
