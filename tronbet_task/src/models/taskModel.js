const db = require('../utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;

async function addTaskLog(round, addr, lv, task_id, need, now, trx, tx_id, conn) {
    let sql = "insert into log_task (round,addr,lv,task_id,need,now,trx,tx_id,send_ts) values (?,?,?,?,?,?,?,?,UNIX_TIMESTAMP());";
    let params = [round, addr, lv, task_id, need, now, trx, tx_id];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

module.exports.addTaskLog = addTaskLog;