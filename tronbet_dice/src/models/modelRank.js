const db = require('../utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;

async function getRankInfo(start_ts,end_ts, length, conn) {
    let sql = "select addr,(cur_total_sun - total_sun_at_start) as amount from rank_dialy where start_ts = ? and end_ts = ? order by amount desc limit ?;"
    let params = [start_ts,end_ts, length];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function isExistSnaphot(start_ts, conn) {
    console.log("start_ts", start_ts);
    let sql = "select start_ts from rank_dialy where start_ts = ? limit 1;"
    let params = [start_ts];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.length > 0 ? true : false;
}

async function laterSnaphot(start_ts, end_ts, conn) {
    // let sql = "INSERT INTO rank_dialy(start_ts,end_ts,addr,cur_total_sun,total_sun_at_start) SELECT ? as start_ts,? as end_ts,addr,total as cur_total_sun,0 as total_sun_at_start FROM dice_players where addr in (select addr from dice_players where first_ts >= ? and addr not in (select addr from rank_dialy))"
    // let params = [start_ts, end_ts, start_ts];
    // let fun = conn == null ? exec : execTrans;
    // let ret = await fun(sql, params, conn);
    // return ret.affectedRows > 0;
}

async function updateSnaphot(start_ts, conn) {
    // let sql = "UPDATE rank_dialy as a SET cur_total_sun = (SELECT total FROM dice_players WHERE addr = a.addr) where a.start_ts = ?"
    // let params = [start_ts];
    // let fun = conn == null ? exec : execTrans;
    // let ret = await fun(sql, params, conn);
    // return ret.affectedRows > 0;
}

async function insertSnaphot(start_ts, end_ts, conn) {
    // let sql = "INSERT INTO rank_dialy(start_ts,end_ts,addr,cur_total_sun,total_sun_at_start) SELECT ? as start_ts,? as end_ts,addr,total as cur_total_sun,total as total_sun_at_start FROM dice_players;";
    // let params = [start_ts, end_ts];
    // let fun = conn == null ? exec : execTrans;
    // let ret = await fun(sql, params, conn);
    // return ret.affectedRows > 0;
}

module.exports.getRankInfo = getRankInfo;
module.exports.isExistSnaphot = isExistSnaphot;
module.exports.insertSnaphot = insertSnaphot;
module.exports.updateSnaphot = updateSnaphot;
module.exports.laterSnaphot = laterSnaphot;