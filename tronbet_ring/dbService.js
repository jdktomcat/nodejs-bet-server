const db = require('./src/utils/utilMysql');
const modelWheel = require('./src/model/modelWheel');
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');

async function sumAmount(betX) {
    let sum = 0
    for (let one of betX) {
        sum += one.amount
    }
    return sum
}

async function addInfo(betInfo) {
    let conn = null;
    try {
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();
        //写入tx
        await modelWheel.addInfo(betInfo.round, betInfo.hash, betInfo.salt,betInfo.angle, betInfo.luckyNum, betInfo.multi,
            betInfo.bet2X.length, betInfo.bet3X.length, betInfo.bet5X.length, betInfo.bet50X.length,
            await sumAmount(betInfo.bet2X), await sumAmount(betInfo.bet3X), await sumAmount(betInfo.bet5X), await sumAmount(betInfo.bet50X),
            betInfo.betStime, betInfo.settleStime, betInfo.tx_id, conn);

        console.log('-------------start save player_info--------------')
        for (let index in betInfo.bet2X) {
            let player_info = betInfo.bet2X[index];
            await modelWheel.addLog(betInfo.round, player_info.addr, player_info.amount, player_info.multi, betInfo.multi, player_info.name || "", conn);
        }
        for (let index in betInfo.bet3X) {
            let player_info = betInfo.bet3X[index];
            await modelWheel.addLog(betInfo.round, player_info.addr, player_info.amount, player_info.multi, betInfo.multi, player_info.name || "", conn);
        }
        for (let index in betInfo.bet5X) {
            let player_info = betInfo.bet5X[index];
            await modelWheel.addLog(betInfo.round, player_info.addr, player_info.amount, player_info.multi, betInfo.multi, player_info.name || "", conn);
        }
        for (let index in betInfo.bet50X) {
            let player_info = betInfo.bet50X[index];
            await modelWheel.addLog(betInfo.round, player_info.addr, player_info.amount, player_info.multi, betInfo.multi, player_info.name || "", conn);
        }
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

async function updateInfo(betInfo) {
    let conn = null;
    try {
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();
        //写入tx
        // console.log("updateInfo",betInfo.round, betInfo.result, betInfo.win_count, betInfo.payout, betInfo.end_ts, betInfo.end_tx_id);
        await modelWheel.updateInfo(betInfo.round, betInfo.result, betInfo.win_count, betInfo.payout, betInfo.end_ts, betInfo.end_tx_id, conn);
        let all_players = betInfo.players;
        for (let addr in all_players) {
            let player_info = all_players[addr];
            await modelWheel.updateLog(betInfo.round, player_info.addr, player_info.out_ts || 0, player_info.cashed_out, player_info.profit, player_info.referral_sun || 0, conn);
        }
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

async function getLatestLogs(count) {
    count = count || 6;
    return await modelWheel.getLatestLogs(count);
}

async function getMyLogs(round, count, addr) {
    return await modelWheel.getMyLogs(round, count, addr);
}

async function getRoundInfo(round) {
    let roundInfo = await modelWheel.getLogByRound(round);
    return [roundInfo, detailInfo];
}

async function getHistoryRoomLogs(count) {
    return await modelWheel.getHistoryRoomLogs(count);
}

async function getMySoloLogs(addr, count) {
    return await modelWheel.getMySoloLogs(addr, count);
}

async function addRoomInfo(room) {
    let conn = null;
    try {
        conn = await db.getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();
        //写入tx
        console.log(room)
        await modelWheel.addRoomInfo(room.roomId, room.hash, room.salt, room.seed, room.angle, room.luckyNum,
            room.seatId, room.player1, room.player2, room.player3, room.player4,
            room.player1Tx, room.player2Tx, room.player3Tx, room.player4Tx,
            room.settleTx,room.amount, room.playerCnt, room.status, 
            room.createTs, room.endTs, conn);
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

module.exports.addInfo = addInfo;
module.exports.updateInfo = updateInfo;
module.exports.getLatestLogs = getLatestLogs;
module.exports.getMyLogs = getMyLogs;
module.exports.getRoundInfo = getRoundInfo;
module.exports.addRoomInfo = addRoomInfo;
module.exports.getHistoryRoomLogs = getHistoryRoomLogs;
module.exports.getMySoloLogs = getMySoloLogs;