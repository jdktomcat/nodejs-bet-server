const usermodel = require('../model/userinfo')
const db = require('../utils/dbUtil')
const log4js = require('../configs/log4js_config')
const logger = log4js.getLogger('print')
const _ = require('lodash')._
const crypto = require("crypto")
const {EveryMatrix}  = require('../configs/config')
const evnets = require('events')
const common = require('../utils/common')
const resdisUtils = require('../utils/redisUtil')

async function sendMsgToClient(ctx, errno, errmsg, data) {
    data = data || {}
    let params = ctx.request.body
    let result = {
        ReturnCode: errno,
        ApiVersion: params.ApiVersion || '',
        Request : params.Request || '',
        Message: errmsg,
        ...data
    }
    ctx.body = result
}

function getCurrency(idStr) {
    try {
        let result = idStr
        if (result.split('_').length >= 2) {
            console.log(result)
            result = idStr.split('_')[result.split('_').length - 1]
        }
        return result
    } catch (error) {
        console.log(error)
        return null
    }
}


function getAccountId(idStr) {
    try {
        let result = idStr
        let tmp = result.split('_')
        if (tmp.length >= 2) {
            console.log(result)
            result= ''
            for (let i = 0; i< tmp.length - 1; i++) {
                result +=  tmp[i]
            }
        }
        return result
    } catch (error) {
        console.log(error)
        return idStr
    }
}

function getRealSessionId(SessionId) {
    try {
        let result = SessionId
        let tmp = result.split('_')
        if (tmp.length >= 2) {
            result = tmp[0]
        }
        return result
    } catch (error) {
        return SessionId
    }
}

//GetAccount
async function GetAccount(ctx) {
    let params = ctx.request.body
    let LoginName = params.LoginName
    let Password = params.Password
    let SessionId = params.SessionId

    logger.info(params)
    if (LoginName !== EveryMatrix.LoginName || Password !== EveryMatrix.Password) {
        return await sendMsgToClient(ctx, 101, 'auth failed')
    }

    if (!SessionId) {
        return await sendMsgToClient(ctx, 103, 'User not found')
    }

    let result = {}

    let now = new Date().getTime()

    let user = await usermodel.getAccountBySessionId(getRealSessionId(SessionId))

    if (_.isEmpty(user)) {
        return await sendMsgToClient(ctx, 103, 'User not found')
    }

    result.AccountId = user[0].email + '_' + user[0].currency
    result.City = ''
    result.Country = ''
    result.Currency = user[0].currency
    result.SessionId = user[0].SessionId
    result.UserName = user[0].nickName || user[0].email
    result.FirstName = ''
    result.LastName = ''
    result.Alias = user[0].nickName || user[0].email
    result.Birthdate = ''
    result.RCPeriod = Math.floor((now - user[0].loginTs) / 60000)

    return await sendMsgToClient(ctx, 0, 'Success', result)
}

async function GetBalance(ctx) {
    let params = ctx.request.body
    let SessionId = params.SessionId
    let AccountId = getAccountId(params.AccountId)
    let LoginName = params.LoginName
    let Password = params.Password

    if (LoginName !== EveryMatrix.LoginName || Password !== EveryMatrix.Password) {
        return await sendMsgToClient(ctx, 101, 'auth failed')
    }

    if(!SessionId || !AccountId) {
        return await sendMsgToClient(ctx, 103, 'User not found')
    }

    let user = await usermodel.getAccountBySessionId(getRealSessionId(SessionId))

    if (_.isEmpty(user)) {
        return await sendMsgToClient(ctx, 103, 'User not found')
    }
    let Currency = getCurrency(params.AccountId) || user[0].currency

    let Balance = await usermodel.getUserBalanceByCurrency(user[0].uid, Currency)
    if (Currency != 'TRX'){
        Balance = (Balance / 1000).toFixed(5)
    }

    let result  = {
        Balance,
        SessionId,
        BonusMoney: 0,
        RealMoney: Balance,
        Currency:  Currency
    }
    console.log(result)
    return await sendMsgToClient(ctx, 0, 'Success', result)
}

async function getAdditionByGameId(GameID) {
    try {
        let multi = await resdisUtils.hget('tronlive:addition', '' + GameID)
        console.log('tronlive:addition', multi)
        if(!multi) return 1
        return Number(multi)
    } catch (error) {
        return 1
    }
}

async function Wager(ctx) {
    console.log('==============================================')
    let params = ctx.request.body
    let LoginName = params.LoginName
    let Password = params.Password
    let SessionId = params.SessionId
    let AccountId = getAccountId(params.AccountId)
    let Amount = params.Amount
    let Device = params.Device || ''
    let GPGameId = params.GPGameId || ''
    let EMGameId = params.EMGameId || ''
    let GPId = params.GPId || ''
    let RoundId = params.RoundId
    let TransactionId = params.TransactionId
    let RoundStatus = params.RoundStatus

    console.log(JSON.stringify(params))

    if (LoginName !== EveryMatrix.LoginName || Password !== EveryMatrix.Password) {
        return await sendMsgToClient(ctx, 101, 'auth failed')
    }

    if (!SessionId || !AccountId || !Amount || !TransactionId || !RoundStatus || !RoundId) {
        return await sendMsgToClient(ctx, 101, 'auth failed')
    }

    logger.info('bet of AccountId ' + AccountId , ' bet =>', Amount)

    if (Amount < 0) {
        Amount = 0 - Amount
    }

    if (Amount == 0) {
        return await sendMsgToClient(ctx, 101, 'auth failed')
    }

    let multi = await getAdditionByGameId(EMGameId)
    let addAmount = Amount * multi

    let user = await usermodel.getAccountBySessionId(getRealSessionId(SessionId))
    if (_.isEmpty(user)) {
        return await sendMsgToClient(ctx, 103, 'User not found')
    }

    if (user[0].email !== AccountId) {
        return await sendMsgToClient(ctx, 103, 'User not found')
    }

    let Currency = getCurrency(params.AccountId) || user[0].currency
    let Balance = await usermodel.getUserBalanceByCurrency(user[0].uid, Currency)
    if (Currency != 'TRX'){
        Balance = Balance / 1000
        Amount = Amount * 1000
    }

    let transaction = await usermodel.getTransactionById(TransactionId || '-')
    if (!_.isEmpty(transaction)) {
        let result = {
            BonusMoneyBet : Amount,
            RealMoneyBet : 0,
            AccountTransactionId : transaction[0].txId,
            Currency :  Currency,
            Balance : Balance,
            SessionId : SessionId
        }
        return await sendMsgToClient(ctx, 0, 'Success', result)
    }

    if(Balance * 1000 < Amount) {
        return await sendMsgToClient(ctx, 104, 'Insufficient funds')
    }

    let conn = null
    let txId = common.getRandomSeed(64)
    try {
        conn = await db.getConnection()
        if (conn == null) {
            return await sendMsgToClient(ctx, 101, 'unknown failed')
        }
        conn.beginTransaction()
        let res = await usermodel.userAction(AccountId, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, 'bet', addAmount, user[0].uid, Currency, conn)
        conn.commit()
    } catch (error) {
        logger.info(error)
        if (conn) conn.release()
        if (error.code === 'ER_DUP_ENTRY') return await sendMsgToClient(ctx, 0, 'Success')
        return await sendMsgToClient(ctx, 104, 'Insufficient funds')
    } finally {
        if (conn) conn.release()
    }

    Balance = await usermodel.getUserBalanceByCurrency(user[0].uid, Currency)
    if (Currency != 'TRX'){
        Balance = Balance / 1000
    }
    let result = {
        BonusMoneyBet: Amount,
        RealMoneyBet: 0,
        AccountTransactionId: txId,
        Currency:  Currency,
        Balance: Balance,
        SessionId: SessionId
    }

    return await sendMsgToClient(ctx, 0, 'Success', result)
}

async function Result(ctx) {
    let params = ctx.request.body
    let LoginName = params.LoginName
    let Password = params.Password
    let SessionId = params.SessionId
    let AccountId = getAccountId(params.AccountId)
    let Amount = params.Amount
    let Device = params.Device || ''
    let GPGameId = params.GPGameId || ''
    let EMGameId = params.EMGameId || ''
    let GPId = params.GPId  || ''
    let RoundId = params.RoundId
    let TransactionId = params.TransactionId
    let RoundStatus = params.RoundStatus
    let BetPayload = params.BetPayload  // not used

    if (LoginName !== EveryMatrix.LoginName || Password !== EveryMatrix.Password) {
        return await sendMsgToClient(ctx, 101, 'auth failed')
    }

    logger.info('result of AccountId ' + AccountId , ' result =>', Amount)

    if (Amount < 0) {
        return await sendMsgToClient(ctx, 101, 'unknown failed')
    }

    if (!SessionId || !AccountId || Amount == null || !TransactionId || !RoundStatus || !RoundId) {
        return await sendMsgToClient(ctx, 101, 'auth failed')
    }

    let user = await usermodel.getAccountBySessionId(getRealSessionId(SessionId))
    if (_.isEmpty(user)) {
        return await sendMsgToClient(ctx, 103, 'User not found')
    }

    if (user[0].email !== AccountId) {
        return await sendMsgToClient(ctx, 103, 'User not found')
    }

    let Currency = getCurrency(params.AccountId) || user[0].currency
    let Balance = await usermodel.getUserBalanceByCurrency(user[0].uid, Currency)

    if (Currency != 'TRX'){
        Balance = Balance / 1000
        Amount = Amount * 1000
    }

    let transaction = await usermodel.getTransactionById(TransactionId || '-')
    if (!_.isEmpty(transaction)) {
        let result = {
            AccountTransactionId : transaction[0].txId,
            Currency :  Currency,
            Balance : Balance,
            SessionId : SessionId
        }
        return await sendMsgToClient(ctx, 0, 'Success', result)
    }

    let conn = null
    let txId = common.getRandomSeed(64)
    try {
        conn = await db.getConnection()
        if (conn == null) {
            return await sendMsgToClient(ctx, 101, 'unknown failed')
        }
        conn.beginTransaction()
        let res = await usermodel.userAction(AccountId, RoundId, EMGameId, GPGameId, GPId, TransactionId, RoundStatus, Amount, Device, txId, 'result', 0, user[0].uid, Currency, conn)
        conn.commit()
    } catch (error) {
        logger.info(error)
        if (conn) conn.release()
        if (error.code === 'ER_DUP_ENTRY') return await sendMsgToClient(ctx, 0, 'Success')
        return await sendMsgToClient(ctx, 104, 'Insufficient funds')
    } finally {
        if (conn) conn.release()
    }

    Balance = await usermodel.getUserBalanceByCurrency(user[0].uid, Currency)
    if (Currency != 'TRX'){
        Balance = Balance / 1000
    }
    let result = {
        AccountTransactionId : txId,
        Currency :  Currency,
        Balance : Balance,
        SessionId : SessionId
    }

    return await sendMsgToClient(ctx, 0, 'Success', result)

}

async function RollBack(ctx) {
    let params = ctx.request.body
    let LoginName = params.LoginName
    let Password = params.Password
    let SessionId = params.SessionId
    let AccountId = getAccountId(params.AccountId)
    let Amount = params.Amount
    let Device = params.Device || ''
    let GPGameId = params.GPGameId || ''
    let EMGameId = params.EMGameId || ''
    let GPId = params.GPId || ''
    let RoundId = params.RoundId
    let TransactionId = params.TransactionId
    if (LoginName !== EveryMatrix.LoginName || Password !== EveryMatrix.Password) {
        return await sendMsgToClient(ctx, 101, 'auth failed')
    }

    if (!SessionId || !AccountId || Amount == null || !TransactionId || !RoundId) {
        return await sendMsgToClient(ctx, 101, 'auth failed')
    }

    let user = await usermodel.getAccountrByEmail(AccountId)
    if (_.isEmpty(user)) {
        return await sendMsgToClient(ctx, 103, 'User not found')
    }

    let Currency = getCurrency(params.AccountId) || user[0].currency
    let Balance = await usermodel.getUserBalanceByCurrency(user[0].uid, Currency)
    if (Currency != 'TRX'){
        Balance = Balance / 1000
        Amount = Amount * 1000
    }

    let transaction = await usermodel.getTransactionById(TransactionId || '-')
    if(_.isEmpty(transaction)) {
        return await sendMsgToClient(ctx, 108, ' TransactionNotFound ')
    }

    if (transaction[0].txStatus != 1) {
        let transactio1n = await usermodel.getTransactionById('rb' + TransactionId || '-')
        let txId = ''
        if (!_.isEmpty(transactio1n)) {
            txId = transactio1n[0].txId
        }
        let result = {
            AccountTransactionId : txId,
            Currency :  Currency,
            Balance : Balance,
            SessionId : SessionId
        }
        return await sendMsgToClient(ctx, 0, 'Success', result)
    }

    let conn = null
    let txId = common.getRandomSeed(64)
    try {
        conn = await db.getConnection()
        if (conn == null) {
            return await sendMsgToClient(ctx, 101, 'unknown failed')
        }
        conn.beginTransaction()
        let res = await usermodel.userRollBack(AccountId, RoundId, EMGameId, GPGameId, GPId, TransactionId, 'rollback', Amount, Device, txId, 'rb' + transaction[0].action, user[0].uid, Currency, conn)
        conn.commit()
    } catch (error) {
        logger.info(error)
        if (conn) conn.release()
        if (error.code === 'ER_DUP_ENTRY') return await sendMsgToClient(ctx, 0, 'Success')
        return await sendMsgToClient(ctx, 104, 'Insufficient funds')
    } finally {
        if (conn) conn.release()
    }

    Balance = await usermodel.getUserBalanceByCurrency(user[0].uid, Currency)
    if (Currency != 'TRX'){
        Balance = Balance / 1000
    }
    let result = {
        AccountTransactionId : txId,
        Currency :  Currency,
        Balance : Balance,
        SessionId : SessionId
    }

    return await sendMsgToClient(ctx, 0, 'Success', result)
}

async function GetTransactionStatus(ctx) {
    let params = ctx.request.body
    let LoginName = params.LoginName
    let Password = params.Password
    let TransactionId = params.TransactionId
    if (LoginName !== EveryMatrix.LoginName || Password !== EveryMatrix.Password) {
        return await sendMsgToClient(ctx, 101, 'auth failed')
    }

    let transaction = await usermodel.getTransactionById(TransactionId || '-')
    let TransactionStatus = 'Failed'
    if(_.isEmpty(transaction)) {
        TransactionStatus = 'Notexists'
    } else if(transaction[0].txStatus <= 1 ) {
        TransactionStatus = 'Processed'
    }

    let result = {
        TransactionId,
        TransactionStatus
    }

    return await sendMsgToClient(ctx, 0, 'Success', result)
}

async function All(ctx) {
    let params = ctx.request.body
    let Request = params.Request || ''

    if (Request === 'GetAccount' || Request === 'getaccount') {
        return GetAccount(ctx)
    } else if (Request === 'GetBalance' || Request === 'getbalance') {
        return GetBalance(ctx)
    } else if (Request === 'Wager' || Request === 'wager') {
        return Wager(ctx)
    } else if (Request === 'Result' || Request === 'result') {
        return Result(ctx)
    } else if (Request === 'Rollback' || 'rollback') {
        return RollBack(ctx)
    } else if (Request === 'GetTransactionStatus' || Request === 'gettransactionstatus') {
        return GetTransactionStatus(ctx)
    } else {
        return await sendMsgToClient(ctx, 101, 'unkown request')
    }
}

module.exports = {
    GetAccount,
    GetBalance,
    Wager,
    Result,
    RollBack,
    GetTransactionStatus,
    All,
}