const MongoDB = require('./mongoHelper');
const commomEnum = require('../common/commonEnum');
const stringUtil = require('../common/stringUtil');

const log4js = require('../configs/log4js.config');
const loggerDefault = log4js.getLogger('print');

const getUnixTimeStamp = stringUtil.getUnixTimeStamp;
const PAYIN_STATE = commomEnum.PAYIN_STATE;
const PAYOUT_STATE = commomEnum.PAYOUT_STATE;
const JACKPOT_STATE = commomEnum.JACKPOT_STATE;

async function getAccountByAddr(addr) {
    // 如果未查询到, 返回null
    try {
        let account = await MongoDB.findOne('poker_user', { addr: addr }, { addr: 1, name: 1 });
        return account;
    } catch (e) {
        return null;
    }
}

async function saveAccount(account) {
    try {
        let ret = await MongoDB.saveOne('poker_user', { addr: account.addr }, account);
        return ret && ret.n > 0;
    } catch (e) {
        return false;
    }
}

async function getLastBlockId() {
    let scanSetting = await MongoDB.findOne('poker_scan_setting', { configId: 1 }, { fullId: 1, solidityId: 1 });
    if (scanSetting) {
        return { fullId: scanSetting.fullId || 0, solidityId: scanSetting.solidityId || 0 };
    } else {
        return { fullId: 0, solidityId: 0 };
    }
}

async function addPayInOrder(order) {
    try {
        let existOrder = await MongoDB.findOne('poker_payin_order', { txID: order.txID }, { txID: 1, status: 1 });
        if (existOrder != null) {
            return { ret: false, status: existOrder.status };
        } else {
            // { ok: 1, nModified: 0, n: 1, upserted: [ [Object] ] } }
            let ret = await MongoDB.saveOne('poker_payin_order', { txID: order.txID }, order);
            if (ret && ret.n > 0) {
                return { ret: true };
            } else {
                return { ret: false, status: -1 };
            }
        }
    } catch (e) {
        loggerDefault.error("dbService.addPayInOrder exception:", e);
        return { ret: false, status: -1 };
    }
}

async function updatePayInOrder(order, newStatus) {
    try {
        let existOrder = await MongoDB.findOne('poker_payin_order', { txID: order.txID }, { txID: 1, status: 1 });
        if (existOrder != null && existOrder.status > newStatus) {
            return false;
        } else {
            // { ok: 1, nModified: 0, n: 0 }
            let ret = await MongoDB.updateOne('poker_payin_order', { txID: order.txID }, { status: newStatus, lastUpdate: getUnixTimeStamp() });
            return (ret.ok > 0);
        }
    } catch (e) {
        loggerDefault.error("dbService.updatePayInOrder exception:", e);
        return false;
    }
}

async function getPayInOrder() {
    try {
        let orderArray = await MongoDB.find('poker_payin_order', { status: { $lt: PAYIN_STATE.CONFIRMED } }, null, null);
        if (orderArray) {
            return { ret: true, dataRow: orderArray };
        } else {
            loggerDefault.error("dbService.getPayInOrder failed:");
            return { ret: false, dataRow: null };
        }
    } catch (e) {
        loggerDefault.error("dbService.getPayInOrder exception:", e);
        return { ret: false, dataRow: null };
    }
}

async function getPayOutOrder() {
    try {
        let orderArray = await MongoDB.find('poker_payout_order', { status: { $lt: PAYOUT_STATE.CONFIRMED } }, null, null);
        if (orderArray) {
            return { ret: true, dataRow: orderArray };
        } else {
            loggerDefault.error("dbService.getPayOutOrder failed:");
            return { ret: false, dataRow: null };
        }
    } catch (e) {
        loggerDefault.error("dbService.getPayOutOrder exception:", e);
        return { ret: false, dataRow: null };
    }
}

async function addPayOutOrder(order) {
    try {
        let existOrder = await MongoDB.findOne('poker_payout_order', { sysTxID: order.sysTxID }, { sysTxID: 1, status: 1 });
        if (existOrder != null) {
            return { ret: false, status: existOrder.status };
        } else {
            // { ok: 1, nModified: 0, n: 1, upserted: [ [Object] ] } }
            let ret = await MongoDB.saveOne('poker_payout_order', { sysTxID: order.sysTxID }, order);
            if (ret && ret.n > 0) {
                return { ret: true };
            } else {
                return { ret: false, status: -1 };
            }
        }
    } catch (e) {
        loggerDefault.error("dbService.addPayOutOrder exception:", e);
        return { ret: false, status: -1 };
    }
}

async function updatePayOutOrder(sysTxID, doc) {
    try {
        // { ok: 1, nModified: 0, n: 0 }
        let ret = await MongoDB.updateOne('poker_payout_order', { sysTxID: sysTxID }, doc);
        return (ret.ok > 0);
    } catch (e) {
        loggerDefault.error("dbService.updatePayOutOrder exception:", e);
        return false;
    }
}

async function getJackpotOrder() {
    try {
        let orderArray = await MongoDB.find('poker_jackpot_order', { status: { $lt: JACKPOT_STATE.CONFIRMED } }, null, null);
        if (orderArray) {
            return { ret: true, dataRow: orderArray };
        } else {
            loggerDefault.error("dbService.getJackpotOrder failed:");
            return { ret: false, dataRow: null };
        }
    } catch (e) {
        loggerDefault.error("dbService.getJackpotOrder exception:", e);
        return { ret: false, dataRow: null };
    }
}

async function addJackpotOrder(order) {
    try {
        let existOrder = await MongoDB.findOne('poker_jackpot_order', { sysTxID: order.sysTxID }, { sysTxID: 1, status: 1 });
        if (existOrder != null) {
            return { ret: false, status: existOrder.status };
        } else {
            // { ok: 1, nModified: 0, n: 1, upserted: [ [Object] ] } }
            let ret = await MongoDB.saveOne('poker_jackpot_order', { sysTxID: order.sysTxID }, order);
            if (ret && ret.n > 0) {
                return { ret: true };
            } else {
                return { ret: false, status: -1 };
            }
        }
    } catch (e) {
        loggerDefault.error("dbService.addJackpotOrder exception:", e);
        return { ret: false, status: -1 };
    }
}

async function updateJackpotOrder(sysTxID, doc) {
    try {
        // { ok: 1, nModified: 0, n: 0 }
        let ret = await MongoDB.updateOne('poker_jackpot_order', { sysTxID: sysTxID }, doc);
        return (ret.ok > 0);
    } catch (e) {
        loggerDefault.error("dbService.updateJackpotOrder exception:", e);
        return false;
    }
}

async function saveScanedBlock(fullId, solidityId) {
    try {
        let tmNow = getUnixTimeStamp();
        let doc = { configId: 1, fullId: fullId, solidityId: solidityId, updateTime: tmNow };
        let ret = await MongoDB.saveOne('poker_scan_setting', { configId: 1 }, doc);
        return ret && ret.n > 0;
    } catch (e) {
        loggerDefault.error("dbService.saveScanedBlock exception:", e);
        return false;
    }
}

async function savePayedTxID(txID) {
    try {
        let tmNow = getUnixTimeStamp();
        let ret = await MongoDB.saveOne('poker_payed_payin', { txID: txID }, { paytime: tmNow });
        return ret && ret.n > 0;
    } catch (e) {
        loggerDefault.error("dbService.savePayedOrder exception:", e);
        return false;
    }
}

async function isTxIDPayed(txID) {
    try {
        let ret = await MongoDB.count('poker_payed_payin', { txID: txID });
        return ret >= 1;
    } catch (e) {
        loggerDefault.error("dbService.isTxIDPayed exception:", e);
        return false;
    }
}

async function saveTable(tableId, doc) {
    try {
        let ret = await MongoDB.saveOne('poker_table', { tableId: tableId }, doc);
        return ret && ret.n > 0;
    } catch (e) {
        loggerDefault.error("dbService.saveTable exception:", e);
        return false;
    }
}

async function getTables() {
    try {
        let tableArray = await MongoDB.find('poker_table', {}, null, null);
        if (tableArray) {
            return { ret: true, dataRow: tableArray };
        } else {
            loggerDefault.error("dbService.getTables failed:");
            return { ret: false, dataRow: null };
        }
    } catch (e) {
        loggerDefault.error("dbService.getTables exception:", e);
        return { ret: false, dataRow: null };
    }
}

async function getLobby() {
    // 如果未查询到, 返回null
    try {
        let lobby = await MongoDB.findOne('poker_lobby', { lobbyId: 1 }, { address2TablesMap: 1, totalFee: 1, totalPot: 1, jackpot: 1 });
        return lobby;
    } catch (e) {
        return false;
    }

}

async function saveLobby(lobbyDoc) {
    try {
        let ret = await MongoDB.saveOne('poker_lobby', { lobbyId: 1 }, lobbyDoc);
        return ret && ret.n > 0;
    } catch (e) {
        return false;
    }
}

async function getGameLogsList(_tableId) {
    console.log("getGameLogsList _tableId", _tableId);
    // 如果未查询到, 返回null
    try {
        let account = await MongoDB.find('poker_report', { tableId: _tableId }, { no: 1, pot: 1, communityCards: 1, countPlayers: 1 }).setOptions({ limit: 1 });
        return account;
    } catch (e) {
        return null;
    }
}

async function getGameLogsDetail(_tableId, _no, _callback) {
    // 如果未查询到, 返回null
    try {
        MongoDB.findOne('poker_report', { tableId: _tableId, no: _no }, {}, _callback);
    } catch (e) {
        return null;
    }
}

async function saveGameLogs(logs) {
    try {
        let ret = await MongoDB.saveOne('poker_report', { tableId: logs.tableId, no: logs.no }, logs);
        return ret && ret.n > 0;
    } catch (e) {
        return false;
    }
}

async function saveHistoryList(_save_obj) {
    try {
        let ret = await MongoDB.saveOne('poker_history_list', { gameId: _save_obj.gameId }, _save_obj);
        // console.log("saveHistoryList ret",ret)
        return ret && ret.n > 0;
    } catch (e) {
        return false;
    }
}

async function getHistoryList(_tableId, _count, cb) {
    // 如果未查询到, 返回null
    try {
        let ret = await MongoDB.find('poker_history_list', { tableId: _tableId }, {}, { sort: { no: -1 }, limit: _count });
        if (cb != null) {
            cb(ret, null);
        }
        return ret;
    } catch (e) {
        if (cb != null) {
            cb(null, e);
        }
        return null;
    }
}

async function saveHistoryDetail(_save_obj) {
    try {
        let ret = await MongoDB.saveOne('poker_history_detail', { gameId: _save_obj.gameId }, _save_obj);
        return ret && ret.n > 0;
    } catch (e) {
        return false;
    }
}

async function getHistoryDetail(_tableId, _no) {
    // 如果未查询到, 返回null
    let gameId = _tableId + "-" + _no;
    try {
        let ret = await MongoDB.findOne('poker_history_detail', { gameId: gameId }, {});
        return ret;
    } catch (e) {
        return null;
    }
}

async function getHistoryDetailFromTo(_from, _to) {
    let _count = _to - _from;
    try {
        let ret = await MongoDB.find('poker_history_detail', {}, {}, { skip: _from, limit: _count });
        return ret;
    } catch (e) {
        return null;
    }
}

function closeMongodb(cb) {
    MongoDB.close(cb);
}

module.exports.getAccountByAddr = getAccountByAddr;
module.exports.saveAccount = saveAccount;

module.exports.getLastBlockId = getLastBlockId;
module.exports.saveScanedBlock = saveScanedBlock;

module.exports.getPayInOrder = getPayInOrder;
module.exports.addPayInOrder = addPayInOrder;
module.exports.updatePayInOrder = updatePayInOrder;

module.exports.savePayedTxID = savePayedTxID;
module.exports.isTxIDPayed = isTxIDPayed;

module.exports.getPayOutOrder = getPayOutOrder;
module.exports.addPayOutOrder = addPayOutOrder;
module.exports.updatePayOutOrder = updatePayOutOrder;

module.exports.getJackpotOrder = getJackpotOrder;
module.exports.addJackpotOrder = addJackpotOrder;
module.exports.updateJackpotOrder = updateJackpotOrder;

module.exports.saveTable = saveTable;
module.exports.getTables = getTables;

module.exports.getLobby = getLobby;
module.exports.saveLobby = saveLobby;

module.exports.getGameLogsList = getGameLogsList;
module.exports.getGameLogsDetail = getGameLogsDetail;
module.exports.saveGameLogs = saveGameLogs;

module.exports.closeMongodb = closeMongodb;

module.exports.saveHistoryList = saveHistoryList;
module.exports.getHistoryList = getHistoryList;
module.exports.saveHistoryDetail = saveHistoryDetail;
module.exports.getHistoryDetail = getHistoryDetail;

module.exports.getHistoryDetailFromTo = getHistoryDetailFromTo;