const db = require('../utils/dbUtil')
const refreshRate = require('./refreshRate')
const schedule = require('node-schedule');
const {updateRateByGameId} = require('../model/newGameList');

const operationDict = {
    // 上线
    online: "0",
    // 下线
    takeOff: "1",
}

const statusDict = {
    //待执行
    undone: "0",
    //已完成
    done: "1",
}

const raw = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}


const insertGameSchedule = async function (params) {
    const sql = `insert into 
    tron_live.live_online_game_schedule(vendor,game_id_array,operation,trigger_time,rate,status) 
    values (?,?,?,?,?,?)`
    const o = ['vendor', 'game_id_array', 'operation', 'trigger_time', 'rate', 'status']
    params.status = statusDict.undone
    const p = o.map(e => params[e])
    const data = await raw(sql, p)
    return data
}

const getAllGameSchedule = async function () {
    const sql = `select * from tron_live.live_online_game_schedule`
    const data = await raw(sql, [])
    return data
}

const getScheduleList = async function (offset, limit) {
    const end = Number(limit)
    const start = (Number(offset) - 1) * end
    //
    const sql = `select * from tron_live.live_online_game_schedule order by trigger_time desc limit ?,?`
    const o = [start, end]
    const data = await raw(sql, o)
    //
    const sql2 = `select count(1) as count from tron_live.live_online_game_schedule`
    const countData = await raw(sql2, [])
    const countTmp = countData[0] || {}
    const count = countTmp.count || 0
    const res = {
        count: count,
        rows: data
    }
    return res
}

const deleteGameSchedule = async function (id) {
    const sql = `delete from tron_live.live_online_game_schedule where id = ? and status = ?`
    const o = [id, statusDict.undone]
    const data = await raw(sql, o)
    return data
}


const updateGameScheduleSuccess = async function (id) {
    const sql = `update tron_live.live_online_game_schedule set status = ? where id = ?`
    const o = [statusDict.done, id]
    const data = await raw(sql, o)
    return data
}


const takeAction = async function (data) {
    for (let e of data) {
        if (e.status === statusDict.undone) {
            console.log("enter schedule game online/offline")
            let rate = 1
            if (Number(e.rate) > 1) {
                rate = Number(e.rate)
            }
            //
            const game_id_array = String(e.game_id_array).split(',')
            console.log("process ,game array is ", game_id_array)
            for (let game of game_id_array) {
                let rateParam = {
                    gameId: game,
                    name: game + '_name',
                    rate: rate,
                }
                if (e.vendor === 'em') {
                    await refreshRate.refreshEM(rateParam)
                    //todo add model change
                } else if (e.vendor === 'hub88') {
                    await refreshRate.refreshHub88(rateParam)
                }
                await updateRateByGameId(rate, game, e.vendor)
            }
            await updateGameScheduleSuccess(e.id)
        }
    }
}

const taskList = async function () {
    const data = await getAllGameSchedule()
    const now = Date.now()
    let execArray = data.filter(e => now > e.trigger_time)
    // console.log("debug---->execArray", execArray)
    if (execArray.length > 0) {
        //todo, add in 20191231
        await takeAction(execArray)
    }
}

const openSchedule = function () {
    const j = schedule.scheduleJob('*/1 * * * *', async function () {
        await taskList()
    })
}


module.exports = {
    insertGameSchedule,
    getAllGameSchedule,
    deleteGameSchedule,
    openSchedule,
    getScheduleList,
}