const db = require('../common/utilMysql');
const commonEnum = require('../common/commonEnum');
const log4js = require('../configs/log4js.config');
const _ = require('lodash')._;
const loggerDefault = log4js.getLogger('print');
const stringUtil = require('../common/stringUtil');

const REVENUE_OPTYPE = commonEnum.REVENUE_OPTYPE;

const conf = require('../configs/config')


/**
 * 活动开始时间
 * @type {number}
 */
const ACTIVITY_START_TS = conf.event.ACTIVITY_START_TS || 0;

/**
 * 活动结束时间
 * @type {number}
 */
const ACTIVITY_END_TS = conf.event.ACTIVITY_END_TS || 0;

async function addPayOutRetryLog(sysTxID, txID, trxAmount, tableId) {
    try {
        let execRet = await db.exec('INSERT INTO poker_payout_retry_log(sysTxID,txID,trxAmount,tableId,paytime)VALUE(?,?,?,?,UNIX_TIMESTAMP());', [sysTxID, txID, trxAmount, tableId]);
        if (execRet && execRet.affectedRows >= 1) {
            return true
        } else {
            loggerDefault.error("dbService.addPayOutRetryLog error: insert affectedRows err: sysTxID: %s, txID: %s", sysTxID, txID);
            return false
        }
    } catch (e) {
        loggerDefault.error("dbService.addPayOutRetryLog exception:", e);
        return false;
    }
}

async function addConfirmLog(order, oldBalance, newBalance, backAmount, seatNo, gameNo) {
    try {
        let sql = 'INSERT INTO poker_confirm_log(txID,addr,blockId,tableId,trxAmount,oldBalance,newBalance,backAmount,seatNo,gameNo,optime)VALUE(?,?,?,?,?,?,?,?,?,?,UNIX_TIMESTAMP())';
        let sqlRet = await db.exec(sql, [order.txID, order.addr, order.blockId, order.tableId, order.trxAmount, oldBalance, newBalance, backAmount, seatNo, gameNo]);
        if (sqlRet && sqlRet.affectedRows >= 1) {
            sendGameMsg(order.addr, sqlRet.insertId, order.trxAmount)
            return true
        } else {
            loggerDefault.error("dbService.addConfirmLog error, txID: %s", order.txID);
            return false
        }
    } catch (e) {
        loggerDefault.error("dbService.addConfirmLog exception:", e);
        loggerDefault.error("order txID: %s", order.txID);
        return false;
    }
}

async function addPayInLog(order) {
    try {
        let sql = 'INSERT INTO poker_payin_log(txID,addr,tableId,trxAmount,optime)VALUE(?,?,?,?,UNIX_TIMESTAMP())';
        let sqlRet = await db.exec(sql, [order.txID, order.addr, order.tableId, order.trxAmount]);
        if (sqlRet && sqlRet.affectedRows >= 1) {
            return true
        } else {
            loggerDefault.error("dbService.addPayInLog error, txID: %s", order.txID);
            return false
        }
    } catch (e) {
        loggerDefault.error("dbService.addPayInLog exception:", e);
        loggerDefault.error("order txID: %s", order.txID);
        return false;
    }
}

async function addPayOutLog(order) {
    try {
        let sql = 'INSERT INTO poker_payout_log(sysTxID,txID,addr,tableId,trxAmount,optype,optime)VALUE(?,?,?,?,?,?,UNIX_TIMESTAMP())';
        let sqlRet = await db.exec(sql, [order.sysTxID, order.txID, order.addr, order.tableId, order.trxAmount, order.optype || REVENUE_OPTYPE.PAYOUT_UNKONW]);
        if (sqlRet && sqlRet.affectedRows >= 1) {
            return true
        } else {
            loggerDefault.error("dbService.addPayOutLog error, sysTxID: %s, txID: %s", order.sysTxID, order.txID);
            return false
        }
    } catch (e) {
        loggerDefault.error("dbService.addPayOutLog exception:", e);
        loggerDefault.error("order txID: %s", order.txID);
        return false;
    }
}

async function addRevenueLog(addr, tableId, no, amount, oldAmount, newAmount, logtype) {
    if (amount == null || amount === 0) return;
    try {
        amount = Math.abs(amount);
        let sql = 'INSERT INTO poker_revenue_log(addr,tableId,no,amount,oldAmount,newAmount,action,optime)VALUE(?,?,?,?,?,?,?,UNIX_TIMESTAMP())';
        let sqlRet = await db.exec(sql, [addr, tableId, no, amount, oldAmount, newAmount, logtype]);
        if (sqlRet && sqlRet.affectedRows >= 1) {
            return true
        } else {
            loggerDefault.error("dbService.addRevenueLog error, addr: %s, tableId: %s, no: %s, amount: %s[%s->%s], action: %s", addr, tableId, no, amount, oldAmount, newAmount, logtype);
            return false
        }
    } catch (e) {
        loggerDefault.error("dbService.addRevenueLog exception:", e);
        return false;
    }
}

// logArray = [{addr: 'T...', tableId: xxxx, ...}]
async function addRevenueArrayLog(logArray) {
    if (!_.isArray(logArray)) {
        return;
    }
    let sql = 'INSERT INTO poker_revenue_log(addr,tableId,no,amount,oldAmount,newAmount,action,optime) VALUES ?';
    let paramArray = [];
    let optime = stringUtil.getUnixTimeStamp();
    try {
        for (let i = 0; i < logArray.length; ++i) {
            let log = logArray[i];
            let {addr, tableId, no, amount, oldAmount, newAmount, logtype} = log;
            amount = Math.abs(amount);
            if (amount == null || amount === 0) {
                continue;
            }
            paramArray.push([addr, tableId, no, amount, oldAmount, newAmount, logtypelogtype, optime]);
        }
        if (paramArray.length == 0) {
            return true;
        }
        let sqlRet = await db.query(sql, [paramArray]);
        if (sqlRet && sqlRet.affectedRows >= 1) {
            return true
        } else {
            loggerDefault.error("dbService.addRevenueArrayLog error:", logArray);
            return false
        }
    } catch (e) {
        loggerDefault.error("dbService.addRevenueArrayLog exception:", e, logArray);
        return false;
    }
}

/**
 * 发送消息
 *
 * @param addr 钱包地址
 * @param order_id 房间标示
 * @param trxAmount 下注金额
 */
function sendGameMsg(addr, order_id, trxAmount) {
    const _now = _.now();
    if (_now < ACTIVITY_START_TS || _now > ACTIVITY_END_TS) return;
    redisUtils.redis.publish("game_message", JSON.stringify({
        addr: addr,
        order_id: order_id,
        amount: trxAmount,
        game_type: 9
    }));
}

const sqlStatisticsLog = "insert into poker_statistics_log (table_id,table_no,uid,bet,payout,fee,ts) values (?,?,?,?,?,?,UNIX_TIMESTAMP())";

async function saveStatisticsLogs(logs) {
    let conn = null;
    try {
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();
        for (let i = 0; i < logs.length; i++) {
            let log = logs[i];
            await db.execTrans(sqlStatisticsLog, [log.tableId, log.no, log.addr, log.bet, log.payout, log.fee], conn);
        }
        conn.commit();
        conn.release();
    } catch (e) {
        if (conn) {
            conn.rollback();
            conn.release();
        }
        loggerDefault.error("OMG! saveStatisticsLogs --> ROLLBACK!!!", e);
        return false
    }
    return true;
}

const sqlSngLog = "insert into poker_sng_log (table_id,table_no,table_type,sng_rank,uid,table_buyin,player_buyin,payout,ts) values (?,?,?,?,?,?,?,?,UNIX_TIMESTAMP())";

async function saveSNGLogs(data) {
    let conn = null;
    try {
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();

        let table_id = data.tableId;
        let table_no = data.no;
        let total_buyin = data.table_buyin;
        let player_buyin = data.player_buyin;

        let logs = data.rank;

        for (let i = 0; i < logs.length; i++) {
            let log = logs[i];
            await db.execTrans(sqlSngLog, [table_id, table_no, 2, log.rank, log.uid, total_buyin, player_buyin, log.balance], conn);
        }
        conn.commit();
        conn.release();
    } catch (e) {
        if (conn) {
            conn.rollback();
            conn.release();
        }
        loggerDefault.error("OMG! saveSNGLogs --> ROLLBACK!!!", e);
        return false
    }
    return true;
}

module.exports.addPayOutRetryLog = addPayOutRetryLog;
module.exports.addConfirmLog = addConfirmLog;
module.exports.addPayInLog = addPayInLog;
module.exports.addPayOutLog = addPayOutLog;
module.exports.addRevenueLog = addRevenueLog;
module.exports.addRevenueArrayLog = addRevenueArrayLog;
module.exports.saveStatisticsLogs = saveStatisticsLogs;
module.exports.saveSNGLogs = saveSNGLogs;

