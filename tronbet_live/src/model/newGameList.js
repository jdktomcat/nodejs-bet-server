const db = require('../utils/dbUtil')

const raw = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}

async function getLiveRaw() {
    let sql = "select *  from tron_live.live_online_game order by rate desc,ts desc"
    let res = await raw(sql, [])
    return res
}


async function getOnlineGameInfo() {
    let sql = "select * from tron_live.live_online_game where status != '1' and rate > 1"
    let res = await raw(sql, [])
    return res
}

async function insertLiveGame(vendor, game_id, game_name, type, rate) {
    let sql = "insert into tron_live.live_online_game(vendor,game_id,game_name,em_type,ts,status,rate) values (?,?,?,?,?,'0',?)"
    let res = await raw(sql, [vendor, game_id, game_name, type, Date.now(), rate])
    return res
}


async function editOnlineGameInfo(id) {
    let sql = "select * from tron_live.live_online_game where id = ?"
    let res = await raw(sql, [id])
    return res
}


async function updateLiveGame(params) {
    let sql = `update tron_live.live_online_game set
    vendor = ?,
    game_id = ?,
    game_name = ?,
    em_type = ? ,
    status = ?,
    rate = ?,
    ts = ? 
    where id = ?`
    const p = [
        params.vendor,
        params.game_id,
        params.game_name,
        params.em_type,
        params.status,
        Number(params.rate),
        Date.now(),
        Number(params.id)
    ]
    let res = await raw(sql, p)
    return res
}


async function updateGameRate(params) {
    let sql = `update tron_live.live_online_game set rate = ? where id = ?`
    const p = [
        Number(params.rate),
        Number(params.id)
    ]
    let res = await raw(sql, p)
    return res
}

async function updateRateByGameId(rate,game_id,vendor) {
    let sql = `update tron_live.live_online_game set rate = ? where game_id = ? and vendor = ?`
    const p = [
        Number(rate),
        String(game_id),
        vendor
    ]
    let res = await raw(sql, p)
    return res
}


async function deleteLiveGameById(vendor, gameId) {
    let sql = "delete from tron_live.live_online_game where vendor = ? and game_id = ? "
    let res = await raw(sql, [vendor, gameId])
    return res
}


async function deleteLiveGameByName(vendor, gameName) {
    let sql = "delete from tron_live.live_online_game where vendor = ? and game_name = ? "
    let res = await raw(sql, [vendor, gameName])
    return res
}

async function offlineLiveGameByUUID(uuid) {
    let sql = "update tron_live.live_online_game set status = '1' where id = ? "
    let res = await raw(sql, [uuid])
    console.log(sql, uuid)
    return res
}

module.exports = {
    insertLiveGame,
    deleteLiveGameById,
    deleteLiveGameByName,
    getLiveRaw,
    updateLiveGame,
    updateGameRate,
    updateRateByGameId,
    getOnlineGameInfo,
    offlineLiveGameByUUID,
    editOnlineGameInfo,
}