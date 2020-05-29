const {sequelize, rawQuery, updateQuery} = require('../utils/mysqlUtils')

async function getUserBalance(addr) {
    let sql = "select round(trx / 1000000, 3) as trx from live_user where addr = ?"
    let res = await rawQuery(sql, [addr])
    if (res.length > 0) {
        return res[0].trx
    }
    return null
}

async function userBet(transactionId, uid, email, round, isFree, gameId, currency, bet, amount, adAmount) {
    await sequelize.transaction(async (t) => {
        /**
         * balance op
         */
        const update_balance_sql = 'update tron_live.live_balance set balance = balance - :amount where uid = :uid and currency = :currency'
        const update_condition = {
            uid: uid,
            currency: currency,
            amount: amount,
        }
        updateQuery(update_balance_sql, update_condition, t)
        /**
         * update流水
         */
        let now = new Date().getTime()
        let hub88_sql = "insert into swagger_transaction_log(transactionId, uid, email, round, isFree, gameId, currency, bet, amount, adAmount, resultTxId, ts, status) values(?,?,?,?,?,?,?,?,?,?,?,?,'1')"
        const resultTxId = transactionId + "_result"
        const hub88_condition = [transactionId, uid, email, round, isFree, gameId, currency, bet, amount, adAmount, resultTxId, now]
        await updateQuery(hub88_sql, hub88_condition, t)
    })
    return 1
}

async function userWin(resultTxId, uid, win, currency, bet, transaction) {
    await sequelize.transaction(async (t) => {
        /**
         * balance op
         */
        const update_balance_sql = 'update tron_live.live_balance set balance = balance + :amount where uid = :uid and currency = :currency'
        const update_condition = {
            uid: uid,
            currency: currency,
            amount: win,
        }
        if (win > 0) {
            updateQuery(update_balance_sql, update_condition, t)
        } else {
            console.log("lose_amount@" + win)
        }
        /**
         *
         */
        let hub88_sql = "insert into swagger_transaction_log(transactionId, uid, email, round, isFree, gameId, currency, bet, amount, win, adAmount, resultTxId, ts, status) values(?,?,?,?,?,?,?,?,?,?,?,?,?,'1')"
        const transactionId = transaction.transactionId
        const email = transaction.email
        const round = transaction.round
        const gameId = transaction.gameId
        const hub88_condition = [transactionId, uid, email, round, 0, gameId, currency, bet, 0, win, 0, resultTxId, Date.now()]
        await updateQuery(hub88_sql, hub88_condition, t)
    })
    return 1
}

async function userRollBack(uid, currency, resultTxId, transactionId, amount) {
    await sequelize.transaction(async (t) => {
        /**
         * balance op
         */
        const update_balance_sql = 'update tron_live.live_balance set balance = balance + :amount where uid = :uid and currency = :currency'
        const update_condition = {
            uid: uid,
            currency: currency,
            amount: amount,
        }
        if (amount > 0) {
            updateQuery(update_balance_sql, update_condition, t)
        }
        let sql = "update swagger_transaction_log set resultTxId = ?, status = '0' where transactionId = ? and status = '1' "
        await updateQuery(sql, [resultTxId, transactionId], t)
    })
    return 1
}

async function getTransactionById(TransactionId) {
    let sql = "select * from swagger_transaction_log where transactionId = ? and status = '1' "
    return await rawQuery(sql, ['' + TransactionId])
}

async function getTransactionByResultTxId(resultTxId) {
    let sql = "select * from swagger_transaction_log where resultTxId = ?"
    return await rawQuery(sql, ['' + resultTxId])
}

async function getAccountBySessionId(sessionId) {
    let sql = "select * from live_account where sessionId = ?"
    let res = await rawQuery(sql, [sessionId])
    return res
}

async function getUserBalanceByCurrency(uid, currency) {
    let sql = "select round(balance / 10, 3) balance from live_balance where uid = ? and currency = ?"
    let res = await rawQuery(sql, [uid, currency])
    if (res.length === 0) {
        return 0
    } else {
        return Number(Math.floor(res[0].balance)) || 0
    }
}

module.exports = {
    getUserBalance,
    userWin,
    userBet,
    userRollBack,
    getAccountBySessionId,
    getTransactionById,
    getUserBalanceByCurrency,
    getTransactionByResultTxId,
}