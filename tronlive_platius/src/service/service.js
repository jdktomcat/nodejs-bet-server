const usermodel = require("../model/userinfo");
const db = require("../utils/dbUtil");
const log4js = require("../configs/log4js_config");
const logger = log4js.getLogger("print");
const _ = require("lodash")._;
const crypto = require("crypto");
const {secretKey} = require("../configs/config");
const evnets = require("events");
const common = require("../utils/common");
const resdisUtils = require("../utils/redisUtil");
const config = require("../configs/config");

let _GAME_TYPE = "live";
let ACTIVITY_START_TS = config.event.ACTIVITY_START_TS || 0;
let ACTIVITY_END_TS = config.event.ACTIVITY_END_TS || 0;

const sendGameMsg = function(addr, order_id, trxAmount, currency) {
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
        // loggerDefault.info("sendGameMsg", msg);
        resdisUtils.redis.publish("game_message", JSON.stringify(msg));
        // appEvent.emit('activity_info', msg); //**  */
    }
    return [trxAmount, persent, hit];
}

const sendMsgToClient = function(ctx, errno, errmsg, data) {
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

const getAdditionByGameId = async function(GameID) {
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
        error: false,
        info: {}
    }
    //
    const params = ctx.request.body
    params.forEach(e => params[e] = params[e] || '')
    const {tokenError, tokenInfo} = usermodel.checkToken(params.token)
    if (tokenError) {
        rs.error = true
        rs.msg = "token is error!"
        return rs
    }
    const {uid, addr, notExist, balance} = usermodel.parseToken(tokenInfo)
    const {currency, transaction_id, round_id, game_id, game_name, type, amount} = params
    const emptyCheck = [transaction_id, round_id, game_id, game_name].every(e => e !== '')
    //
    if (notExist) {
        // user no found
        rs.error = true
        rs.msg = "user not found!"
        return rs
    }
    if (isNaN(Number(amount)) || Number(amount) < 0) {
        rs.error = true
        rs.msg = "amount is error"
        return rs
    }
    if (balance === 0 || balance < Number(amount)) {
        rs.error = true
        rs.msg = "balance is not enough"
        return rs
    }
    if (emptyCheck === false) {
        rs.error = true
        rs.msg = "transaction_id, round_id, game_id, game_name is empty"
        return rs
    }
    if (type !== typeDesc) {
        rs.error = true
        rs.msg = "type error"
        return rs
    }

    //
    const betAmount = Number(amount) * 1e6
    let multi = await getAdditionByGameId(game_id);
    let adAmount = betAmount * multi;
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
        amount,
        adAmount,
        tokenInfo,
        token,
    }
    rs.info = betParams
    rs.msg = 'success'
    return rs
}

class apiCall {

    static async balance(ctx) {
        const params = ctx.request.body
        params.forEach(e => params[e] = params[e] || '')
        const {tokenError, tokenInfo} = usermodel.checkToken(params.token)
        if (tokenError) {
            return await sendMsgToClient(ctx, 101, "token is error!");
        }
        const balance = await usermodel.getBalance(tokenInfo, params.currency)
        // need to query balance again
        let result = {
            token: params.token,
            balance: balance,
            currency: params.currency,
        };
        return await sendMsgToClient(ctx, 0, "Success", result);
    }

    static async bet(ctx) {
        const type = 'bet'
        const {error, msg, info} = await beforeBusiness(ctx, type)
        if (error) {
            return await sendMsgToClient(ctx, 500, msg);
        }
        /**
         * begin insert
         */
        let conn = null;
        try {
            conn = await db.getConnection();
            if (conn == null) {
                return await sendMsgToClient(ctx, 501, "unknown failed");
            }
            conn.beginTransaction();
            await usermodel.userAction(info, conn);
            // 触发活动
            sendGameMsg(info.addr, Date.now(), info.amount, info.currency);
            conn.commit();
        } catch (error) {
            logger.info(error);
            if (conn) conn.release();
            if (error.code === "ER_DUP_ENTRY")
                return await sendMsgToClient(ctx, 0, "Success");
            return await sendMsgToClient(ctx, 501, "Insufficient funds");
        } finally {
            if (conn) conn.release();
        }
        //
        // need to query balance again
        const balanceNow = await usermodel.getBalance(info.tokenInfo, info.currency)
        // need to query balance again
        let result = {
            token: info.token,
            balance: balanceNow,
            currency: info.currency,
            type: type
        };
        return await sendMsgToClient(ctx, 0, "Success", result);

    }


    static async result(ctx) {
        const type = 'bet'
        const {error, msg, info} = await beforeBusiness(ctx, type)
        if (error) {
            return await sendMsgToClient(ctx, 500, msg);
        }
        /**
         * begin insert
         */
        let conn = null;
        try {
            conn = await db.getConnection();
            if (conn == null) {
                return await sendMsgToClient(ctx, 501, "unknown failed");
            }
            conn.beginTransaction();
            await usermodel.userAction(info, conn);
            // 触发活动
            sendGameMsg(info.addr, Date.now(), info.amount, info.currency);
            conn.commit();
        } catch (error) {
            logger.info(error);
            if (conn) conn.release();
            if (error.code === "ER_DUP_ENTRY")
                return await sendMsgToClient(ctx, 0, "Success");
            return await sendMsgToClient(ctx, 501, "Insufficient funds");
        } finally {
            if (conn) conn.release();
        }
        //
        // need to query balance again
        const balanceNow = await usermodel.getBalance(info.tokenInfo, info.currency)
        // need to query balance again
        let result = {
            token: info.token,
            balance: balanceNow,
            currency: info.currency,
            type: type
        };
        return await sendMsgToClient(ctx, 0, "Success", result);
    }

    static async rollback(ctx) {
        const type = 'bet'
        const {error, msg, info} = await beforeBusiness(ctx, type)
        if (error) {
            return await sendMsgToClient(ctx, 500, msg);
        }
        /**
         * begin insert
         */
        let conn = null;
        try {
            conn = await db.getConnection();
            if (conn == null) {
                return await sendMsgToClient(ctx, 501, "unknown failed");
            }
            conn.beginTransaction();
            await usermodel.rollback(info, conn);
            // 触发活动
            sendGameMsg(info.addr, Date.now(), info.amount, info.currency);
            conn.commit();
        } catch (error) {
            logger.info(error);
            if (conn) conn.release();
            if (error.code === "ER_DUP_ENTRY")
                return await sendMsgToClient(ctx, 0, "Success");
            return await sendMsgToClient(ctx, 501, "Insufficient funds");
        } finally {
            if (conn) conn.release();
        }
        //
        // need to query balance again
        const balanceNow = await usermodel.getBalance(info.tokenInfo, info.currency)
        // need to query balance again
        let result = {
            token: info.token,
            balance: balanceNow,
            currency: info.currency,
            type: type
        };
        return await sendMsgToClient(ctx, 0, "Success", result);
    }
}

module.exports = apiCall
