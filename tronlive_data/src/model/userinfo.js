const db = require('../utils/dbUtil')
const _ = require('lodash')._

async function getLiveBetData(startTs, endTs) {
    let sql = `select addr, sum(amount) amount, sum(win) win from (select addr, sum(amount) amount, sum(win) win from (select addr, case action when 'bet' then Amount else 0 end as amount, case action when 'result' then Amount else 0 end as win from live_action_log_v2 where ts >= ? and ts < ? and txStatus = 1 and (currency = 'TRX' or currency = 'USDT')) a group by addr
    union all
    select email addr, sum(amount / 1000000) amount, sum(win / 1000000) win  from swagger_transaction_log where ts >= ? and ts < ? and status = 1 and (currency = 'TRX' or currency = 'USDT') group by email) a group by addr;`
    let res = await db.exec(sql, [startTs, endTs, startTs - 600000, endTs - 600000])
    return res
}

async function getLastTs(){
    let sql = "select max(ts) ts from live_bet_info"
    let res = await db.exec(sql, [])
    if(_.isEmpty(res)) return 0
    return res[0].ts || 0
}


async function updateBetInfo(round, addr, amount, win, ts, conn){
    let sql = "insert into live_bet_info(round, addr, amount, win, ts) values(?,?,?,?,?) ON DUPLICATE KEY UPDATE amount = amount + ?, win = win + ?, ts = ?"
    return await db.execTrans(sql, [round, addr, amount * 1e6, win * 1e6, ts, amount * 1e6, win * 1e6, ts], conn)
}

async function getAllLiveBetData(startTs, endTs) {
    let sql = `
    select addr, currency, sum(amount) amount, sum(win) win 
    from (
    
    select addr, currency, sum(amount) amount, sum(win) win from (select addr, currency, case action when 'bet' then Amount else 0 end as amount, case action when 'result' then Amount else 0 end as win from live_action_log_v2 where ts >= ? and ts < ? and txStatus = 1) a group by addr, currency
    
    union all
    
    select email addr, currency,sum(amount / 1000000) amount, sum(win / 1000000) win  from swagger_transaction_log where ts >= ? and ts < ? and status = 1 group by email, currency
    
    union all

    select addr, currency,sum(amount / 1000000) amount, sum(win / 1000000) win  from platipus_transaction_log where ts >= ? and ts < ? and status = 2 group by addr, currency
    
    ) a group by addr, currency
    `
    let res = await db.exec(sql, [
        startTs, 
        endTs, 
        startTs - 600000, 
        endTs - 600000,
        startTs,
        endTs,
    ])
    return res
}

async function updateUserExpr(addr, amount, win, ts, conn){
    let sql = "insert into live_expr(addr, amount, win, ts) values(?,?,?,?) ON DUPLICATE KEY UPDATE amount = amount + ?, win = win + ?, ts = ?"
    return await db.execTrans(sql, [addr, amount * 1e6, win * 1e6, ts, amount * 1e6, win * 1e6, ts], conn)
}

async function getLastExprTs(){
    let sql = "select max(ts) ts from live_expr"
    let res = await db.exec(sql, [])
    if(_.isEmpty(res)) return 0
    return res[0].ts || 0
}

module.exports = {
    getLastTs,
    updateBetInfo,
    getLiveBetData,
    updateUserExpr,
    getAllLiveBetData,
    getLastExprTs
}