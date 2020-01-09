const db2 = require('../utils/dbUtil')
const db1 = require('../utils/diceDbUtil')
const _ = require('lodash')._

const startLogId = 0
const startTs = 1556251200
const intervalTime = 86400


async function getTodayStartTime(){
    let now = Math.floor(new Date().getTime() / 1000)
    let startTime = Math.floor((now - startTs) / intervalTime) * intervalTime + startTs
    return startTime
}

async function getTotalData(game) {
    let sql = "select sum(amount) amount, sum(profit) profit, sum(playCnt), avg(userCnt) userCnt from tron_bet_admin.total_data where game = ?"
    let res = await db1.exec(sql, [game])
    return res
}

async function getDiceTodayData() {
    let startTime = await getTodayStartTime()
    let firstUserSql= "select addr, order_id from tron_bet_admin.dice_user_order where ts > ? limit 1"
    let res = await db1.exec(firstUserSql, [startTime * 1000])
    if(_.isEmpty(res)) return null

    let minLogIdSql = "select log_id from tron_bet_wzc.dice_events_v3 where addr = ? and order_id = ?"
    let minRes = await db1.exec(minLogIdSql, [res[0].addr, res[0].order_id])
    if(_.isEmpty(minRes)) return null

    let resultSql = 'select sum(amount_sun / 1000000) amount, sum(amount_sun / 1000000 - payout_sun / 1000000) profit, count(1) playCnt, count(distinct addr) userCnt from tron_bet_wzc.dice_events_v3 where log_id >= ?'
    let result = await db1.exec(resultSql, [minRes[0].log_id])
    return result
}

async function getTotalDividendsData() {
    let sql = "select sum(total_trx / 1000000) amount from tron_bet_wzc.ante_ver_v1 where ver > 161"
    let res = await db1.exec(sql, [startLogId])
    return res
}

async function getMoonTotalData() {
    let sql = "select sum(amount / 1000000) amount, sum(amount / 1000000 - win / 1000000) profit, 0 userCnt from tron_bet_admin.moon_user_order where ts >= ?"
    let res = await db1.exec(sql, [startTs * 1000])
    return res
}

async function getMoonTodayData() {
    let startTime = await getTodayStartTime()
    let sql = "select sum(amount / 1000000) amount, sum(amount / 1000000 - win / 1000000) profit,count(1) playCnt, count(distinct addr) userCnt from tron_bet_admin.moon_user_order where ts >= ?"
    let res = await db1.exec(sql, [startTime * 1000])
    return res
}

async function getRingTotalData() {
    let sql = "select sum(amount / 1000000) amount, sum(amount / 1000000 - win / 1000000) profit, 0 userCnt from tron_bet_admin.wheel_user_order where ts >= ?"
    let res = await db1.exec(sql, [startTs * 1000])
    return res
}

async function getRingTodayData() {
    let startTime = await getTodayStartTime()
    let sql = "select sum(amount / 1000000) amount, sum(amount / 1000000 - win / 1000000) profit, count(1) playCnt, count(distinct addr) userCnt from tron_bet_admin.wheel_user_order where ts >= ?"
    let res = await db1.exec(sql, [startTime * 1000])
    return res
}

async function getLiveTotalData() {
    let sql = "select sum(amount / 1000000) amount, sum(amount / 1000000 - win /1000000) profit, count(distinct addr) userCnt from tron_live.live_bet_info"
    let res = await db2.exec(sql, [])
    return res
}

async function getLiveTodayData() {
    let startTime = await getTodayStartTime()
    let sql = "select sum(betAmount) amount, sum(betAmount - resultAmount) profit, count(1) playCnt, count(distinct addr) userCnt from (select addr, case action when 'bet' then Amount  else 0 end betAmount, case action when 'result' then Amount  else 0 end resultAmount from live_action_log where ts > ?) a "
    let res = await db2.exec(sql, [startTime * 1000])
    return res
}

async function getDiceRank() {
    let startTime = await getTodayStartTime()
    console.log(startTime, 'startTime')
    let firstUserSql= "select addr, order_id from tron_bet_admin.dice_user_order where ts > ? limit 1"
    let res = await db1.exec(firstUserSql, [startTime * 1000])
    console.log(res, 'res')
    if(_.isEmpty(res)) return null

    let minLogIdSql = "select log_id from tron_bet_wzc.dice_events_v3 where addr = ? and order_id = ?"
    let minRes = await db1.exec(minLogIdSql, [res[0].addr, res[0].order_id])
    console.log(minRes, 'minRes')
    if(_.isEmpty(minRes)) return null

    let todayAmountRankSql = "select amount_sun, addr from (select sum(amount_sun / 1000000) amount_sun, addr from tron_bet_wzc.dice_events_v3 where log_id >= ? group by addr) b order by b.amount_sun desc limit 20"

    let todayProfitRankDescSql = "select profit, addr from (select sum(amount_sun / 1000000 - payout_sun / 1000000) profit, addr from tron_bet_wzc.dice_events_v3 where log_id >= ? group by addr) b order by b.profit desc limit 20"

    let todayProfitRankAscSql = "select profit, addr from (select sum(payout_sun / 1000000 - amount_sun / 1000000) profit, addr from tron_bet_wzc.dice_events_v3 where log_id >= ? group by addr) b order by b.profit desc limit 20"

    let todayBetCntRankSql = "select cnt, addr from (select count(1) cnt, addr from tron_bet_wzc.dice_events_v3 where log_id >= ? group by addr) b order by b.cnt desc limit 20"


    let todayAmountRank = await db1.exec(todayAmountRankSql, [minRes[0].log_id])
    let todayProfitRankDesc = await db1.exec(todayProfitRankDescSql, [minRes[0].log_id])
    let todayProfitRankAsc = await db1.exec(todayProfitRankAscSql, [minRes[0].log_id])
    let todayBetCntRank = await db1.exec(todayBetCntRankSql, [minRes[0].log_id])

    console.log({startLogId,startLogId})
    let totalAmountRank = await db1.exec(todayAmountRankSql, [startLogId])
    let totalProfitRankDesc = await db1.exec(todayProfitRankDescSql, [startLogId])
    let totalProfitRankAsc = await db1.exec(todayProfitRankAscSql, [startLogId])
    let totalBetCntRank = await db1.exec(todayBetCntRankSql, [startLogId])


    return {
        todayAmountRank,
        todayProfitRankDesc,
        todayProfitRankAsc,
        todayBetCntRank,
        totalAmountRank,
        totalProfitRankDesc,
        totalProfitRankAsc,
        totalBetCntRank
    }
}

async function getRingRank() {
    let startTime = await getTodayStartTime()
    let todayAmountRankSql = "select amount_sun, addr from (select sum(amount / 1000000) amount_sun, addr from tron_bet_admin.wheel_user_order where ts >= ? group by addr) b order by b.amount_sun desc limit 20"

    let todayProfitRankDescSql = "select profit, addr from (select sum(amount / 1000000 - win / 1000000) profit, addr from tron_bet_admin.wheel_user_order where ts >= ? group by addr) b order by b.profit desc limit 20"

    let todayProfitRankAscSql = "select profit, addr from (select sum(win / 1000000 - amount / 1000000) profit, addr from tron_bet_admin.wheel_user_order where ts >= ? group by addr) b order by b.profit desc limit 20"

    let todayBetCntRankSql = "select cnt, addr from (select count(1) cnt, addr from tron_bet_admin.wheel_user_order where ts >= ? group by addr) b order by b.cnt desc limit 20"


    let todayAmountRank = await db1.exec(todayAmountRankSql, [startTime * 1000])
    let todayProfitRankDesc = await db1.exec(todayProfitRankDescSql, [startTime * 1000])
    let todayProfitRankAsc = await db1.exec(todayProfitRankAscSql, [startTime * 1000])
    let todayBetCntRank = await db1.exec(todayBetCntRankSql, [startTime * 1000])

    
    let totalAmountRank = await db1.exec(todayAmountRankSql, [startTs * 1000])
    let totalProfitRankDesc = await db1.exec(todayProfitRankDescSql, [startTs * 1000])
    let totalProfitRankAsc = await db1.exec(todayProfitRankAscSql, [startTs * 1000])
    let totalBetCntRank = await db1.exec(todayBetCntRankSql, [startTs * 1000])

    return {
        todayAmountRank,
        todayProfitRankDesc,
        todayProfitRankAsc,
        todayBetCntRank,
        totalAmountRank,
        totalProfitRankDesc,
        totalProfitRankAsc,
        totalBetCntRank
    }
}


async function getMoonRank() {
    let startTime = await getTodayStartTime()
    let todayAmountRankSql = "select amount_sun, addr from (select sum(amount / 1000000) amount_sun, addr from tron_bet_admin.moon_user_order where ts >= ? group by addr) b order by b.amount_sun desc limit 20"

    let todayProfitRankDescSql = "select profit, addr from (select sum(amount / 1000000 - win / 1000000) profit, addr from tron_bet_admin.moon_user_order where ts >= ? group by addr) b order by b.profit desc limit 20"

    let todayProfitRankAscSql = "select profit, addr from (select sum(win / 1000000 - amount / 1000000) profit, addr from tron_bet_admin.moon_user_order where ts >= ? group by addr) b order by b.profit desc limit 20"

    let todayBetCntRankSql = "select cnt, addr from (select count(1) cnt, addr from tron_bet_admin.moon_user_order where ts >= ? group by addr) b order by b.cnt desc limit 20"


    let todayAmountRank = await db1.exec(todayAmountRankSql, [startTime * 1000])
    let todayProfitRankDesc = await db1.exec(todayProfitRankDescSql, [startTime * 1000])
    let todayProfitRankAsc = await db1.exec(todayProfitRankAscSql, [startTime * 1000])
    let todayBetCntRank = await db1.exec(todayBetCntRankSql, [startTime * 1000])

    
    let totalAmountRank = await db1.exec(todayAmountRankSql, [startTs * 1000])
    let totalProfitRankDesc = await db1.exec(todayProfitRankDescSql, [startTs * 1000])
    let totalProfitRankAsc = await db1.exec(todayProfitRankAscSql, [startTs * 1000])
    let totalBetCntRank = await db1.exec(todayBetCntRankSql, [startTs * 1000])

    return {
        todayAmountRank,
        todayProfitRankDesc,
        todayProfitRankAsc,
        todayBetCntRank,
        totalAmountRank,
        totalProfitRankDesc,
        totalProfitRankAsc,
        totalBetCntRank
    }
}

async function getRealProfit() {
    // let sqlAnte = "select sum(trx / 1000000) amount from tron_bet_wzc.ante_dividends_v1 where ver > 162 and addr in ('TTVXdGayK5KdURA4gMfa6eDZtMwqUDc9ZT','TFLYd2Bk7CtsfQFpLnm2fKp2CsSwTDGmx2')"
    // let res1 = await db1.exec(sqlAnte, [])
    let res1 = [{
        amount : 0
    }]

    let sqlLive = "select sum(trx / 1000000) amount from live_div_detail where addr = 'TFLYd2Bk7CtsfQFpLnm2fKp2CsSwTDGmx2'"
    let res2 = await db2.exec(sqlLive, [])

    let sqlRank = 'select sum(rank_trx / 1000000) amount from live_div_info'
    let res3 = await db2.exec(sqlRank, [])
    console.log('----res1[0].amount + res2[0].amount + res3[0].amount', res1[0].amount , res2[0].amount , res3[0].amount)
    return Math.floor(Number(res1[0].amount) + Number(res2[0].amount) + Number(res3[0].amount))
}


async function getDiceDataByDate(startTs, endTs) {
    let firstUserSql= "select addr, order_id from tron_bet_admin.dice_user_order where ts > ? limit 1"
    let res = await db1.exec(firstUserSql, [startTs])
    if(_.isEmpty(res)) return null

    let minLogIdSql = "select log_id from tron_bet_wzc.dice_events_v2 where addr = ? and order_id = ?"
    let minRes = await db1.exec(minLogIdSql, [res[0].addr, res[0].order_id])
    if(_.isEmpty(minRes)) return null

    let lastUserOrder = await db1.exec(firstUserSql, [endTs])
    if (_.isEmpty(lastUserOrder)) return null

    let maxRes = await db1.exec(minLogIdSql, [lastUserOrder[0].addr, lastUserOrder[0].order_id])
    if(_.isEmpty(maxRes)) return null

    let resultSql = 'select sum(amount_sun / 1000000) amount, sum(amount_sun / 1000000 - payout_sun / 1000000) profit, count(1) playCnt, count(distinct addr) userCnt from tron_bet_wzc.dice_events_v2 where log_id >= ? and log_id < ?'
    let result = await db1.exec(resultSql, [minRes[0].log_id, maxRes[0].log_id])
    return result
}

async function getMoonDataByDate(startTs, endTs) {
    let startTime = await getTodayStartTime()
    let sql = "select sum(amount / 1000000) amount, sum(amount / 1000000 - win / 1000000) profit,count(1) playCnt, count(distinct addr) userCnt from tron_bet_admin.moon_user_order where ts >= ? and ts <= ?"
    let res = await db1.exec(sql, [startTs, endTs])
    return res
}

async function getRingDatabyDate(startTs, endTs) {
    let sql = "select sum(amount / 1000000) amount, sum(amount / 1000000 - win / 1000000) profit, count(1) playCnt, count(distinct addr) userCnt from tron_bet_admin.wheel_user_order where ts >= ? and ts <= ?"
    let res = await db1.exec(sql, [startTs, endTs])
    return res
}

async function getLiveDatabyDate(startTs, endTs) {
    let sql = "select sum(betAmount) amount, sum(betAmount - resultAmount) profit, count(1) / 2 playCnt, count(distinct addr) userCnt from (select addr, case action when 'bet' then Amount  else 0 end betAmount, case action when 'result' then Amount  else 0 end resultAmount from live_action_log where ts > ? and ts <= ?) a "
    let res = await db2.exec(sql, [startTs, endTs])
    return res
}

async function updateDayData(ts, day, game, amount, profit, playCnt, userCnt) {
    let sql = "insert into tron_bet_admin.total_data(ts, days, game, amount, profit, playCnt, userCnt) values(?,?,?,?,?,?,?)"
    let res = await db1.exec(sql, [ts, day, game, amount, profit, playCnt, userCnt])
}

async function getMaxDay() {
    let sql = 'select max(days) days from tron_bet_admin.total_data'
    let res = await db1.exec(sql, [])
    if (_.isEmpty(res)) return 0
    return res[0].days || 0
}

async function getDailyData(game) {
    let sql = "select from_unixtime(ts / 1000 + 43200, '%Y-%m-%d') ts, days, game, amount, profit, round(profit * 100/ amount, 2) housedge, playCnt, userCnt from tron_bet_admin.total_data where game = ? order by ts desc limit 60"
    return await db1.exec(sql, [game])
}

async function getAdminUser(username, passwd) {
    let sql = "select * from user where username = ? and passwd = ?"
    return await db1.exec(sql, [username, passwd])
}

async function getUserTransaction(addr, txId, stime, etime, cate, page) {
    let sql = "select  a.*, b.tx_id, b.ts, b.sign, 1 types from \
        (select addr, order_id, direction, number, roll, amount_sun, payout_sun from \
            dice_events_v3 where addr = ?  order by order_id desc limit 20000) a \
        join (select tx_id, addr, ts,order_id, sign from tron_bet_admin.dice_user_order where (addr = ? or tx_id = ?) and ts > ? and ts < ? order by order_id desc limit 20000) b \
        on a.addr = b.addr and a.order_id = b.order_id  order by a.order_id desc limit ?, 20"
    
    let res = await db1.exec(sql, [addr, addr, txId, page])
}

async function addNotice(title, language, content) {
    let now = Number(new Date().getTime() / 1000)
    let sql = "insert into tron_bet_admin.update_notice(title, language, content, update_time) values(?,?,?,?)"
    return await db1.exec(sql, [title, language, content, now])
}

async function getNotice(language) {
    let sql = "select * from tron_bet_admin.update_notice where language = ? order by update_time desc limit 1"
    return await db1.exec(sql, [language])
}

async function getLiveGroupDatabyDate(startTs, endTs) {
    let sql = "select EMGameId, sum(betAmount) amount, sum(betAmount - resultAmount) profit, count(1) / 2 playCnt, count(distinct addr) userCnt from (select EMGameId, addr, case action when 'bet' then Amount  else 0 end betAmount, case action when 'result' then Amount  else 0 end resultAmount from live_action_log where ts > ? and ts <= ?) a group by EMGameId"
    let res = await db2.exec(sql, [startTs, endTs])
    return res
}

async function updateLiveGroupDayData(ts, day,cate, game, amount, profit, playCnt, userCnt) {
    let sql = "insert into tron_bet_admin.live_group_data(ts, days,cate, game, amount, profit, playCnt, userCnt) values(?,?,?,?,?,?,?,?)"
    let res = await db1.exec(sql, [ts, day,cate, game, amount, profit, playCnt, userCnt])
}

async function getDailyLiveDataByGame(game) {
    let sql = "select from_unixtime(ts / 1000 + 43200, '%Y-%m-%d') ts, days, game, amount, profit, round(profit * 100/ amount, 2) housedge, playCnt, userCnt from tron_bet_admin.live_group_data where game = ? order by ts desc limit 60"
    return await db1.exec(sql, [game])
}

async function getDailyLiveDataByCate(cate) {
    let sql = "select from_unixtime(ts / 1000 + 43200, '%Y-%m-%d') ts, days, cate game, sum(amount) amount, sum(profit) profit, round(sum(profit) * 100/ sum(amount), 2) housedge, sum(playCnt) playCnt, sum(userCnt) userCnt from tron_bet_admin.live_group_data where cate = ? group by ts, days, cate order by ts desc limit 60"
    return await db1.exec(sql, [cate])
}

async function getCates() {
    let sql = "select distinct cate from tron_bet_admin.live_group_data"
    return await db1.exec(sql, [])
}

async function getGames(cate) {
    let sql = ""
    if (cate) {
        sql = "select distinct game from tron_bet_admin.live_group_data where cate = ?"
        return await db1.exec(sql, [cate])
    } else {
        sql = "select distinct game from tron_bet_admin.live_group_data"
        return await db1.exec(sql, [])
    }
    
}

async function getTodayPokerData() {
    let todayStartTs = await getTodayStartTime()
    let sql = "select sum(amount / 1000000) amount, count(1) playCnt, count(distinct addr) userCnt from tronpoker_log.poker_revenue_log where (action = 110 or action = 1) and optime > ?"
    let res = db2.exec(sql, [todayStartTs])
    return res
}

async function getTotalPokrtData() {
    let sql = "select sum(amount / 1000000) amount, count(1) playCnt, count(distinct addr) userCnt from tronpoker_log.poker_revenue_log where action = 110 or action = 1"
    let res = db2.exec(sql, [])
    return res
}

async function getPokerDatabyDate(startTs, endTs) {
    let sql = "select sum(amount / 1000000) amount, count(1) playCnt, count(distinct addr) userCnt from tronpoker_log.poker_revenue_log where (action = 110 or action = 1) and optime > ? and optime <= ?"
    let res = await db2.exec(sql, [startTs, endTs])
    return res
}

async function checkDiceAddressIsExist(addr) {
    //
    let sql1 = "select * from tron_bet_admin.dice_user_order where addr = ? limit 0,1"
    let res1 = await db2.exec(sql1, [addr])
    //
    let sql2 = "select * from tron_bet_admin.moon_user_order where addr = ? limit 0,1"
    let res2 = await db2.exec(sql2, [addr])
    //
    let sql3 = "select * from tron_bet_admin.wheel_user_order where addr = ? limit 0,1"
    let res3 = await db2.exec(sql3, [addr])
    //
    let s = [res1, res2, res3].some(e => e.length === 1)
    // console.log("debug------1,",res1)
    // console.log("debug------2,",res2)
    // console.log("debug------3,",res3)
    // console.log("debug-dice-----4,",s)
    return s
}


async function checkAddressIsExist(addr) {
    //
    let sql1 = "select * from tronbet_poker_log.poker_revenue_log where addr = ? limit 0,1"
    let res1 = await db2.exec(sql1, [addr])
    //
    let sql2 = "select * from tron_live.live_login_log where addr = ? limit 0,1"
    let res2 = await db2.exec(sql2, [addr])
    //
    let diceExist = await checkDiceAddressIsExist(addr)
    //
    let s = [res1, res2].some(e => e.length === 1)
    //
    // console.log("debug------poker1,",res1)
    // console.log("debug------live2,",res2)
    // console.log("debug------p+l,3,",s)
    // console.log("debug------last,",s || diceExist)
    return s || diceExist
}


async function addActivityCount(type, address ,ts) {
    // create table 时需要加自增长的 id为主键
    let sql = "insert into tron_bet_admin.activity_count(type,address ,ts) values(?,?,?)"
    await db1.exec(sql, [type, address ,ts])
}




module.exports = {
    getDiceTodayData,
    getTotalDividendsData,
    getMoonTotalData,
    getMoonTodayData,
    getRingTotalData,
    getRingTodayData,
    getLiveTotalData,
    getLiveTodayData,
    getDiceRank,
    getRingRank,
    getMoonRank,
    getRealProfit,
    getDiceDataByDate,
    getMoonDataByDate,
    getRingDatabyDate,
    getLiveDatabyDate,
    updateDayData,
    getMaxDay,
    getDailyData,
    getTotalData,
    getAdminUser,
    getUserTransaction,
    addNotice,
    getNotice,
    getLiveGroupDatabyDate,
    updateLiveGroupDayData,
    getDailyLiveDataByGame,
    getDailyLiveDataByCate,
    getCates,
    getGames,
    getTodayPokerData,
    getTotalPokrtData,
    getPokerDatabyDate,
    checkAddressIsExist,
    addActivityCount
}