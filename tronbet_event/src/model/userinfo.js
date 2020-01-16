const db = require('../utils/dbUtil')
const _ = require('lodash')._
const poker = require('../utils/poker')


async function getLogs(addr){
    let sql = "select * from years_oprate_logs where addr = ? order by log_id desc limit 30;"
    let res = await db.exec(sql, [addr])
    if (_.isEmpty(res)) {
        return []
    }

    let log_ids = []

    res.map(log => {
        log_ids.push(log.log_id)
    })

    let detailSql = "select * from years_log_detail where log_id in (select log_id as logId from (select log_id from years_oprate_logs where addr = ? order by log_id desc limit 30) as tss)"
    let detailRes = await db.exec(detailSql, [addr])
    if (_.isEmpty(detailRes)) {
        return []
    }
    let result = []
    res.map(item => {
        let tmp = {...item}
        let years_log_detail = []
        detailRes.map( detail => {
            let logDetail = {...detail}
            if (detail.log_id == item.log_id) years_log_detail.push(logDetail)
        })
        tmp.baseball_log_detail = years_log_detail
        result.push(tmp)
    })
    return result
}

async function getBags(addr) {
    let sql = "select gid, num from years_user_bag where addr = ?"
    let res = await db.exec(sql, [addr])
    return res
}

async function getScores(addr, round) {
    let sql = "select * from years_suit_score where addr = ? and round = ? "
    let res = await db.exec(sql, [addr, round])
    if (_.isEmpty(res)) return 0
    return res[0].score
}

async function getBoxs(addr) {
    let sql = "select ltyNum, num + freeNum as num from years_box where addr = ?"
    let res = await db.exec(sql, [addr])
    if (_.isEmpty(res)) return {bid: -1, ltyNum: 0, num: 0}
    return res[0]
}

async function getDetailBoxs(addr) {
    let sql = "select num payNum, freeNum from years_box where addr = ?"
    let res = await db.exec(sql, [addr])
    if (_.isEmpty(res)) return {payNum : 0, freeNum : 0}
    return res[0]
}

async function increaseBox(addr, freeNum, totalNum, conn) {
    let payNum = totalNum - freeNum
    if (payNum <= 0) payNum = 0
    let localFree = 0
    let localPay = 0
    if (freeNum < totalNum) {
        localFree = freeNum
        localPay = totalNum - freeNum
    } else {
        localFree = totalNum
        localPay = 0
    }
    let sql = "update years_box set freeNum = freeNum - ?, num = num - ? where addr = ?"
    return await db.execTrans(sql, [localFree, localPay, addr], conn)
}

async function addOverLog(addr, types, num, ts, conn) {
    let sql = "insert into years_oprate_logs(addr, types, num, ts) values (?,?,?,?)"
    let res = await db.execTrans(sql, [addr, types, num, ts], conn)
    return res
}

async function getOverviewMaxId(addr, conn) {
    let sql = "select max(log_id) log_id from years_oprate_logs where addr = ?"
    let res = await db.execTrans(sql, [addr], conn)
    if (_.isEmpty(res)) return 0
    return res[0].log_id
}

async function addDetailLog(logId, gid, num, conn) {
    let sql = "insert into years_log_detail(log_id, gid, num) values (?,?,?)"
    let res = await db.execTrans(sql, [logId, gid, num], conn)
    return res
}

async function addUserBag(addr, gid, num, conn) {
    let sql = "insert into years_user_bag(addr, gid, num) values (?,?,?) ON DUPLICATE KEY update num = num + ?;"
    let res = await db.execTrans(sql ,[addr, gid, num, num], conn)
    return res
}

async function subUserBag(addr, gid, num, conn) {
    let sql = "update years_user_bag set num = num - ? where addr = ? and gid = ?;"
    let res = await db.execTrans(sql ,[num, addr, gid], conn)
    return res
}

async function addPay2UserLog(addr, tx_id, amount, ts, log_id, conn) {
    let sql = "insert into years_pay2user(addr, amount, tx_id, log_id, ts) values(?,?,?,?,?);"
    let res = await db.execTrans(sql ,[addr, amount, tx_id, log_id, ts], conn)
    return res
}

async function updatePay2UserTx(logId, txId) {
    let sql = "update years_pay2user set tx_id = ? where log_id = ?"
    await db.exec(sql, [txId, logId])
}

async function findA2To9Card(addr) {
    let sql = "select gid from years_user_bag where addr = ? and gid <= 31 and num >= 1 limit 1"
    let res = await db.exec(sql, [addr])
    if (_.isEmpty(res)) return -1
    return res[0].gid
}

async function assertExchangeNumber(addr, num , suitId) {
    console.log([addr, num, suitId])
    let sql = "select count(1) cnt from years_user_bag where addr = ? and num >= ? and gid <= ?"
    let res = await db.exec(sql, [addr, num, suitId])
    if (_.isEmpty(res)) return false
    if (res[0].cnt == suitId) return true
    return false
}

async function assertSellNumber(addr, num , gid) {
    let sql = "select count(1) cnt from years_user_bag where addr = ? and num >= ? and gid = ?"
    let res = await db.exec(sql, [addr, num, gid])
    if (_.isEmpty(res)) return false
    if (res[0].cnt == 1) return true
    return false
}


async function assertSpecialSellNumber(addr, num) {
    let sql = "select sum(num) num from years_user_bag where addr = ? and gid >=0 and gid <= 31"
    let res = await db.exec(sql, [addr])
    console.log(res)
    if (_.isEmpty(res)) return false
    if (res[0].num >= num) return true
    return false
}

async function card2To9Nums(addr) {
    let sql = "select num,gid from years_user_bag where addr = ? and gid >=0 and gid <= 31"
    let res = await db.exec(sql, [addr])
    if (_.isEmpty(res)) return []
    return res
}

async function addUserScore(addr, round, score) {
    let sql = 'insert into years_suit_score(round, addr, score) values (?,?,?) ON DUPLICATE KEY update score = score + ?;'
    let res = await db.exec(sql, [round, addr, score, score])
    return res
}

async function addUserLtynum(addr, ltyNum) {
    let sql = "update years_box set ltyNum = ltyNum + ? where addr = ?"
    let res = await db.exec(sql, [ltyNum, addr])
    return res
}

async function allRank(round, limits) {
    let sql = "select * from years_suit_score where round = ? order by score desc limit ?"
    let res = await db.exec(sql, [round, limits])
    return res
}

async function meScore(addr, round) {
    let sql = "select * from years_suit_score where round = ? and addr = ?"
    let res = await db.exec(sql, [round, addr])
    if(_.isEmpty(res)) return 0
    return res[0].score
}

async function meRank(round, score) {
    let sql = "select count(1) cnt from years_suit_score where round = ? and score > ?"
    let res = await db.exec(sql, [round, score])
    if(_.isEmpty(res)) return -1
    return res[0].cnt
}

async function allTotalRank(limits) {
    let sql = "select sum(score) score, addr from years_suit_score group by addr order by sum(score) desc limit ?"
    let res = await db.exec(sql, [limits])
    return res
}

async function meTotalScore(addr) {
    let sql = "select sum(score) score from years_suit_score where addr = ?"
    let res = await db.exec(sql, [addr])
    if(_.isEmpty(res)) return 0
    return res[0].score
}

async function maxRewardRound() {
    let sql = "select max(round) round from years_score_reward_log"
    let res = await db.exec(sql, [])
    if(_.isEmpty(res) || res[0].round == null) return -1
    return res[0].round 
}

async function addDailyRankWardLog(round, addr, score, ante, trx, ts, conn) {
    let sql = "insert into years_score_reward_log(round, addr, score, ante, trx, ts) values (?,?,?,?,?,?)"
    let res = await db.execTrans(sql, [round, addr, score, ante, trx, ts], conn)
    return res
}

async function updateTxidToDailyRankWardLog(round, addr, tx_id) {
    let sql = "update years_score_reward_log set tx_id = ? where round = ? and addr = ?"
    let res = await db.exec(sql, [tx_id, round, addr])
    return res
}

async function betLuckyUser(message) {
    console.log("debug betLuckyUser----------->",message)
    let conn = null
    // return
    try {
        let info = JSON.parse(message)
        let now = new Date().getTime()

        conn = await db.getConnection()
        if (conn == null) {
            console.log('get DB CONNECTION FAILED')
            return
        }

        conn.beginTransaction()
        let order_id = info.order_id
        if(info.game_type == 'moon') {
            order_id = 100000000 + info.order_id
        } else if (info.game_type == 'dice'){
            console.log('----do nothing---')
        } else if (info.game_type == 'ring'){
            order_id = 200000000 + info.order_id
        } else if (info.game_type == 'live'){
            order_id = 300000000 + info.order_id
        }

        let insertSql = "insert into years_bet_order(addr, bet_id, ts, num) values (?,?,?,1)"
        await db.execTrans(insertSql, [info.addr, order_id, now], conn)

        let sql = "insert into years_box(addr, freeNum) values (? ,1) ON DUPLICATE KEY update freeNum = freeNum + 1;"
        await db.execTrans(sql, [info.addr], conn)
        conn.commit()
    } catch (error) {
        if(conn) conn.rollback()
        console.log(error)
    } finally {
        if(conn)conn.release()
    }
}

async function addLotteryLog(addr, ltyId, types, num, txId, conn) {
    let now = new Date().getTime()
    let sql = "insert into years_lottery_log(addr, ltyId, types, num, txId, ts) values(?,?,?,?,?,?);"
    let res = await db.execTrans(sql, [addr, ltyId, types, num, txId, now], conn)
    return res
}

async function decreaseUserLtynum(addr, conn) {
    let sql = "update years_box set ltyNum = ltyNum - 1 where addr = ?"
    let res = await db.execTrans(sql, [addr],conn)
    return res
}

async function getLotLogs(addr, num) {
    let sql = "select * from years_lottery_log where addr = ? order by log_id desc limit ?"
    let res = await db.exec(sql, [addr, num])
    return res
}

module.exports = {
    getLogs,
    getBags,
    getScores,
    getBoxs,
    getDetailBoxs,
    increaseBox,
    addOverLog,
    getOverviewMaxId,
    addDetailLog,
    addUserBag,
    subUserBag,
    addPay2UserLog,
    findA2To9Card,
    assertExchangeNumber,
    addUserScore,
    allRank,
    meRank,
    meScore,
    assertSellNumber,
    maxRewardRound,
    addDailyRankWardLog,
    updateTxidToDailyRankWardLog,
    betLuckyUser,
    allTotalRank,
    meTotalScore,
    assertSpecialSellNumber,
    card2To9Nums,
    addUserLtynum,
    addLotteryLog,
    decreaseUserLtynum,
    updatePay2UserTx,
    getLotLogs
}