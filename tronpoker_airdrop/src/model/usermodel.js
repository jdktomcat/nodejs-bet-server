const db = require('../utils/dbUtil')
const _ = require('lodash')._


async function getLiveAirdropData(startTs, endTs) {
    let sql = "select sum(bet + 4 * payout) Amount, uid addr from poker_statistics_log where ts >= ? and ts < ? group by addr"
    let res = await db.exec(sql, [startTs , endTs])
    return res
}

async function liveAirdropLog(addr, startTs, endTs, betAmount, adAmount) {
    let sql = "insert into rake_airdrop_log(addr, startTs, endTs, betAmount, adAmount) values (?,?,?,?,?);"
    let res = await db.exec(sql, [addr, startTs, endTs, betAmount, adAmount])
    return res
}

async function updateAirdropLog(addr, startTs, endTs, txId) {
    let sql = "update rake_airdrop_log set txId = ? where addr = ? and startTs = ? and endTs = ?"
    let res = await db.exec(sql, [txId, addr, startTs, endTs])
    return res
}

async function getMaxLogId() {
    let sql = "select max(logId) logId from rake_airdrop_log"
    let res = await db.exec(sql, [])
    if(_.isEmpty(res)) return 0
    return res[0].logId
}

async function getMaxEndTs() {
    let sql = "select max(endTs) endTs from rake_airdrop_log"
    let res = await db.exec(sql, [])
    if(_.isEmpty(res)) return 0
    return res[0].endTs || 0
}

async function getAirdropFailedData(startTs) {
    let sql = "select addr, startTs, endTs, betAmount,adAmount, txId from rake_airdrop_log where endTs <= ? and confirmedStatus = 0 order by startTs limit 400"
    let res = await db.exec(sql, [startTs])
    return res
}


async function updateAirdropLogConfirmed(addr, startTs, endTs) {
    let sql = "update rake_airdrop_log set confirmedStatus = 1,status = 1 where addr = ? and startTs = ? and endTs = ?"
    let res = await db.exec(sql, [addr, startTs, endTs])
    return res
}

async function getUserMaxEndTs(addr) {
    let sql = "select max(endTs) endTs from rake_airdrop_log where addr = ?"
    let res = await db.exec(sql, [addr])
    if(_.isEmpty(res)) return 0
    return res[0].endTs || 0
}

async function getUnconfirmedCount() {
    let sql = "select count(1) cnt from rake_airdrop_log where confirmedStatus = 0"
    let res = await db.exec(sql, [])
    if(_.isEmpty(res)) return 0
    return res[0].cnt || 0
}

async function getLiveMakeUpAirdropData() {
    let sql = "select addr, 0 Amount, airDropAmount from makeup_air_drop where status = 0"
    let res = await db.exec(sql, [])
    return res
}


module.exports = {
    getLiveAirdropData,
    liveAirdropLog,
    updateAirdropLog,
    getMaxLogId,
    getMaxEndTs,
    getAirdropFailedData,
    updateAirdropLogConfirmed,
    getUserMaxEndTs,
    getUnconfirmedCount,
    getLiveMakeUpAirdropData
}