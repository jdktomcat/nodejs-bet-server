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
    connectionLimit: 10,
    // queueLimit: 0
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
    // getConnection(function (connection) {
    //     if (connection) {
    //         connection.execute(sql, param, function (err, result) {
    //             if (err) {
    //                 console.error(err);
    //                 callback(err, null);
    //                 return;
    //             }
    //             callback(null, result);
    //         });
    //         connection.release();
    //     } else {
    //         callback('数据库连接失败', null);
    //     }
    // });


    let ret = await promisePool.execute(sql, param); //return [rows, fields]; [0]=>rows
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
    //print(Object.prototype.toString.call(sqlparamsEntities), Object.prototype.toString.call(callback));
    if (sqlparamsEntities == null || Object.prototype.toString.call(sqlparamsEntities) !== "[object Array]" || sqlparamsEntities.length === 0 ||
        callback == null || Object.prototype.toString.call(callback) !== "[object Function]") {
        throw new Error("execTrans params error!")
    }
    getConnection(function (connection) {
        if (connection) {
            connection.beginTransaction(function (err) {
                if (err) {
                    //console.error(err);
                    return;
                }
                var funcAry = [];
                sqlparamsEntities.forEach(function (sql_param) {
                    var temp = function (cb) {
                        var sql = sql_param.sql;
                        var param = sql_param.params;
                        connection.query(sql, param, function (err, result) {
                            if (err) {
                                //console.error(err);
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
                            console.error("connection.rollback！！！！！！！！！！！！！！！！！！！");
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

async function test() {
    // let ret = await db.exec('select * from user_info_new limit 2', null);
    // print(ret);

    let sql1 = {
        sql: 'INSERT INTO log_dice(order_id) VALUES (?)',
        params: [1]
    }
    let sql2 = {
        sql: 'INSERT INTO log_dice(order_id) VALUES (?)',
        params: [2]
    }
    let sql3 = {
        sql: 'INSERT INTO log_dice(order_id) VALUES (?)',
        params: [3]
    }
    let sqlArr = [];
    sqlArr.push(sql1);
    sqlArr.push(sql2);
    sqlArr.push(sql3);
    db.execBatch(sqlArr, (err, result) => { console.log(err); console.log(result) });


    // pool.getConnection(async (err, conn) => {
    //     //print(conn);
    //     conn.beginTransaction();
    //     try {
    //         let ret1 = await db.execTrans('INSERT INTO log_dice(order_id) VALUES (?)', [1], conn);
    //         console.log(ret1);
    //         throw new Error();
    //         let ret2 = await db.execTrans('INSERT INTO log_dice(order_id) VALUES (?)', [2], conn);
    //         console.log(ret2);
    //         conn.commit();
    //     } catch (error) {
    //         console.error("OMG! ROLLBACK!!!", error)
    //         conn.rollback();
    //     }
    // });
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

// test();
module.exports = db;