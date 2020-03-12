const db = require('../utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;

module.exports.getMyLogs = getMyLogs;
module.exports.getLogByRound = getLogByRound;
module.exports.getDetailByRound = getDetailByRound;

//获取玩家记录
async function getMyLogs(round, count, addr, conn) {
    // if (round == null || round === 0) round = 999999999;
    // let sql = "select a.round,IFNULL(a.crashAt,0) as result,IFNULL(b.escapeAt,0) as your_cashed_out,IFNULL(b.amount,0) as bet,IFNULL(b.win,0) as profit,a.tx_id as hash from moon_round_info as a "
    // +"left join (SELECT * from moon_user_order where round <= ? and addr = ? ORDER BY round desc limit ?) as b on a.round = b.round where a.round <= ? and a.crashAt > 0 order by a.round desc limit ?;"
    // let params = [round, addr, count + 1, round, count];
    // let fun = conn == null ? exec : execTrans;
    // let ret = await fun(sql, params, conn);
    // // console.log(ret);
    // return ret;

    if (round == null || round === 0) round = 999999999;
    let min_round = round - count;
    if (min_round < 0) {
        min_round = 0;
    }
    let sql = "select a.round,IFNULL(a.crashAt,0) as result,IFNULL(b.escapeAt,0) as your_cashed_out,IFNULL(b.amount,0) as bet,IFNULL(b.win,0) as profit,a.tx_id as hash from moon_round_info as a "
        + "left join (SELECT * from moon_user_order where round <= ? and round >= ? and addr = ? ORDER BY round desc) as b "
        + "on a.round = b.round where a.round <= ? and a.round > ? and a.crashAt > 0 order by a.round desc;"
    let params = [round, min_round, addr, round, min_round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    // console.log(ret);
    // console.log("sql is : ",sql)
    // console.log("params is : ",params)
    return ret;

}

//获取最近记录
async function getLogByRound(round, conn) {
    let sql = "select round,crashAt as result,ts as end_ts,tx_id as hash from moon_round_info where round = ? limit 1;"
    let params = [round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret ? ret[0] : null;
}

//获取最近记录
async function getDetailByRound(round, conn) {
    let sql = "select addr,amount as bet,escapeAt as cashed_out,(win - amount) as profit,'' as name  from moon_user_order where round = ?;"
    let params = [round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

// getMyLogs(686,50,"")