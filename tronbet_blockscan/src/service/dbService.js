const db = require('../utils/utilMysql');
const _ = require('underscore')._;
const BigNumber = require('bignumber.js');
const config = require('../configs/config');
const log4js = require('../configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');

let DICE_PLAYERS = new Map();
async function init() {
    try {
        let sql = "select user_id,addr from dice_players";
        let allPlayers = await db.execTrans(sql);
        for (let playerInfo of allPlayers) {
            addPlayer(playerInfo.addr, playerInfo.user_id);
        }
    } catch (e) {
        throw new Error("can not init db service!");
    }
    loggerDefault.info("init DICE_PLAYERS", DICE_PLAYERS)
}

init();

function addPlayer(addr, user_id) {
    let userId = DICE_PLAYERS.get(addr);
    if (userId) {
        return userId;
    }
    DICE_PLAYERS.set(addr, user_id);
}

async function saveDB(blockInfo) {
   return true
}

async function getMaxBlockNum() {
    let preBlock = await db.exec("SELECT * from dice_block order by block_num desc limit 1;", null, null);
    return preBlock[0] ? preBlock[0].block_num : 0;
}

async function updatePlayerInfo(info) {
    // console.log(info)
    let preBlock = await db.exec("insert into dice_player_order(tx_id, ts, sign, addr, order_id) values(?,?,?,?,?);", [info.trID, info.ts, info.sign, info.addr, info.orderId], null);
    return preBlock[0] ? preBlock[0].block_num : 0;
}


async function hasTxId(txID) {
    let preBlock = await db.exec("SELECT count(1) cnt from dice_player_order where tx_id = ?;", [txID], null);
    return preBlock[0] ? preBlock[0].cnt : 0;
}


module.exports.getMaxBlockNum = getMaxBlockNum;
module.exports.saveDB = saveDB;
module.exports.updatePlayerInfo = updatePlayerInfo;
module.exports.hasTxId = hasTxId;