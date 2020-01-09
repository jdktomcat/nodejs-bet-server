const db = require('../utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;

//获取某玩家单个订单记录
async function getPlayerLogSingle(addr, order_id, conn) {
    // console.log(arguments);
    let sql = "select * from dice_events_v3 where addr = ? and order_id = ?;"
    let params = [addr, order_id];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

//获取玩家最近记录
async function getPlayerLogs(addr, count, conn) {
    // console.log(arguments);
    let sql = "select * from dice_events_v3 where addr = ? ORDER BY order_id desc limit ?;"
    let params = [addr, count];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

//获取所有玩家最近记录
async function getAllLogs(count, conn) {
    // console.log(arguments);
    let sql = "select * from dice_events_v3 ORDER BY log_id desc limit ?;"
    let params = [count];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

//获取最近高额投注记录
async function getHighRollerLogs(value, count, conn) {
    // console.log(arguments);
    let sql = "select * from dice_events_v3 where payout_sun > ? ORDER BY log_id desc limit ?;"
    let params = [value, count];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

//获取最近险胜记录
async function getRareWinsLogs(count, conn) {
    // console.log(arguments);
    let sql = "select * from dice_events_v3 where (direction = 1 and roll >95) or (direction = 0 and roll < 4) ORDER BY log_id desc limit ?;"
    let params = [count];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

//获取玩家投注总排行榜
async function getPlayerRank(count, conn) {
    let sql = "select addr,(total + moon_total + wheel_total) as total,img from dice_players order by total desc limit ?;"
    let params = [count];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

//获取玩家投注总排行榜
async function getAllPlayersAddress(conn) {
    let sql = "select addr,name,img from dice_players;";
    let params = [];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

//获取当前区块统计数据
async function getStatisticsInfo(conn) {
    // let sql = "select all_payout_sun,all_play_times from dice_block order by block_num desc limit 1;"
    let sql = "select sum(payout + moon_payout + wheel_payout) as all_payout_sun,sum(play_times + moon_play_times + wheel_play_times) as all_play_times from dice_players;";
    let params = [];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret == null ? null : ret[0];
}

//获取当前地址推荐玩家获得的分成
async function getMentorInfo(addr, conn) {
    let sql = "select mentor,sum(referral)/1000000 as trx from dice_players GROUP BY mentor having mentor = ?;"
    let params = [addr];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    let info = {
        mentor: addr,
        trx: ret.length === 0 ? 0 : ret[0].trx
    }
    return info;
}

async function updateName(address, name, conn) {
    let sql = "UPDATE dice_players SET name = ? where addr = ?";
    let params = [name, address];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

async function updateImg(address, img, conn) {
    let sql = "UPDATE dice_players SET img = ? where addr = ?";
    let params = [img, address];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret.affectedRows > 0;
}

async function loadPlayerData(addr, conn) {
    let sql = "select (total + moon_total + wheel_total) as total, name, img from dice_players where addr = ? limit 1";
    let params = [addr];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return (ret != null && ret.length > 0) ? ret[0] : null;
}

module.exports.getPlayerLogSingle = getPlayerLogSingle;
module.exports.getPlayerLogs = getPlayerLogs;
module.exports.getAllLogs = getAllLogs;
module.exports.getHighRollerLogs = getHighRollerLogs;
module.exports.getRareWinsLogs = getRareWinsLogs;
module.exports.getPlayerRank = getPlayerRank;
module.exports.getStatisticsInfo = getStatisticsInfo;
module.exports.getMentorInfo = getMentorInfo;
module.exports.updateName = updateName;
module.exports.updateImg = updateImg;
module.exports.loadPlayerData = loadPlayerData;
module.exports.getAllPlayersAddress = getAllPlayersAddress;