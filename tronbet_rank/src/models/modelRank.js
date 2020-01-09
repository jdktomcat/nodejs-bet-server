const db = require('../utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;

async function getRankInfo(round, length, conn) {
    let sql = "select addr,(cur_total_sun - total_sun_at_start) as total_bet_sun,all_users_bet_trx from rank_list_v1 where round = ? order by total_bet_sun desc limit ?;";
    let params = [round, length];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function isExistSnaphot(round, conn) {
    let sql = "select round from rank_list_v1 where round = ? limit 1;";
    let params = [round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.length > 0 ? true : false;
}

async function laterSnaphot(round, start_ts, end_ts, conn) {
    // console.log("laterSnaphot",round, start_ts, end_ts);
    let sql = "INSERT INTO rank_list_v1(round,start_ts,end_ts,addr,cur_total_sun,total_sun_at_start) SELECT ? as round,? as start_ts,? as end_ts,addr,(total+moon_total+wheel_total) as cur_total_sun,(total+moon_total+wheel_total) as total_sun_at_start FROM dice_players where addr in (select addr from dice_players where lastest_ts >= ? and addr not in (select addr from rank_list_v1 where round = ?))";
    let params = [round, start_ts, end_ts, start_ts, round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

async function updateSnaphot(round, conn) {
    // console.log("updateSnaphot",round);
    let sql = "UPDATE rank_list_v1 as a SET cur_total_sun = (SELECT (total+moon_total+wheel_total) as total FROM dice_players WHERE addr = a.addr) where a.round = ?";
    let params = [round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

async function getAllBet(round,conn){
    let sql = "select sum(cur_total_sun/1000000 - total_sun_at_start/1000000) as all_users_bet_trx from rank_list_v1 where round = ?";
    let params = [round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret!=null?ret[0].all_users_bet_trx:0;
}

async function updateAllBet(round,val, conn) {
    // console.log("updateSnaphot",round);
    let sql = "UPDATE rank_list_v1 SET all_users_bet_trx = ? where round = ?";
    let params = [val,round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

async function insertSnaphot(round, start_ts, end_ts, conn) {
    // console.log("insertSnaphot",round, start_ts, end_ts);
    let sql = "INSERT INTO rank_list_v1(round,start_ts,end_ts,addr,cur_total_sun,total_sun_at_start) SELECT ? as round, ? as start_ts,? as end_ts,addr,(total+moon_total+wheel_total) as cur_total_sun,(total+moon_total+wheel_total) as total_sun_at_start FROM dice_players where lastest_ts > ?;";
    let params = [round, start_ts, end_ts, start_ts];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

//获取发奖轮次信息
async function getNewestRoundInfo(conn) {
    let sql = "select round,start_ts,end_ts from rank_list_v1 order by round desc limit 1;";
    let params = [];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.length > 0 ? ret[0] : null;
}

async function getAwardRoundInfo(conn) {
    let sql = "select round,create_ts from rank_award_v1 order by round desc limit 1;";
    let params = [];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.length > 0 ? ret[0] : null;
}

//获取发奖记录
async function getRankLogs(round, conn) {
    // let sql = "select * from rank_award_v1 where round = ? and ((trx_tx_status <> 99 and trx_tx_status <> 0) or (ante_tx_status <> 99 and ante_tx_status <> 0)) order by rank asc";
    // let params = [round];
    let sql = "select * from rank_award_v1 where ((trx_tx_status <> 99 and trx_tx_status <> 0) or (ante_tx_status <> 99 and ante_tx_status <> 0)) order by rank asc";
    let params = [];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.length > 0 ? ret : null;
}

//更新TRX发奖交易状态
async function updateTrxTxStatue(round, rank, addr, trx_tx, status, conn) {
    let sql = "update rank_award_v1 set trx_tx = ?,trx_tx_status = ? where round=? and rank = ? and addr = ?";
    let params = [trx_tx, status, round, rank, addr];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

//更新ANTE发奖交易状态
async function updateAnteTxStatue(round, rank, addr, ante_tx, status, conn) {
    let sql = "update rank_award_v1 set ante_tx = ?,ante_tx_status = ? where round=? and rank = ? and addr = ?";
    let params = [ante_tx, status, round, rank, addr];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

//新增发奖信息
async function insertAwardInfo(round, rank, addr, total_bet_sun, trx, ante, create_ts, trx_tx_status, ante_tx_status, conn) {
    let sql = "insert into rank_award_v1 (round,rank,addr,total_bet_sun,trx,ante,create_ts,trx_tx_status,ante_tx_status) values (?,?,?,?,?,?,?,?,?);";
    let params = [round, rank, addr, total_bet_sun, trx, ante, create_ts, trx_tx_status, ante_tx_status];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

//获取发奖信息
async function getSendInfo(round, rank, addr){
    let sql = "select * from rank_award_v1 where round = ? and rank = ? and addr = ? limit 1;";
    let params = [round, rank, addr];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.length > 0 ? ret[0] : null;
}

module.exports.getRankInfo = getRankInfo;
module.exports.isExistSnaphot = isExistSnaphot;
module.exports.insertSnaphot = insertSnaphot;
module.exports.updateSnaphot = updateSnaphot;
module.exports.laterSnaphot = laterSnaphot;

module.exports.getNewestRoundInfo = getNewestRoundInfo;
module.exports.getRankLogs = getRankLogs;
module.exports.updateTrxTxStatue = updateTrxTxStatue;
module.exports.updateAnteTxStatue = updateAnteTxStatue;
module.exports.insertAwardInfo = insertAwardInfo;
module.exports.getAwardRoundInfo = getAwardRoundInfo;

module.exports.getAllBet = getAllBet;
module.exports.updateAllBet = updateAllBet;
module.exports.getSendInfo = getSendInfo;