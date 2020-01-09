const db = require('../utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;

async function addRainLog(rain_id,sender,total_sun,count,send_ts,receiver,no,amount,tx_id, conn) {
    let sql = "insert into log_rain (rain_id,sender,total_sun,count,send_ts,receiver,no,amount,receive_ts,tx_id) values (?,?,?,?,?,?,?,?,UNIX_TIMESTAMP(),?);";
    let params = [rain_id,sender,total_sun,count,send_ts,receiver,no,amount,tx_id];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

module.exports.addRainLog = addRainLog;