const _ = require('lodash')._
const usermodel = require("../model/userinfo");
const resdisUtils = require("../utils/redisUtil");
const config = require("../configs/config");
const execBet = usermodel.execBet
const execRollBack = usermodel.execRollBack

let _GAME_TYPE = "live";
let ACTIVITY_START_TS = config.event.ACTIVITY_START_TS || 0;
let ACTIVITY_END_TS = config.event.ACTIVITY_END_TS || 0;

const sendGameMsg = function (addr, order_id, trxAmount, currency) {
    let _now = _.now();
    if (_now < ACTIVITY_START_TS || _now > ACTIVITY_END_TS) return;

    if (currency !== "TRX" && currency !== "USDT") {
        return;
    }

    if (currency === "TRX" && trxAmount < 100) {
        return [trxAmount, 0, false];
    }

    if (currency === "USDT" && trxAmount < 10) {
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
        let msg = {
            addr: addr,
            order_id: order_id,
            box_num: 1,
            game_type: _GAME_TYPE
        };
        resdisUtils.redis.publish("game_message", JSON.stringify(msg));
    }
    return [trxAmount, persent, hit];
}

const sendMsgToClient = function (ctx, errno, errmsg, data) {
    data = data || {};
    let params = ctx.request.body;
    let result = {
        ReturnCode: errno,
        ApiVersion: params.ApiVersion || "",
        Request: params.Request || "",
        Message: errmsg,
        ...data
    };
    ctx.body = result;
}

const getAdditionByGameId = async function (GameID) {
    try {
        let multi = await resdisUtils.hget("live_platinus:addition", "" + GameID);
        console.log("live_platinus:addition", multi);
        if (!multi) return 1;
        return Number(multi);
    } catch (error) {
        return 1;
    }
}

const beforeBusiness = async function (ctx, typeDesc) {
    let rs = {
        code : 0,
        error: false,
        info: {}
    }
    //
    const params = ctx.request.body
    Object.keys(params).forEach(e => params[e] = params[e] || '')
    const {tokenError, tokenInfo} = usermodel.checkToken(params.token)
    if (tokenError) {
        rs.code = 1001
        rs.error = true
        rs.msg = "Token are wrong or expired"
        return rs
    }
    const {uid, addr, notExist, balance} = await usermodel.parseToken(tokenInfo, params.currency)
    let {currency, transaction_id, round_id, game_id, game_name, type, amount} = params
    const emptyCheck = [transaction_id, round_id, game_id, game_name].every(e => e !== '')
    //
    if (notExist) {
        rs.code = 1006
        rs.error = true
        rs.msg = "user not found!"
        return rs
    }
    if (isNaN(Number(amount)) || Number(amount) < 0) {
        rs.code = 1007
        rs.error = true
        rs.msg = "amount is error"
        return rs
    }
    if (balance === 0 || balance < Number(amount)) {
        rs.code = 1002
        rs.error = true
        rs.msg = "Not enough funds"
        return rs
    }
    if (emptyCheck === false) {
        rs.code = 1008
        rs.error = true
        rs.msg = "transaction_id, round_id, game_id, game_name is empty"
        return rs
    }
    if (type !== typeDesc) {
        rs.code = 1009
        rs.error = true
        rs.msg = "type error"
        return rs
    }
    if (!['TRX', 'USDT'].includes(params.currency)) {
        rs.code = 1010
        rs.error = true
        rs.msg = "currency error"
        return rs
    }

    //
    const betAmount = Number(amount) * 1e6
    let multi = await getAdditionByGameId(game_id);
    let adAmount = betAmount * multi;
    //
    amount = betAmount
    //
    const token = params.token
    const betParams = {
        transaction_id,
        round_id,
        game_id,
        game_name,
        type,
        addr,
        uid,
        currency,
        amount,
        adAmount,
        tokenInfo,
        token,
    }
    rs.info = betParams
    rs.msg = 'success'
    console.log("reuqest is : ",rs)
    return rs
}

const getRs = async function (info) {
    const balanceNow = await usermodel.getBalance(info)
    let result = {
        token: info.token,
        currency: info.currency,
        balance: balanceNow,
        type: info.type,
        success: true
    };
    return result
}

const checkBalance = async function (params) {
    const {tokenInfo, tokenError} = await usermodel.checkToken(params.token)
    let msg = {
        code : 0,
        error : 'success',
        data : {}
    }
    if (tokenError) {
        msg.code = 1001
        msg.error = "Token are wrong or expired"
    }
    if (!['TRX', 'USDT'].includes(params.currency)) {
        msg.code = 1005
        msg.error = "currency is error!"
    }
    console.log("tokenInfo is ", tokenInfo)
    const o = {
        currency : params.currency,
        type: 'query_balance',
        token : params.token,
        addr : tokenInfo.addr,
    }
    console.log("o  is ", o)
    const data = await getRs(o)
    msg.data = data
    return msg
}


module.exports = {
    sendGameMsg,
    sendMsgToClient,
    beforeBusiness,
    getRs,
    checkBalance,
    execBet,
    execRollBack,
}