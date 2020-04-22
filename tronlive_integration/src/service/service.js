const _ = require('lodash')._
const usermodel = require("../model/userinfo");
const resdisUtils = require("../utils/redisUtil");
const {decrypt} = require("../utils/common");
const config = require("../configs/config");
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

const getAdditionRate = function () {
    try {
        const now = Date.now()
        const start = config.addition.START_TS
        const end = config.addition.END_TS
        const rate = config.addition.RATE
        console.log(new Date(start))
        console.log(new Date(end))
        if (now >= start && now <= end) {
            return Number(rate)
        } else {
            return 1
        }
    } catch (error) {
        return 1;
    }
}

class Service {

    static success(data) {
        // return {
        //     code: 200,
        //     message: "success",
        //     data: data,
        // }
        return data
    }

    static error(messgae) {
        return {
            code: 2,
            message: messgae,
        }
    }

    static async getToken(params){
        const t = await usermodel.checkToken(params.payload)
        return t
    }

    static async identify(params) {
        console.log("identify params is ", params)
        const {tokenError, tokenInfo} = usermodel.checkToken(params.payload)
        if (tokenError) {
            return this.error("token parse error , please check with your token!")
        } else {
            console.log("token info is ",tokenInfo)
            const rawToken = tokenInfo.token
            let tron_address = ''
            let currency = ''
            try{
                let iToken = decrypt(rawToken)
                let [dayTime,addr,currencyTmp] = iToken.split("-")
                console.log("decrypt iToken is ",dayTime,addr,currencyTmp)
                console.log("decrypt time is ",Date.now() - Number(dayTime))
                const time = Date.now() - Number(dayTime)
                if(time >= 5 * 24 * 60 * 60 * 1000){
                    return this.error("token is expire, please check with your token!")
                }
                tron_address = addr
                currency = currencyTmp
            }catch (e) {
                console.log(e)
                return this.error("addr is error, please check with your token!")
            }
            const p = {
                addr: tron_address,
                currency: currency
            }
            const balanceInfo = await usermodel.getBalance(p)
            return this.success(balanceInfo)
        }
    }

    static async buy(params) {
        console.log("buy params is ", params)
        //
        if (!['TRX', 'USDT'].includes(params.currency)) {
            return this.error("currency value is error !")
        }
        //
        const dictFields = [params.kind, params.status, params.expiration.type]
        const dictFieldsSign = dictFields.every(e => [1, 2].includes(Number(e)))
        console.log(dictFields)
        if (!dictFieldsSign) {
            return this.error("kind/status/expiration_type value is invaild !")
        }
        const beforebalance = await usermodel.getBalance({addr: params.user, currency: params.currency})
        if (Number(params.sum) > Number(beforebalance.balance)) {
            return this.error("balance not enough!")
        }
        let amount = Number(params.sum)
        //
        const price_now = await usermodel.getTRXPrice(params.currency)
        const rate = getAdditionRate()
        console.log("debug ----> price_now , rate, amount ",price_now, rate, amount)
        const adAmount = Number(price_now) * rate * amount
        console.log("debug adAmount is ----> ",adAmount)
        const sqlParam = {
            'transaction_id': params.id,
            'addr': params.user,
            'asset': params.asset,
            'kind': Number(params.kind),
            'amount': amount,
            'win': 0,
            'adAmount': adAmount,
            'currency': params.currency,
            'quote_open': Number(params.quoteOpen),
            'quote_close': 0,
            'created_at': new Date(params.createdAt).getTime(),
            'profitability': Number(params.profitability),
            'expiration_date': new Date(params.expiration.date).getTime(),
            'expiration_type': Number(params.expiration.type)
        }
        await usermodel.buy(sqlParam)
        const balanceInfo = await usermodel.getBalance(sqlParam)
        sendGameMsg(sqlParam.addr, Date.now(), sqlParam.amount, sqlParam.currency);
        return this.success(balanceInfo)
    }

    static async close(params) {
        console.log("close params is ", params)
        if (!['TRX', 'USDT'].includes(params.currency)) {
            return this.error("currency value is error !")
        }
        const p = {
            win: Number(params.income),
            transaction_id: params.id,
            addr: params.user,
            currency: params.currency,
            quote_close : params.quoteClose,
        }
        await usermodel.close(p)
        const balanceInfo = await usermodel.getBalance(p)
        return this.success(balanceInfo)
    }

    static async refund(params) {
        if (!['TRX', 'USDT'].includes(params.currency)) {
            return this.error("currency value is error !")
        }
        const p = {
            amount: Number(params.sum),
            transaction_id: params.id,
            addr: params.user,
            currency: params.currency
        }
        await usermodel.refund(p)
        const balanceInfo = await usermodel.getBalance(p)
        return this.success(balanceInfo)
    }

}


module.exports = Service