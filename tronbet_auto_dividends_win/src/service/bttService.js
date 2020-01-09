const db = require('../utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;
const log4js = require('../configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');

async function createRoundInfo(ver, total_btt, tx) {
    //ver为最新win分红轮次
    //获取最新win币分红成功的信息 ver,total_win
    //获取最新dice币分红成功的信息 ver,total_dice
    //写入最新btt分红概要 ver,total_win,total_dice,total_btt

    let begin_ts = Date.now();
    let conn = null;
    try {
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();

        let win_div_info = await db.execTrans("select * from win_ver_v1 where ver = ?", [ver], conn);
        let total_win = 0;
        if (win_div_info != null && win_div_info[0] != null && win_div_info[0].total_win != null) {
            total_win = win_div_info[0].total_win;
        }

        let dice_div_info = await db.execTrans("select * from dice_ver_v1 order by ver desc limit 1;", [], conn); //取最新dice分红记录
        let total_dice = 0;
        let dice_ver = 0;
        if (dice_div_info != null && dice_div_info[0] != null && dice_div_info[0].total_dice != null) {
            total_dice = dice_div_info[0].total_dice;
            dice_ver = dice_div_info[0].ver;
        }

        await db.execTrans(
            "insert into btt_ver_v1 (ver,total_dice,total_win,total_btt,dice_rate,win_rate,tx_id,div_state) values (?,?,?,?,?,?,?,?)",
            [ver, total_dice, total_win, total_btt, 51, 49, tx, 1],
            conn
        );

        //快照最新dice币分红名单
        await db.execTrans("insert into btt_dividends_v1 (ver,addr,dice) select ?,addr,dice from dice_dividends_v1 where ver = ? and dice > 0", [ver, dice_ver], conn);

        // //快照最新win币分红名单
        await db.execTrans("insert into btt_dividends_v1 (ver,addr,win) select ver,addr,win from win_dividends_v1 where ver = ? and win > 0", [ver], conn);

        loggerDefault.info(">> createRoundInfo >> db save complete! ===> 数据库耗时:" + (Date.now() - begin_ts) + " ms");

        conn.commit();
        conn.release();
    } catch (e) {
        if (conn) {
            conn.rollback();
            conn.release();
        }
        loggerError.error("OMG! ROLLBACK!!!", e);
        return false
    }
    return true;
}

async function updateLastestRoundInfo(ver, total_btt, state, conn) {
    let sql = "update btt_ver_v1 set total_btt = ?, div_state = ? where ver = ?;";
    let params = [total_btt, state, ver];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function getBttSendList(_ver, conn) {
    let sql = "select * from btt_dividends_v1 where ver = ? and state <> 3 and state <> 0 limit 200;";
    let params = [_ver];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function addBttTxInfo4Win(ver, addr, btt, tx, ts, state, conn) {
    let sql = "update btt_dividends_v1 set btt = ?, tx_id = ?, send_ts = ?, state = ? where ver = ? and addr = ? and win > 0;";
    let params = [btt, tx, ts, state, ver, addr];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function addBttTxInfo4Dice(ver, addr, btt, tx, ts, state, conn) {
    let sql = "update btt_dividends_v1 set btt = ?, tx_id = ?, send_ts = ?, state = ? where ver = ? and addr = ? and dice > 0;";
    let params = [btt, tx, ts, state, ver, addr];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function updateBttTxInfo(round, addr, state, tx_id, conn) {
    let sql = "update btt_dividends_v1 set state = ? where ver = ? and addr = ? and tx_id = ?;";
    let params = [state, round, addr, tx_id];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function updateAllBttTxState(round, state, conn) {
    let sql = "update btt_dividends_v1 set state = ? where ver = ? and state = 0;";
    let params = [state, round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function getLastestRoundInfo(conn) {
    let sql = "select * from btt_ver_v1 order by ver desc limit 1";
    let params = [];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret != null ? ret[0] : null;
}

module.exports.createRoundInfo = createRoundInfo;
module.exports.getLastestRoundInfo = getLastestRoundInfo;
module.exports.updateLastestRoundInfo = updateLastestRoundInfo;
module.exports.getBttSendList = getBttSendList;
module.exports.addBttTxInfo4Win = addBttTxInfo4Win;
module.exports.addBttTxInfo4Dice = addBttTxInfo4Dice;
module.exports.updateBttTxInfo = updateBttTxInfo;
module.exports.updateAllBttTxState = updateAllBttTxState;