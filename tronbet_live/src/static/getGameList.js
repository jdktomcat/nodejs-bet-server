const db = require('../utils/dbUtil')

const dict = {
    "hub88": "hub88",
    "em": "em",
}

const emDict = {
    "slots": "slots",
    "table": "table",
    "live": "live",
}


async function getOnlineList() {
    let sql = "select *  from tron_live.live_online_game where status != '1'"
    let res = await db.exec(sql, [])
    //
    const hub88 = res.filter(e => e.vendor === dict.hub88).map(e => e.game_name)
    // em
    const slots = res.filter(e => e.vendor === dict.em && e.em_type === emDict.slots).map(k => k.game_name);
    const table = res.filter(e => e.vendor === dict.em && e.em_type === emDict.table).map(k => k.game_name);
    const live = res.filter(e => e.vendor === dict.em && e.em_type === emDict.live).map(k => k.game_id);
    return {
        swaggerGames: hub88,
        GameSWhilte: slots,
        TableGames: table,
        liveGames: live,
    }
}


async function getIsNewArray() {
    let sql = "select *  from tron_live.live_online_game where is_new = '1'"
    let res = await db.exec(sql, [])
    //
    const hub88 = res.filter(e => e.vendor === dict.hub88).map(e => e.game_name)
    // em
    const slots = res.filter(e => e.vendor === dict.em && e.em_type === emDict.slots).map(k => k.game_name);
    const table = res.filter(e => e.vendor === dict.em && e.em_type === emDict.table).map(k => k.game_name);
    const live = res.filter(e => e.vendor === dict.em && e.em_type === emDict.live).map(k => k.game_id);
    return {
        hub88: hub88,
        emSlot: slots,
        emTable: table,
        emLive: live,
    }
}

async function getNameSortArray() {
    let sql = "select game_name  from tron_live.live_online_game order by ts asc"
    let res = await db.exec(sql, [])
    const name = res.map(e => e.game_name)
    return name
}

module.exports = {
    getGameList: getOnlineList,
    getIsNewArray: getIsNewArray,
    getNameSortArray: getNameSortArray,
}