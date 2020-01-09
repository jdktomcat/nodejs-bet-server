const db = require('../utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;
const mysql = require('mysql2')


async function addInfo(round, hash, salt, angle, luckyNum, result, count2x, count3x, count5x, count50x, total2x, total3x, total5x, total50x, waiting_ts, sttling_ts, begin_tx_id, conn) {
    let sql = "insert into wheel_info (round, hash, salt, roll, luckyNum, angle, count2x, count3x, count5x, count50x, total2x, total3x, total5x, total50x, waiting_ts, settling_ts, begin_tx_id) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) "
        + " ON DUPLICATE KEY UPDATE count2x = ?, count3x = ?, count5x = ?, count50x = ?,  total2x = ?, total3x = ?, total5x = ?, total50x = ?, waiting_ts = ?, settling_ts = ?;"
    let params = [round, hash, salt, result,luckyNum, angle, count2x, count3x, count5x, count50x, total2x, total3x, total5x, total50x, waiting_ts, sttling_ts, begin_tx_id, count2x, count3x, count5x, count50x, total2x, total3x, total5x, total50x, waiting_ts, sttling_ts];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

async function deleteLog(round, conn) {
    let sql = "delete from wheel_info where round = ?;";
    let params = [round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows >= 0;
}

async function addLog(round, addr, amount, number,roll, name, conn) {
    let sql = "insert into wheel_detail (round, addr, amount, number, roll, win, name) values (?,?,?,?,?,?,?);";
    let win = number == roll ? number * amount : 0
    let params = [round, addr, amount, number, roll, win, name];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

async function updateInfo(round, result, win_count, payout, end_ts, end_tx_id, conn) {
    // console.log("updateInfo",round, result, win_count, payout, end_ts, end_tx_id);
    let sql = "update wheel_info set result = ?, win_count = ?, payout = ?, end_ts = ?, end_tx_id = ? where round = ?;"
    let params = [result, win_count, payout, end_ts, end_tx_id, round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

async function updateLog(round, addr, out_ts, cashed_out, win_sun, referral_sun, conn) {
    let sql = "update wheel_detail set out_ts = ?, cashed_out = ?, win_sun = ?, referral_sun = ? where round = ? and addr = ?;";
    let params = [out_ts, cashed_out, win_sun, referral_sun, round, addr];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

//获取最近记录
async function getLatestLogs(count, conn) {
    let sql = "select round,result from wheel_info where result > 0 order by round desc limit ?;"
    let params = [count];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

//获取玩家记录
async function getMyLogs(round, count, conn) {
    if (round == null || round === 0) round = 999999999;
    let sql = "select round, hash, salt, luckyNum as roll, angle from wheel_info where round <= ? order by round desc limit ?;"
    let params = [round, count];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function getHistoryRoomLogs(count, conn) {
    let sql = "select room_id roomId, seat_id as seatId, hash, salt, roll + 1 as luckyNum, angle, player1, player2, status, player3, player4,playerCnt, amount,createTs, endTs from wheel_room where status = 3  order by endTs desc limit ?;"
    let params = [count];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function getMySoloLogs(addr, count, conn) {
    console.log(addr, count)
    let sql = "select room_id roomId, seat_id as seatId, hash, salt, roll + 1 as luckyNum, angle, player1, player2, status, player3, player4,playerCnt, amount,createTs, endTs from wheel_room where status = 3 and (player1 = ? or player2 = ? or player3 = ? or player4 = ?) order by endTs desc limit ?;"
    let params = [addr,addr,addr,addr,count];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function addRoomInfo(roomId, hash, salt, seed, angle, luckyNum, seatId, player1, player2, player3, player4, player1Tx, player2Tx, player3Tx, player4Tx,settleTx,amount, playerCnt, status, createTs, endTs, conn) {
    console.log(roomId, hash, salt, seed, angle, luckyNum, player1, player2, player3, player4, player1Tx, player2Tx, player3Tx, player4Tx,settleTx,amount, playerCnt, status, createTs, endTs)
    let sql = "insert into wheel_room (room_id, hash, salt, seed, roll, angle, seat_id, player1, player2, player3, player4, player1Tx, player2Tx, player3Tx, player4Tx, settleTx, amount, playerCnt, status, createTs, endTs) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) "
    + " ON DUPLICATE KEY UPDATE player1 = ?, player2 = ?, player3 = ?, player4 = ?,  amount = ?, playerCnt = ?, status = ?, endTs = ?, settleTx = ?;"
    let params = [roomId, hash, salt, seed, luckyNum, angle, seatId, player1, player2, player3, player4,player1Tx, player2Tx, player3Tx, player4Tx, settleTx, amount, playerCnt, status, createTs, endTs, 
        player1, player2, player3, player4, amount, playerCnt, status, endTs, settleTx];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}


module.exports.addInfo = addInfo;
module.exports.deleteLog = deleteLog;
module.exports.addLog = addLog;
module.exports.updateInfo = updateInfo;
module.exports.updateLog = updateLog;
module.exports.getLatestLogs = getLatestLogs;
module.exports.getMyLogs = getMyLogs;
module.exports.addRoomInfo = addRoomInfo;
module.exports.getHistoryRoomLogs = getHistoryRoomLogs;
module.exports.getMySoloLogs = getMySoloLogs;
