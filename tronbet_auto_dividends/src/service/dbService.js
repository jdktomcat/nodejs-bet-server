const db = require('../utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;

async function getPreRoundInfo(_ver, conn) {
    let sql = "select * from dice_ver_v1 where ver = ? limit 1;"
    let params = [_ver];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    // console.log(ret[0]);
    return ret ? ret[0] : null;
}

async function getLastestRoundInfo(conn) {
    let sql = "select * from dice_ver_v1 order by ver desc limit 1;"
    let params = [];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    // console.log(ret[0]);
    return ret ? ret[0] : null;
}

async function updateLastestRoundInfo(round, btt, tx, state, conn) {
    let sql = "update dice_ver_v1 set btt_total = ?,btt_tx = ?,btt_state = ? where ver = ?;"
    let params = [btt, tx, state, round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret ? ret[0] : null;
}

async function getBttRoundInfo(_ver, conn) {
    let sql = "select * from dice_dividends_v1 where ver = ? and state = 3 and btt_state <> 3 limit 1000;";
    let params = [_ver];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function addBttTxInfo(round, addr, amount_sun, total_sun, tx, state, conn) {
    let sql = "update dice_dividends_v1 set btt = ?, btt_total = ?, btt_tx = ?, btt_state = ? where ver = ? and addr = ?;";
    let params = [amount_sun, total_sun, tx, state, round, addr];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function updateBttTxInfo(round, addr, state, conn) {
    let sql = "update dice_dividends_v1 set btt_state = ? where ver = ? and addr = ?;";
    let params = [state, round, addr];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function updateAllBttTxState(round, state, conn) {
    let sql = "update dice_dividends_v1 set btt_state = ? where ver = ? and btt_state = 0;";
    let params = [state, round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

module.exports.getLastestRoundInfo = getLastestRoundInfo;
module.exports.updateLastestRoundInfo = updateLastestRoundInfo;
module.exports.getPreRoundInfo = getPreRoundInfo;
module.exports.getBttRoundInfo = getBttRoundInfo;
module.exports.addBttTxInfo = addBttTxInfo;
module.exports.updateBttTxInfo = updateBttTxInfo;
module.exports.updateAllBttTxState = updateAllBttTxState;