const userinfo = require('../model/userinfo')
const log4js = require('../configs/log4js_config')
const _ = require('lodash')._
const {swaghub} = require('../configs/config')
const common = require('../utils/common')
const redisUtils = require('../utils/redisUtil')
const config = require('../configs/config');
const HmCrypto = require('hm-crypto-nodejs')

const digestType = 'RSA-SHA256';
const publicKey = swaghub.swagPublick
const privateKey = swaghub.privetKey

// init with default keypair and digest type
const hmCrypto = HmCrypto(digestType, privateKey, publicKey);
let LocalCurrency = "TRX"

function sendMsg2Client(ctx, result) {
    console.log("response_data is ", result)
    ctx.body = result
}

function getToken(token) {
    try {
        let token1 = Buffer.from(token, 'base64').toString('ascii')
        if (token1.split('|').length == 2) {
            console.log(token1)
            token1 = token1.split('|')[0]
        }
        return token1
    } catch (error) {
        return token
    }
}

function toCpAmount(currency, amount) {
    if (currency == 'BNB') {
        return amount / 1000
    } else {
        return amount
    }
}

function fromCpAmount(currency, amount) {
    if (currency == 'BNB') {
        return amount * 1000
    } else {
        return amount
    }
}

let _GAME_TYPE = "live";
let ACTIVITY_START_TS = config.event.ACTIVITY_START_TS || 0;
let ACTIVITY_END_TS = config.event.ACTIVITY_END_TS || 0;

function sendGameMsg(addr, order_id, trxAmount, currency) {
    let _now = _.now();
    if (_now < ACTIVITY_START_TS || _now > ACTIVITY_END_TS) return;

    if (currency !== 'TRX' && currency !== 'USDT') {
        return;
    }

    if (currency === 'TRX' && trxAmount < 100) {
        return [trxAmount, 0, false];
    }

    if (currency === 'USDT' && trxAmount < 10) {
        return [trxAmount, 0, false];
    }

    //箱子爆率=投注额^0.527163*0.3%
    //箱子爆率=投注额^0.495424251*0.3%
    let persent = Math.floor(Math.pow(trxAmount, 0.495424251) * 30);
    if (persent > 9000) persent = 9000;
    let _r = _.random(0, 10000);
    let hit = false;
    if (_r <= persent) {
        hit = true;
    }
    if (hit === true) {
        let msg = {addr: addr, order_id: order_id, box_num: 1, game_type: _GAME_TYPE};
        // loggerDefault.info("sendGameMsg", msg);
        redisUtils.redis.publish("game_message", JSON.stringify(msg));
        // appEvent.emit('activity_info', msg); //**  */
    }
    return [trxAmount, persent, hit];
}

async function getAdditionByGameId(GameID) {
    try {
        let multi = await redisUtils.hget('tronlive:hub88:addition', '' + GameID)
        console.log('tronlive:hub88:addition', multi)
        if (!multi) return 1
        return Number(multi)
    } catch (error) {
        return 1
    }
}

async function balance(ctx) {
    let params = ctx.request.body
    let headers = ctx.request.headers

    const localSignature = hmCrypto.sign(JSON.stringify(params))
    const remoteSignature = headers['X-Hub88-Signature'] || headers['x-hub88-signature']

    let isTrue = hmCrypto.isValid(JSON.stringify(params), remoteSignature)
    if (!isTrue) {
        console.log(localSignature, remoteSignature)
        return sendMsg2Client(ctx, {status: 'RS_ERROR_INVALID_TOKEN'})
    }
    let token = getToken(params.token)
    let account = await userinfo.getAccountBySessionId(token)
    console.log(account)
    if (account.length === 0) {
        return sendMsg2Client(ctx, {status: 'RS_ERROR_UNKNOWN'})
    }
    if (account[0].currency == 'USDT') {
        account[0].currency = 'TRX'
    }

    let balance = await userinfo.getUserBalanceByCurrency(account[0].uid, account[0].currency)
    //
    return sendMsg2Client(ctx, {
        status: 'RS_OK',
        user: account[0].nickName || account[0].email,
        request_uuid: params.request_uuid,
        currency: account[0].currency,
        balance: toCpAmount(account[0].currency, balance)
    })
}

async function bet(ctx) {
    let params = ctx.request.body
    let headers = ctx.request.headers

    console.log(`${new Date().toJSON()}-->request_bet: `, params)

    const localSignature = hmCrypto.sign(JSON.stringify(params))
    const remoteSignature = headers['X-Hub88-Signature'] || headers['x-hub88-signature']

    let isTrue = hmCrypto.isValid(JSON.stringify(params), remoteSignature)
    if (!isTrue) {
        console.log(localSignature, remoteSignature)
        return sendMsg2Client(ctx, {status: 'RS_ERROR_INVALID_TOKEN'})
    }

    let transactionId = params.transaction_uuid
    let round = params.round
    let is_free = params.is_free
    let game_id = params.game_id
    let currency = params.currency
    let bet = params.bet || ''
    let amount = params.amount * 10

    amount = fromCpAmount(currency, amount)
    if (bet.length > 30) bet = bet.slice(0, 30)

    let token = getToken(params.token)
    let account = await userinfo.getAccountBySessionId(token)
    if (account.length === 0) {
        return sendMsg2Client(ctx, {status: 'RS_ERROR_UNKNOWN'})
    }
    let balance = await userinfo.getUserBalanceByCurrency(account[0].uid, currency)
    if (balance < fromCpAmount(currency, params.amount)) {
        return sendMsg2Client(ctx, {status: 'RS_ERROR_NOT_ENOUGH_MONEY'})
    }
    /**
     * begin business
     * @type {number}
     */
    let multi = await getAdditionByGameId(game_id)
    let addAmount = amount * multi
    await userinfo.userBet(transactionId, account[0].uid, account[0].email, round, is_free, game_id, currency, bet, amount, addAmount)
    // 触发活动
    // console.log("amount", amount)
    sendGameMsg(account[0].email, new Date().getTime(), amount / 1000000, currency);

    let newBalance = await userinfo.getUserBalanceByCurrency(account[0].uid, currency)
    return sendMsg2Client(ctx, {
        user: account[0].nickName || account[0].email,
        status: "RS_OK",
        request_uuid: params.request_uuid,
        currency: currency,
        balance: toCpAmount(currency, newBalance)
    })
}

async function win(ctx) {
    let params = ctx.request.body
    let headers = ctx.request.headers
    console.log(`${new Date().toJSON()}-->request_win: `, params)

    const localSignature = hmCrypto.sign(JSON.stringify(params))
    console.log("headers is ",headers)
    const remoteSignature = headers['X-Hub88-Signature'] || headers['x-hub88-signature']

    let isTrue = hmCrypto.isValid(JSON.stringify(params), remoteSignature)
    // if (!isTrue) {
    //     console.log(localSignature, remoteSignature)
    //     return sendMsg2Client(ctx, {status: 'RS_ERROR_INVALID_TOKEN'})
    // }
    let transactionId = params.transaction_uuid
    let currency = params.currency
    let amount = params.amount * 10
    let betTxId = params.reference_transaction_uuid
    amount = fromCpAmount(currency, amount)
    let token = getToken(params.token)
    //
    let account = await userinfo.getAccountBySessionId(token)
    if (account.length === 0) {
        return sendMsg2Client(ctx, {status: 'RS_ERROR_UNKNOWN'})
    }

    let transaction = await userinfo.getTransactionById(betTxId)
    console.log("transaction", transaction)
    if (transaction.length === 0) {
        return sendMsg2Client(ctx, {status: 'RS_ERROR_TRANSACTION_IS_OVER'})
    }
    //
    const statusTmp = Number(transaction[0].status)
    const transactionWin = Number(transaction[0].win)
    if (statusTmp !== 2) {
        console.log("statusTmp is ", statusTmp)
        return sendMsg2Client(ctx, {
            status: 'RS_OK',
            request_uuid: params.request_uuid,
            currency: currency,
            user: account.nickName || account.email
        })
    }
    if (transactionWin > 0) {
        console.log("transactionWin is ", transactionWin)
        return sendMsg2Client(ctx, {
            status: 'RS_OK',
            request_uuid: params.request_uuid,
            currency: currency,
            user: account.nickName || account.email
        })
    }

    console.log(`${account[0].email} win ${amount} @ ${betTxId}, winTransaction: ${transactionId} `)
    //
    //
    await userinfo.userWin(account[0].uid, currency, transactionId, transaction[0].transactionId, amount)
    //
    let newBalance = await userinfo.getUserBalanceByCurrency(account[0].uid, currency)
    return sendMsg2Client(ctx, {
        user: account[0].nickName || account[0].email,
        status: "RS_OK",
        request_uuid: params.request_uuid,
        currency: currency,
        balance: toCpAmount(currency, newBalance)
    })

}


async function rollback(ctx) {
    let params = ctx.request.body
    let headers = ctx.request.headers
    console.log(`${new Date().toJSON()}-->request_rollback: `, params)

    const localSignature = hmCrypto.sign(JSON.stringify(params))
    const remoteSignature = headers['X-Hub88-Signature'] || headers['x-hub88-signature']

    let isTrue = hmCrypto.isValid(JSON.stringify(params), remoteSignature)
    if (!isTrue) {
        console.log(localSignature, remoteSignature)
        return sendMsg2Client(ctx, {status: 'RS_ERROR_INVALID_TOKEN'})
    }


    let token = getToken(params.token)
    let account = await userinfo.getAccountBySessionId(token)
    if (account.length === 0) {
        return sendMsg2Client(ctx, {status: 'RS_ERROR_UNKNOWN'})
    }

    let transactionId = params.transaction_uuid
    let betTxId = params.reference_transaction_uuid
    let transaction = await userinfo.getTransactionById(betTxId)
    console.log("transaction",transaction)
    // update 20200527  处理成2(刚pay)
    if (transaction.length === 0) {
        return sendMsg2Client(ctx, {status: 'RS_ERROR_TRANSACTION_IS_OVER'})
    }
    //
    let currency = transaction[0].currency
    let amount = transaction[0].amount
    //
    const statusTmp = Number(transaction[0].status)
    const transactionWin = Number(transaction[0].win)
    if (statusTmp !== 2) {
        console.log("statusTmp is ", statusTmp)
        return sendMsg2Client(ctx, {
            status: 'RS_OK',
            request_uuid: params.request_uuid,
            currency: currency,
            user: account.nickName || account.email
        })
    }
    if (transactionWin > 0) {
        console.log("transactionWin is ", transactionWin)
        return sendMsg2Client(ctx, {
            status: 'RS_OK',
            request_uuid: params.request_uuid,
            currency: currency,
            user: account.nickName || account.email
        })
    }
    /**
     * begin tx
     */
    await userinfo.userRollBack(account[0].uid, currency, transactionId, transaction[0].transactionId, amount)

    let newBalance = await userinfo.getUserBalanceByCurrency(account[0].uid, currency)
    return sendMsg2Client(ctx, {
        user: account[0].nickName || account[0].email,
        status: "RS_OK",
        request_uuid: params.request_uuid,
        currency: currency,
        balance: toCpAmount(currency, newBalance)
    })

}

module.exports = {
    balance,
    win,
    bet,
    rollback,
}