const mysql = require('mysql2');
const async = require('async');
const config = require('../configs/config');
const mysqlConfig = config.mysqlConfig;

const pool = mysql.createPool({
    host: mysqlConfig.db_host,
    port: mysqlConfig.db_port,
    database: mysqlConfig.db_name,
    user: mysqlConfig.db_user,
    password: mysqlConfig.db_pwd,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
});

const promisePool = pool.promise();
//建立连接池
function getConnection(callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error('数据库连接失败!');
            console.error(err);
            callback(null);
            return;
        }
        callback(connection);
    });
}

var db = {};

//执行单条sql语句
db.exec = async function (sql, param) {
    let ret = await promisePool.execute(sql, param); 
    return ret[0];
}

db.commit = async function (connection) {
    return new Promise((reslove, reject) => {
        if (connection == null) { return; }
        connection.execute("commit;", [], function (err, result) {
            if (err) {
                return reject(err);
            }
            connection.release();
            return reslove(result);
        });
    });
}

db.rollback = async function (connection) {
    return new Promise((reslove, reject) => {
        if (connection == null) { return; }
        connection.execute("rollback;", [], function (err, result) {
            if (err) {
                return reject(err);
            }
            connection.release();
            return reslove(result);
        });
    });
}

db.execTrans = async function (sql, param, connection) {
    return new Promise((reslove, reject) => {
        if (connection == null) { return; }
        connection.execute(sql, param, function (err, result) {
            if (err) {
                return reject(err);
            }
            return reslove(result);
        });
    });
}

//执行事物
db.execBatch = function (sqlparamsEntities, callback) {
    if (sqlparamsEntities == null || Object.prototype.toString.call(sqlparamsEntities) !== "[object Array]" || sqlparamsEntities.length === 0 ||
        callback == null || Object.prototype.toString.call(callback) !== "[object Function]") {
        throw new Error("execTrans params error!")
    }
    getConnection(function (connection) {
        if (connection) {
            connection.beginTransaction(function (err) {
                if (err) {
                    return;
                }
                var funcAry = [];
                sqlparamsEntities.forEach(function (sql_param) {
                    var temp = function (cb) {
                        var sql = sql_param.sql;
                        var param = sql_param.params;
                        connection.query(sql, param, function (err, result) {
                            if (err) {
                                cb(err, null);
                                return;
                            }
                            cb(null, result);
                        });
                    };
                    funcAry.push(temp);
                });
                async.series(funcAry, function (err, result) {
                    if (err) {
                        connection.rollback(function () {
                            console.error("=====connection.rollback=====");
                            connection.release();
                        });
                        callback(err, null);
                        return;
                    }
                    connection.commit(function (err) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        connection.release();
                        callback(null, result);
                    });
                });
            });
        } else {
            callback('数据库连接失败', null);
        }
    });
}

db.getConnection = () => {
    return new Promise((reslove, reject) => {
        pool.getConnection(async (err, conn) => {
            if (err) {
                console.error(err);
                return reject(null);
            }
            return reslove(conn);
        });
    });
}

module.exports = db;
