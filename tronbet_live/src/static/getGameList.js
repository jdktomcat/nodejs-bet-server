const db = require('../utils/dbUtil')
const platiusList = require("./platiusList")

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
    let sql = "select game_id,game_name  from tron_live.live_online_game where game_name != '' order by is_new desc,ts desc"
    let res = await db.exec(sql, [])
    const name = res.map(e => e.game_name)
    return name
}

async function getPlatiusList(){
    // platiusList add in 2020-03-20
    platiusList.forEach(e=>e.type = 'platius')
    platiusList.forEach(e=>e.thumbnail = e.png)
    const platiusSlot = platiusList.filter(e=>e.category === 'slots')
    const platiusTable = platiusList.filter(e=>e.category === 'table')
    return [platiusSlot,platiusTable]
}

async function getOnlineId() {
    let sql = "select game_id,game_name  from tron_live.live_online_game where game_name != '' and status = '0' order by is_new desc,ts desc"
    let res = await db.exec(sql, [])
    const game_id = res.map(e => e.game_id)
    return game_id
}

module.exports = {
    getGameList: getOnlineList,
    getIsNewArray: getIsNewArray,
    getNameSortArray: getNameSortArray,
    getPlatiusList:getPlatiusList,
    getOnlineId:getOnlineId,
}