const mysql = require('mysql2');
let pool;
let promisePool;
let db = {};
db.init = async function(config){
	pool = mysql.createPool({
	    host:config.mysql['host'],
	    port:config.mysql['port'],
	    database:'tron_live_new',
	    user: config.mysql['user'],
	    password:config.mysql['pwd'],
	    waitForConnections: true,
	    connectionLimit: 100,
	    queueLimit: 0
	});
	promisePool = pool.promise();
}


//执行单条sql语句
db.exec = async function (sql, param) {
    let ret = await promisePool.execute(sql, param); //return [rows, fields]; [0]=>rows
    return ret[0];
}

/*
    执行查询where in(?) [[]], 使用array 替换？
 */
db.query = async function (sql, param) {
    let ret = await promisePool.query(sql, param);
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

module.exports = db;
