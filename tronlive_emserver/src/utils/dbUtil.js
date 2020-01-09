const mysql = require('mysql2');
const config = require('../configs/config');
const mysqlConfig = config.mysqlConfig;

const pool = mysql.createPool({
    host: mysqlConfig.db_host,
    port: mysqlConfig.db_port,
    database: mysqlConfig.db_name,
    user: mysqlConfig.db_user,
    password: mysqlConfig.db_pwd,
    waitForConnections: true,
    connectionLimit: mysqlConfig.connectionLimit,
    queueLimit: 0
});

const promisePool = pool.promise();

var db = {};
//执行单条sql语句
db.exec = async function (sql, param) {
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