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

let db = {};
//执行单条sql语句
db.exec = async function (sql, param) {
    console.log("excute sql is: ",sql)
    console.log("excute params is: ",param)
    let ret = await promisePool.execute(sql, param); //return [rows, fields]; [0]=>rows
    return ret[0];
}

const rawQuery = async function (sql, params) {
    return await db.exec(sql, params)
}

module.exports = rawQuery;