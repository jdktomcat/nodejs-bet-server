const db = require('../utils/dbUtil')
const _ = require('lodash')._

const dividendsDuration = 86400
const daystart = 18005

async function getUserBalance(addr) {
    let sql = "select round(trx / 1000000, 3) as trx from live_user where addr = ?"
    let res = await db.exec(sql, [addr])
    if (!_.isEmpty(res)) {
        return res[0].trx
    }
    return null
}
/*
    根据地址获取live_balance_audi，判断用户的资产和流水是否能够对的上，如果对不上将不允许提现
    如果flag是normal 则是正常的，其他不允许通过
    malicious 异常
 */
async function getUserAuditFlag(addr) {
    let sql = "select flag from live_balance_audit where addr= ?";
    let res=await db.exec(sql, ['' + addr]);
    if (!_.isEmpty(res)) {
        return res[0].flag;
    }
    return 'normal';//如果没有记录，默认是正常的用户
}

async function getUserBalanceBySessionId(sessionId) {
    let sql = "select round(trx / 1000000, 3) as trx from live_user where sessionId = ?"
    let res = await db.exec(sql, [sessionId])
    console.log(res)
    if (!_.isEmpty(res)) {
        return res[0].trx
    }
    return null
}

async function userRegister(addr, nickName) {
    let sql = "insert into live_account(email, nickName, currency) values (?, ?, ?)"
    let res = await db.exec(sql, [addr, nickName, 'TRX'])

    let uidSql = "select * from live_account where email = ?"
    let user = await db.exec(uidSql, [addr])

    let addBalanceSql = "insert into live_balance(uid, addr, currency, tag) values (?,?,?,?) on DUPLICATE KEY UPDATE addr = ?, tag = ?"
    await db.exec(addBalanceSql, [user[0].uid, addr, 'TRX', '', addr, ''])
    return user
}

async function userLoginLog(addr) {
    let now = new Date().getTime()
    let sql = "insert into live_login_log(addr, ts) values(?,?)"
    let res = await db.exec(sql, [addr, now])
    return res
}

async function updateSessionId(addr, sessionId) {
    let now = new Date().getTime()
    let sql = "update live_account set sessionId = ?, loginTs = ? where email = ?"
    let res = await db.exec(sql, [sessionId, now, addr])
    return res
}

async function updateUserKey(addr, userKey) {
    let now = new Date().getTime()
    let sql = "update live_account set userKey = ?, loginTs = ? where email = ?"
    let res = await db.exec(sql, [userKey, now, addr])
    return res
}

async function userAction(AccountId, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, action, AddsAmount, uid, currency, conn) {
    //update balance
    // let updateSql = "update live_balance set balance = balance - ? where uid = ? and currency = ?"
    // if (action === 'result') {
    //     updateSql = "update live_balance set balance = balance + ? where uid = ? and currency = ?"
    // }
    // await db.execTrans(updateSql, [Amount * 1e6, uid, currency], conn)
    //
    // let now = new Date().getTime()
    // let sql = "insert into live_action_log_v2(addr, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, action, ts, AddsAmount, currency) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    // let res = await db.execTrans(sql, [AccountId, RoundId, EMGameId, GPGameId, GPId, '' + TransactionId, RoundStatus, Amount, Device, txId, action, now, AddsAmount, currency], conn)
    // return res
}

async function userRollBack(AccountId, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, action, uid, currency, conn) {
    // let updateSql = ''
    // if (action == 'rbbet') {
    //     updateSql = "update live_balance set balance = balance + ? where uid = ? and currency = ?"
    // } else if (action == 'rbresult') {
    //     updateSql = "update live_balance set balance = balance - ? where uid = ? and currency = ?"
    // }
    // await db.execTrans(updateSql, [Amount * 1e6, uid, currency], conn)
    //
    // let updateStatusSql = "update live_action_log_v2 set txStatus = txStatus - 1 where addr = ? and TransactionId = ?"
    // await db.execTrans(updateStatusSql, [AccountId, '' + TransactionId], conn)
    //
    // let now = new Date().getTime()
    // console.log({ AccountId, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, action })
    // let sql = "insert into live_action_log_v2(addr, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, action, ts, currency) values(?,?,?,?,?,?,?,?,?,?,?,?,?)"
    // let res = await db.execTrans(sql, [AccountId, RoundId, EMGameId, GPGameId, GPId, 'rb' + TransactionId, RoundStatus, Amount, Device, txId, action, now, currency], conn)
    // return res
}

async function getTransactionById(TransactionId) {
    let sql = "select * from live_action_log_v2 where TransactionId = ?"
    return await db.exec(sql, ['' + TransactionId])
}

async function finishedWithdrawLog(addr, txId, orderId) {
    let sql = "update live_cb_withdraw_log set txId = ?, endTs = ? where orderId = ? and addr = ?"
    let now = new Date().getTime()
    let res = await db.exec(sql, [txId, now, orderId, addr])
    return res
}

async function findTodayWithdrawTimes(addr) {
    let now = new Date().getTime()
    let todayStime = now - 86400000
    let sql = "select count(1) cnt from live_cb_withdraw_log where email = ? and startTs >= ?"
    let res = await db.exec(sql, [addr, todayStime])
    return res[0].cnt
}

async function findTodayWithdrawAmount(addr, currency) {
    let now = new Date().getTime()
    let todayStime = now - 86400000
    let sql = "select sum(amount) amount from live_cb_withdraw_log where email = ? and startTs >= ? and currency = ?"
    let res = await db.exec(sql, [addr, todayStime, currency])
    return res[0].amount || 0
}

async function findTodayTotalWithdrawAmount(currency) {
    let now = new Date().getTime()
    let todayStime = now - 86400000
    let sql = "select sum(amount) amount from live_cb_withdraw_log where startTs >= ? and currency = ?"
    let res = await db.exec(sql, [todayStime, currency])
    return res[0].amount || 0
}

async function getAccountBySessionId(sessionId) {
    let sql = "select * from live_account where sessionId = ?"
    let res = await db.exec(sql, [sessionId])
    return res
}

async function getUserActionLog(adrr, actionId) {
    let sql = "select * from live_action_log_v2 where addr = ? and actionId = ?"
    let res = await db.exec(sql, [addr, actionId])
    return res
}

async function generateFreespins(addr, issuseId, exprTs, num, status) {
    let sql = "insert into live_freespins(addr, issuseId, exprTs, num, status, ts) values(?,?,?,?,?,?)"
    let now = new Date().getTime()
    let res = await db.exec(sql, [addr, issuseId, exprTs, num, status, now])
    return res
}

async function cancelFreespins(issuseId) {
    let sql = "update live_freespins set status = 'canceled', ts = ? where issuseId = ?"
    let now = new Date().getTime()
    let res = await db.exec(sql, [now, issuseId])
    return res
}


async function getUserIdByIssuseId(issuseId) {
    let sql = "select addr from live_freespins where issuseId = ?"
    let res = await db.exec(sql, [issuseId])
    return res
}

async function getSportsProfit(startTs, endTs) {
    let sql = `SELECT SUM(amount / 1000000 - win / 1000000) amount
    FROM sports_transaction_log
    WHERE ts >= ? AND ts < ? AND (status = 50 or status = 51) AND currency = 'TRX'`
    let res = await db.exec(sql, [startTs, endTs])
    if (_.isEmpty(res)) return 0
    return res[0].amount || 0
}

async function getSwaggerProfit(startTs, endTs) {
    let sql = `SELECT SUM(amount / 1000000 - win / 1000000) amount
    FROM swagger_transaction_log
    WHERE ts >= ? AND ts < ? AND status = 1 AND currency = 'TRX'`
    let res = await db.exec(sql, [startTs - 2 * 60 * 1000, endTs - 2 * 60 * 1000])
    if (_.isEmpty(res)) return 0
    return res[0].amount || 0
}


async function getPlatiusProfit(startTs, endTs) {
    let sql = `SELECT SUM(amount / 1000000 - win / 1000000) amount
    FROM platipus_transaction_log
    WHERE ts >= ? AND ts < ? AND status = 2 AND currency = 'TRX' and resultId is not null`
    let res = await db.exec(sql, [startTs - 2 * 60 * 1000, endTs - 2 * 60 * 1000])
    if (_.isEmpty(res)) return 0
    return res[0].amount || 0
}


async function getBinaryProfit(startTs, endTs) {
    let sql = `SELECT SUM(amount / 1000000 - win / 1000000) amount
    FROM binary_transaction_log
    WHERE expiration_date >= ? AND expiration_date < ? AND status = 'close' AND currency = 'TRX'`
    // console.log(sql,[startTs, endTs])
    let res = await db.exec(sql, [startTs, endTs])
    if (_.isEmpty(res)) return 0
    return res[0].amount || 0
}

async function getLiveFix(){
    const sql2 = `select sum(amount) as sum from tron_live.live_fix_log`
    const rs = await db.exec(sql2, []);
    const sum = rs[0].sum || 0
    return sum
}

async function addLiveFix(fixNumber){
    const ramNumer = 50000 * Math.random()
    const nn = parseInt(fixNumber) + parseInt(ramNumer)
    console.log(nn)
    const sql2 = `insert into tron_live.live_fix_log (amount,ts) values (?,?)`
    await db.exec(sql2, [nn,Date.now()]);
}

async function getRealTimeProfitAmount(ts) {
    let startTs = (Math.floor(ts / dividendsDuration)) * dividendsDuration * 1000
    let endTs = ts * 1000
    let now = Math.floor(new Date().getTime() / 1000)
    let sql = "select sum(Amount) amount from live_action_log_v2 where ts >= ? and ts < ? and action = ? and txStatus = 1 and currency = 'TRX'"
    let betAmount = await db.exec(sql, [startTs, endTs * 10, 'bet'])
    let resultAmount = await db.exec(sql, [startTs, endTs * 10, 'result'])
    let soportsRealTimeProfit = await getSportsProfit(startTs, endTs * 10)
    // let swaggerRealProfit = await getSwaggerProfit(startTs, now)
    // let swaggerRealProfit = await getSwaggerProfit(startTs, endTs * 10)

    let swaggerRealProfit = await getSwaggerProfit(startTs, endTs)
    let platiusProfit = await getPlatiusProfit(startTs, endTs)
    // add in 2020-04-28
    let binaryProfit = await getBinaryProfit(startTs,endTs)
    //
    console.log("hub88，Platius,binaryProfit start is ", new Date(startTs),', ', new Date(endTs));
    console.log("em start is ", new Date(startTs),', ', new Date(endTs * 10));
    console.log("sport start is ", new Date(startTs),', ', new Date(endTs * 10));
    //
    // console.log("swaggerRealProfit====>bug", swaggerRealProfit);
    let lastDay = Math.floor(ts / dividendsDuration) - 1
    if (lastDay >= 0) {
        let hasYestodayProfit = await hasLastDayProfit(lastDay)
        if (!hasYestodayProfit) {
            // 插入
            let lastBetAmount = await db.exec(sql, [startTs - 86400000, startTs, 'bet'])
            let lastResultAmount = await db.exec(sql, [startTs - 86400000, startTs, 'result'])

            if (_.isEmpty(lastBetAmount)) {
                lastBetAmount = 0
            } else {
                lastBetAmount = lastBetAmount[0].amount || 0
            }

            if (_.isEmpty(lastResultAmount)) {
                lastResultAmount = 0
            } else {
                lastResultAmount = lastResultAmount[0].amount || 0
            }
            const emProfitAmount = Number(lastBetAmount) - Number(lastResultAmount)
            let sportsProfitAmount = await getSportsProfit(startTs - 86400000, startTs)
            let swaggerProfitAmount = await getSwaggerProfit(startTs - 86400000, startTs)
            let platiusProfitAmount = await getPlatiusProfit(startTs - 86400000, startTs)
            let binaryProfitAmount = await getBinaryProfit(startTs - 86400000, startTs)
            //
            console.log("lastday startTs is",startTs)
            console.log(`
            lastDay emProfitAmount: ${Number(lastBetAmount)} - ${Number(lastResultAmount)} = ${emProfitAmount}
            lastDay sportsProfitAmount: ${Number(sportsProfitAmount)}
            lastDay swaggerProfitAmount: ${Number(swaggerProfitAmount)}
            lastDay platiusProfitAmount: ${Number(platiusProfitAmount)}
            lastDay binaryProfitAmount: ${Number(binaryProfitAmount)}
            `
            )
            const lastDayAmountSumTmp = [
                emProfitAmount,
                sportsProfitAmount,
                swaggerProfitAmount,
                platiusProfitAmount,
                binaryProfitAmount,
            ]
            const lastDayAmountSumTmp2 = lastDayAmountSumTmp.reduce((accumulator, currentValue) => Number(accumulator) + Number(currentValue))
            const lastDayAmountSum = Math.floor(Number(lastDayAmountSumTmp2))
            console.log("lastDayAmountSum is ",lastDayAmountSum)
            await insertLastDay(lastDay, lastDayAmountSum)
        }
    }

    let lastTotalProfit = await getHistDaysProfit()

    if (!_.isEmpty(betAmount)) {
        betAmount = betAmount[0].amount || 0
    } else {
        betAmount = 0
    }

    if (!_.isEmpty(resultAmount)) {
        resultAmount = resultAmount[0].amount || 0
    } else {
        resultAmount = 0
    }

    // console.log('lastTotalProfit,totalDividends ++++>', lastTotalProfit,totalDividends)
    let totalDividends = await getDividendsAmount()
    console.log(`
        lastTotalProfit - totalDividends: ${lastTotalProfit} - ${totalDividends} = ${Number(lastTotalProfit)- Number(totalDividends)},
        betAmount - resultAmount : ${betAmount} - ${resultAmount} = ${Number(betAmount)- Number(resultAmount)},
        sportsRealTimeProfit : ${soportsRealTimeProfit},
        swaggerRealProfit : ${swaggerRealProfit},
        platiusProfit : ${platiusProfit},
        binaryProfit  : ${binaryProfit}
        `
    )
    const realTimeAmountSumTmp = [
        Number(lastTotalProfit) - Number(totalDividends),
        Number(betAmount) - Number(resultAmount),
        soportsRealTimeProfit,
        swaggerRealProfit,
        platiusProfit,
        binaryProfit
    ]
    const realTimeAmountSumTmp2 = realTimeAmountSumTmp.reduce((accumulator, currentValue) => Number(accumulator) + Number(currentValue))
    const last = Math.floor(Number(realTimeAmountSumTmp2))
    console.log(`trx last is ------> ${last} \n`)
    return last
}
async function insertLastDay(day, amount) {
    let sql = "insert into live_profit_log(days, profit) values(?,?)"
    let res = await db.exec(sql, [day, amount * 1e6])
    return res
}

async function hasLastDayProfit(day) {
    let sql = "select profit from live_profit_log where days = ?"
    let res = await db.exec(sql, [day])
    if (_.isEmpty(res)) return false
    return true
}

async function getHistDaysProfit() {
    let sql = "select sum(profit / 1000000) profit from live_profit_log"
    let res = await db.exec(sql, [])
    if (_.isEmpty(res)) return 0
    return res[0].profit || 0
}

async function getDividendsAmount() {
    let sql = "select sum(total_trx / 1000000 + rank_trx / 1000000) trx from live_div_info"
    let res = await db.exec(sql, [])
    if (_.isEmpty(res)) return 0
    return res[0].trx || 0
}

async function getSportsTRC20Profit(startTs, endTs, currency) {
    let sql = `SELECT SUM(amount / 1000000 - win / 1000000) amount
      FROM sports_transaction_log
      WHERE ts >= ? AND ts < ? AND status >= 50 AND currency = '${currency}'`;
    let res = await db.exec(sql, [startTs, endTs]);
    if (_.isEmpty(res)) return 0;
    return res[0].amount || 0;
  }

async function getBinaryTRC20Profit(startTs, endTs, currency) {
    let sql = `SELECT SUM(amount / 1000000 - win / 1000000) amount
    FROM binary_transaction_log
    WHERE expiration_date >= ? AND expiration_date < ? AND status = 'close' AND currency = '${currency}'`
    // console.log(sql,[startTs, endTs])
    let res = await db.exec(sql, [startTs, endTs])
    if (_.isEmpty(res)) return 0
    return res[0].amount || 0
}

  async function getRealTimeUSDProfitAmount(ts) {
    let startTs = Math.floor(ts / dividendsDuration) * dividendsDuration * 1000;
    let endTs = ts * 1000;
      //
    console.log("usdt start is ", new Date(startTs),', ', new Date(endTs));
      //
    let currency = 'USDT';
    let sportsRealTimeProfit = await getSportsTRC20Profit(startTs, endTs * 10, currency);
    let binaryRealTimeProfit = await getBinaryTRC20Profit(startTs, endTs * 10, currency)
    let lastDay = Math.floor(ts / dividendsDuration) - 1;
    if (lastDay >= 0) {
      let hasYestodayProfit = await hasLastDayTRC20Profit(lastDay, currency);
      if (!hasYestodayProfit) {
        let sportsProfitAmount = await getSportsTRC20Profit(startTs - 86400000, startTs, currency);
        let binaryProfitAmount = await getBinaryTRC20Profit(startTs - 86400000, startTs, currency);
        console.log(`
        lastday ts is : ${startTs} , ${new Date(startTs)}
        sportsProfitAmount : ${sportsProfitAmount},
        binaryProfitAmount : ${binaryProfitAmount},
        `);
        const lastDayAmountSumTmp = [
            sportsProfitAmount,
            // binaryProfitAmount,
        ]
        const lastDayAmountSumTmp2 = lastDayAmountSumTmp.reduce((accumulator, currentValue) => Number(accumulator) + Number(currentValue))
        const lastDayAmountSum = Math.floor(Number(lastDayAmountSumTmp2))
        console.log("lastDayAmountSum is ",lastDayAmountSum)
        await insertTRC20LastDay(lastDay, lastDayAmountSum, currency);
      }
    }

    let lastTotalProfit = await getHistDaysTRC20Profit(currency);

    let totalDividends = await getDividendsTRC20Amount(currency);
    console.log(`
        lastTotalProfit - totalDividends : ${lastTotalProfit} - ${totalDividends} = ${Number(lastTotalProfit)- Number(totalDividends)},
        sportsRealTimeProfit: ${sportsRealTimeProfit},
        binaryRealTimeProfit: ${binaryRealTimeProfit},
        `
    )
    const realTimeAmountSumTmp = [
        Number(lastTotalProfit) - Number(totalDividends),
        sportsRealTimeProfit,
        // binaryRealTimeProfit,
    ]
    const realTimeAmountSumTmp2 = realTimeAmountSumTmp.reduce((accumulator, currentValue) => Number(accumulator) + Number(currentValue))
    const last = Math.floor(Number(realTimeAmountSumTmp2))
    console.log(`usdt last is ------> ${last} \n`)
    return last
  }

  async function insertTRC20LastDay(day, amount, currency) {
    let sql = 'INSERT INTO live_trc20_profit_log(days, profit, currency) VALUES (?, ?, ?)';
    let res = await db.exec(sql, [day, amount * 1e6, currency]);
    return res;
  }

  async function hasLastDayTRC20Profit(day, currency) {
    let sql = 'SELECT profit FROM live_trc20_profit_log WHERE days = ? AND currency = ?';
    let res = await db.exec(sql, [day, currency]);
    if (_.isEmpty(res)) return false;
    return true;
  }

  async function getHistDaysTRC20Profit(currency) {
    let sql = 'SELECT SUM(profit / 1000000) profit FROM live_trc20_profit_log WHERE currency = ?';
    let res = await db.exec(sql, [currency]);
    if (_.isEmpty(res)) return 0;
    return res[0].profit || 0;
  }

  async function getDividendsTRC20Amount(currency) {
    let sql = 'SELECT SUM(amount / 1000000) trx FROM live_trc20_div_info WHERE currency = ?';
    let res = await db.exec(sql, [currency]);
    if (_.isEmpty(res)) return 0;
    return res[0].trx || 0;
  }

async function getUserWithDrawStatus(addr, orderId) {
    let sql = "select status from live_cb_withdraw_log where orderId = ? and email = ?"
    let res = await db.exec(sql, [orderId, addr])
    return res
}

async function getAmountRankData(round) {
    let sql = `select addr, amount / 1000000 amount from live_bet_info
               where round = ? and addr not in (select addr from live_balance_audit where flag = 'malicious')
               order by amount desc limit 20`
    let res = await db.exec(sql, [round])
    return res
}

async function getProfitRankData(round) {
    let sql = `select addr, win / 1000000 amount from live_bet_info
               where round = ? and addr not in (select addr from live_balance_audit where flag = 'malicious')
               order by win desc limit 20`
    let res = await db.exec(sql, [round])
    return res
}

async function getRankBonus(startTs) {
    let sql = "select sum(rank_trx / 1000000) amount from live_div_info where send_ts >= ?"
    let res = await db.exec(sql, [startTs])
    if (_.isEmpty(res)) return 0
    return res[0].amount || 0
}

async function maxAmountRewardRound() {
    let sql = "select max(round) maxRound from live_amount_rank_log"
    let res = await db.exec(sql, [])
    if (_.isEmpty(res)) return 0
    return res[0].maxRound || 0
}

async function maxPayoutRewardRound() {
    let sql = "select max(round) maxRound from live_payout_rank_log"
    let res = await db.exec(sql, [])
    if (_.isEmpty(res)) return 0
    return res[0].maxRound || 0
}

async function addAmountRankWardLog(round, addr, amount, wardAmount, ts, conn) {
    console.log('------round, addr, amount, wardAmount, ts, ------', round, addr, amount, wardAmount, ts)
    let sql = "insert into live_amount_rank_log(round, addr, amount, wardAmount, ts) values(?,?,?,?,?)"
    let res = await db.execTrans(sql, [round, addr, amount, wardAmount, ts], conn)
    return res
}

async function addPayoutRankWardLog(round, addr, amount, wardAmount, ts, conn) {
    console.log('------round, addr, amount, wardAmount, ts, ------', round, addr, amount, wardAmount, ts)
    let sql = "insert into live_payout_rank_log(round, addr, amount, wardAmount, ts) values(?,?,?,?,?)"
    let res = await db.execTrans(sql, [round, addr, amount, wardAmount, ts], conn)
    return res
}

async function updateTxidToAmountRankWardLog(round, addr, txId) {
    let sql = "update live_amount_rank_log set txId = ? where round = ? and addr = ?"
    let res = await db.exec(sql, [txId, round, addr])
    return res
}

async function updateTxidToPayoutRankWardLog(round, addr, txId) {
    let sql = "update live_payout_rank_log set txId = ? where round = ? and addr = ?"
    let res = await db.exec(sql, [txId, round, addr])
    return res
}

async function getLastDividends(startTs) {
    let sql = "select total_trx * 0.15 trx, send_ts ts, 'LIVE' types from live_div_info where send_ts >= ? union all select total_trx * 0.15 trx, send_ts ts, 'RAKE' types from tronbet_poker_log.rake_div_info where send_ts >=?"
    let res = await db.exec(sql, [startTs, startTs])
    return res
}

async function getFreespinNum(addr) {
    let sql = 'select fsNum from live_freespin_user where addr = ?'
    let res = await db.exec(sql, [addr])
    if (_.isEmpty(res)) return 0
    return res[0].fsNum
}

async function addFreeSpinUser(addr, nickName, userId) {
    let num = await getFreespinNum(addr)
    if (num >= 20) return
    let sql = "insert into live_freespin_user(addr, nickName, emUserId, fsNum) values(?,?,?,?) on DUPLICATE KEY UPDATE fsNum = fsNum + ?"
    let res = await db.exec(sql, [addr, nickName, userId, num, num])
    return res
}

async function addFressSpinLog(addr, orderId, endTs, ts) {
    let sql = 'insert into live_freespin_log(addr, orderId, endTs, ts) values(?,?,?,?)'
    let res = await db.exec(sql, [addr, orderId, endTs, ts])
    return res
}

async function addRegisterCode(email, code) {
    let sql = "insert into live_register_code(email, code, ts) values(?,?,?)"
    let now = new Date().getTime()
    let res = await db.exec(sql, [email, code, now])
}

async function addLoginCode(email, code) {
    let sql = "insert into live_login_code(email, code, ts) values(?,?,?)"
    let now = new Date().getTime()
    let res = await db.exec(sql, [email, code, now])
}

async function isRegisterCodeValid(email, code, timedelta) {
    let sql = "select count(1) cnt from live_register_code where email = ? and code = ? and ts >= ? limit 1"
    let now = new Date().getTime() - timedelta * 1000
    let res = await db.exec(sql, [email, code, now])
    if (_.isEmpty(res)) return false
    if (res[0].cnt < 1) return false
    return true
}

async function isLoginCodeValid(email, code, timedelta) {
    let sql = "select count(1) cnt from live_login_code where email = ? and code = ? and ts >= ? limit 1"
    let now = new Date().getTime() - timedelta * 1000
    let res = await db.exec(sql, [email, code, now])
    if (_.isEmpty(res)) return false
    if (res[0].cnt < 1) return false
    return true
}

async function getRegisterCodeByEmail(email, code, timedelta) {
    let sql = "select count(1) cnt from live_register_code where email = ? and code = ? and ts >= ? limit 1"
    let now = new Date().getTime() - timedelta * 1000
    let res = await db.exec(sql, [email, code, now])
    console.log(res)
    if (_.isEmpty(res)) return false
    if (res[0].cnt < 1) return false
    return true
}

async function getSendCodeHist(email, timedelta) {
    let sql = "select count(1) cnt from live_register_code where email = ? and ts >= ? limit 1"
    let now = new Date().getTime() - timedelta * 1000
    let res = await db.exec(sql, [email, now])
    if (_.isEmpty(res)) return false
    if (res[0].cnt < 1) return false
    return true
}

async function addAccount(email, nickName, head, passwd) {
    let sql = "insert into live_account(email, nickName, head, passwd, registerTs, currency) values(?,?,?,?,?,?)"
    let now = new Date().getTime()
    let res = await db.exec(sql, [email, nickName, head, passwd, now, 'BTC'])
}

async function getUserByPasswd(email, passwd) {
    let sql = "select * from live_account where (email = ? or nickName = ?) and passwd = ?"
    let res = await db.exec(sql, [email, email, passwd])
    return res
}

async function updateAccountPass(email, newPass) {
    let sql = "update live_account set passwd = ? where email = ?"
    console.log({ newPass, email })
    await db.exec(sql, [newPass, email])
}

async function getUserByEmail(email) {
    let sql = "select * from live_account where email = ?"
    return await db.exec(sql, [email])
}

async function getAccountrByEmail(email) {
    let sql = "select * from live_account where email = ?"
    return await db.exec(sql, [email])
}


async function getUserDepositAddr(uid, currency) {
    let sql = "select * from live_balance where uid = ? and currency = ?"
    return await db.exec(sql, [uid, currency])
}

async function addUserDopositAddr(uid, addr, currency, tag) {
    console.log(uid, addr, currency, tag)
    let sql = "insert into live_balance(uid, addr, currency, tag) values (?,?,?,?) on DUPLICATE KEY UPDATE addr = ?, tag = ?"
    return await db.exec(sql, [uid, addr, currency, tag, addr, tag])
}

async function depositSuccess(params, conn) {
    let logSql = "insert into live_cb_deposit_log(currency, addr, tag, amount, txId, ts) values(?,?,?,?,?,?)"
    let now = new Date().getTime()
    await db.execTrans(logSql, [params.currency, params.address, params.tag || '', params.amount * 1e9, params.txid, now], conn)

    //这里可以继续优化, 可能存在地址添加失败的情况, 这里找不到相应的地址, 那么就会导致充值失败
    // let updateSql = "update live_balance set balance = balance + ? where currency =? and addr = ?"
    // await db.execTrans(updateSql, [params.amount * 1e9, params.currency, params.address], conn)

    if (params.currency == 'BNB' || params.currency == 'bnb') {
        let updateSql = "update live_balance set balance = balance + ? where currency =? and addr = ? and tag = ?"
        await db.execTrans(updateSql, [params.amount * 1e9, params.currency, params.address, params.tag], conn)
    } else {
        let updateSql = "update live_balance set balance = balance + ? where currency =? and addr = ?"
        await db.execTrans(updateSql, [params.amount * 1e9, params.currency, params.address], conn)
    }
}

async function withdrawSuccess(orderId, txId) {
    let now = new Date().getTime()
    let logSql = "update live_cb_withdraw_log set txId = ?, status = 1, endTs = ? where orderId = ?"
    await db.exec(logSql, [txId, now, orderId])
}

async function getUserBalanceByCurrency(uid, currency) {
    let sql = "select round(balance / 1000000, 6) balance from live_balance where uid = ? and currency = ?"
    let res = await db.exec(sql, [uid, currency])
    if (_.isEmpty(res)) return 0
    return res[0].balance || 0
}

async function userWithdrawPre(uid, email, orderId, currency, addr, amount, conn, tag="") {
    let now = new Date().getTime()
    console.log(uid, email, orderId, currency, addr, amount)
    let sql = "insert into live_cb_withdraw_log(uid, email, orderId, currency, addr, amount, startTs, tag) values(?,?,?,?,?,?,?,?)"
    await db.execTrans(sql, [uid, email, orderId, currency, addr, amount, now, tag], conn)

    let updateSql = "update live_balance set balance = balance - ? where uid = ? and currency = ?"
    await db.execTrans(updateSql, [amount, uid, currency], conn)
}

async function getUserBalanceByUid(uid) {
    let sql = "select currency, round(balance / 1000000, 6) balance from live_balance where uid = ?"
    return await db.exec(sql, [uid])
}

async function addForgotPassCode(email, ip, code) {
    let sql = "insert into live_forgot_pass(email, ip, code, ts) values(?,?,?,?)"
    let now = new Date().getTime()
    let res = await db.exec(sql, [email, ip, code, now])
}

async function getForgotPassCodeLogByIp(ip, email, timedelta) {
    let sql = "select * from live_forgot_pass where ts >= ? and (ip = ? or email = ?)"
    let now = new Date().getTime() - timedelta * 1000
    let res = await db.exec(sql, [now, ip, email])
    return res
}

async function getForgotPassCodeLogByKey(key, timedelta) {
    let sql = "select * from live_forgot_pass where code = ? and ts >= ?"
    let now = new Date().getTime() - timedelta * 1000
    let res = await db.exec(sql, [key, now])
    return res
}

async function getWithdrawHistLogs(uid, page) {
    let sql = "select currency, addr, round(amount / 1000000, 3) amount, startTs ts, txId, status from live_cb_withdraw_log where uid = ? order by logId desc limit ?, 20"
    let res = await db.exec(sql, [uid, page])
    return res
}

async function getDepositHistLogs(uid, page) {
    let sql = "select currency, addr, round(amount / 1000000, 3) amount, ts, txId, 1 as status from live_cb_deposit_log where concat(addr, tag) in (select concat(addr, tag) from live_balance where uid = ?) order by logId desc limit ?, 20"
    let res = await db.exec(sql, [uid, page])
    return res
}

async function getWithdrawHistLogsCnt(uid) {
    let sql = "select count(1) cnt from live_cb_withdraw_log where uid = ?"
    let res = await db.exec(sql, [uid])
    if (_.isEmpty(res)) return 0
    return res[0].cnt || 0
}

async function getDepositHistLogsCnt(uid) {
    let sql = "select count(1) cnt from live_cb_deposit_log where concat(addr, tag) in (select concat(addr, tag) from live_balance where uid = ?)"
    let res = await db.exec(sql, [uid])
    if (_.isEmpty(res)) return 0
    return res[0].cnt || 0
}

async function getWithdrawHistLogsByCurrency(uid, page, currency) {
    let sql = "select currency, addr, round(amount / 1000000, 3) amount, startTs ts, txId, status from live_cb_withdraw_log where uid = ? and currency = ? order by logId desc limit ?, 20"
    let res = await db.exec(sql, [uid, currency, page])
    return res
}

async function getDepositHistLogsByCurrency(uid, page, currency) {
    let sql = "select currency, addr, round(amount / 1000000, 3) amount, ts, txId, 1 as status from live_cb_deposit_log where concat(addr, tag) in (select concat(addr, tag) from live_balance where uid = ?)  and currency = ? order by logId desc limit ?, 20"
    let res = await db.exec(sql, [uid, currency, page])
    return res
}

async function getWithdrawHistLogsCntByCurrency(uid, currency) {
    let sql = "select count(1) cnt from live_cb_withdraw_log where uid = ?  and currency = ?"
    let res = await db.exec(sql, [uid, currency])
    if (_.isEmpty(res)) return 0
    return res[0].cnt || 0
}

async function getDepositHistLogsCntByCurrency(uid, currency) {
    let sql = "select count(1) cnt from live_cb_deposit_log where concat(addr, tag) in (select concat(addr, tag) from live_balance where uid = ?)  and currency = ?"
    let res = await db.exec(sql, [uid, currency])
    if (_.isEmpty(res)) return 0
    return res[0].cnt || 0
}

async function setCurrency(currency, uid) {
    let sql = "update live_account set currency = ? where uid = ?"
    await db.exec(sql, [currency, uid])
}

async function setHead(uid, head) {
    let sql = "update live_account set head = ? where uid = ?"
    await db.exec(sql, [head, uid])
}

async function getWithdrawLast24HCnt(uid) {
    let sql = "select count(1) cnt from live_cb_withdraw_log where uid = ? and startTs > ?"
    let now = new Date().getTime() - 86400000
    let res = await db.exec(sql, [uid, now])
    if (_.isEmpty(res)) return 0
    return res[0].cnt || 0
}

async function getWithdraw5minLimit(addr) {
    let sql = "select startTs ts from tron_live.live_cb_withdraw_log where addr = ? order by startTs desc limit 1"
    let res = await db.exec(sql, [addr])
    if (_.isEmpty(res)) return 0
    return res[0].ts || 0
}

async function isInLiveBlackList(addr) {
    let sql = "select * from tron_live.live_black_list where addr = ?"
    let res = await db.exec(sql, [addr])
    if (res.length === 0){
        return false
    }else {
        return true
    }
}

async function getTRXSum() {
    let sql = "select sum(balance) / 1000000 as balance_all from live_balance where currency = 'TRX'"
    const data = await db.exec(sql, [])
    if(data.length > 0){
        let o = data[0] || {}
        let sum = o.balance_all || 0
        return sum
    }
    return  0
}

module.exports = {
    getUserBalance,
    userRegister,
    userLoginLog,
    updateSessionId,
    getUserBalanceBySessionId,
    userAction,
    userRollBack,
    finishedWithdrawLog,
    findTodayWithdrawTimes,
    getAccountBySessionId,
    getUserActionLog,
    generateFreespins,
    cancelFreespins,
    getUserIdByIssuseId,
    getTransactionById,
    getRealTimeProfitAmount,
    getRealTimeUSDProfitAmount,
    getUserWithDrawStatus,
    getAmountRankData,
    getProfitRankData,
    getRankBonus,
    maxAmountRewardRound,
    maxPayoutRewardRound,
    addAmountRankWardLog,
    addPayoutRankWardLog,
    updateTxidToAmountRankWardLog,
    updateTxidToPayoutRankWardLog,
    getLastDividends,
    updateUserKey,
    addRegisterCode,
    addLoginCode,
    isLoginCodeValid,
    isRegisterCodeValid,
    getRegisterCodeByEmail,
    addAccount,
    updateAccountPass,
    getSendCodeHist,
    getUserByEmail,
    getUserDepositAddr,
    addUserDopositAddr,
    depositSuccess,
    withdrawSuccess,
    userWithdrawPre,
    getUserBalanceByCurrency,
    getUserBalanceByUid,
    addForgotPassCode,
    getForgotPassCodeLogByIp,
    getForgotPassCodeLogByKey,
    getUserByPasswd,
    getAccountrByEmail,
    getWithdrawHistLogs,
    getDepositHistLogs,
    setCurrency,
    setHead,
    getWithdrawHistLogsCnt,
    getDepositHistLogsCnt,
    getWithdrawHistLogsByCurrency,
    getDepositHistLogsByCurrency,
    getWithdrawHistLogsCntByCurrency,
    getDepositHistLogsCntByCurrency,
    getWithdrawLast24HCnt,
    findTodayWithdrawAmount,
    findTodayTotalWithdrawAmount,
    getWithdraw5minLimit,
    getLiveFix,
    addLiveFix,
    isInLiveBlackList,
    getTRXSum,
    getUserAuditFlag,
}
