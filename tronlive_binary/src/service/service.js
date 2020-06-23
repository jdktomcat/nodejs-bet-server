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
    if (currency !== "TRX" || _now < ACTIVITY_START_TS || _now > ACTIVITY_END_TS) return;
    resdisUtils.redis.publish("game_message", JSON.stringify({addr: addr, order_id: order_id, amount:trxAmount, game_type: 8}));
    // if (currency !== "TRX" && currency !== "USDT") {
    //     return;
    // }
    //
    // if (currency === "TRX" && trxAmount < 100) {
    //     return [trxAmount, 0, false];
    // }
    //
    // if (currency === "USDT" && trxAmount < 10) {
    //     return [trxAmount, 0, false];
    // }
    //
    // //箱子爆率=投注额^0.527163*0.3%
    // //箱子爆率=投注额^0.495424251*0.3%
    // let persent = Math.floor(Math.pow(trxAmount, 0.495424251) * 30);
    // if (persent > 9000) persent = 9000;
    // let _r = _.random(0, 10000);
    // let hit = false;
    // if (_r <= persent) {
    //     hit = true;
    // }
    // if (hit === true) {
    //     let msg = {
    //         addr: addr,
    //         order_id: order_id,
    //         box_num: 1,
    //         game_type: _GAME_TYPE
    //     };
    //     resdisUtils.redis.publish("game_message", JSON.stringify(msg));
    // }
    // return [trxAmount, persent, hit];
}

const getAdditionRate = function () {
    try {
        const now = Date.now()
        const start = config.addition.START_TS
        const end = config.addition.END_TS
        const rate = config.addition.RATE
        if (now >= start && now <= end) {
            return Number(rate)
        } else {
            return 1
        }
    } catch (error) {
        return 1;
    }
}

const logParams = function (params, type) {
    if (type === 'identify') {
        console.log(`${new Date()},${type}_params `, params)
    } else {
        console.log(`${new Date()},${type}_params@${params.id} `, params)
    }
}

class Service {

    static success(data) {
        console.log(data)
        return data
    }

    static error(messgae) {
        const t = {
            code: 2,
            message: messgae,
        }
        console.log(t)
        return t
    }


    static async filterClose(params) {
        const data = await usermodel.getBalance({addr: params.user, currency: params.currency})
        const t = {
            code: 3,
            message: "this tx is expired!",
            data: data
        }
        console.log(t)
        return t
    }


    static async getToken(params) {
        const t = await usermodel.checkToken(params.payload)
        //
        const {tokenError, tokenInfo} = t
        if (tokenError) {
            return t
        }
        const user = tokenInfo.user || ''
        //TUMqj1BGbqTcp8j9gDLQWDWYV1cKXgCmf9
        const whiteList = [
            'TXdWwzoq74BKUQx4JeEYnUs41EdGpyZKbP',
            'TUMqj1BGbqTcp8j9gDLQWDWYV1cKXgCmf9',
            'TBAeSpwD5zWr2Zx8avZ2mBHnhLxmuYZUR5',
            'TCx1ogE6nezZdbucbDtPR4FyGeHCDcnKu2',
            'TCZvmCLQTaLWsNFhKXvLA67bqsP9uB8M7o',
            'TUSBc3o2PvW2bPRiUiQfvm9FjERthtynN8',
            'TDg1bjCjtLBrN1HyZSaMTsetwzacznhL9F',
        ]
        console.log("user is ", user, !whiteList.includes(user.trim()))
        const env = process.env.NODE_ENV
        if (env === 'test') {
            return t
        }
        if (!whiteList.includes(user.trim())) {
            // return {
            //     tokenError: true,
            //     tokenInfo: {},
            // }
            // 放开白名单
            return t
        } else {
            return t
        }
    }

    static async identify(params) {
        logParams(params, 'identify')
        const {tokenError, tokenInfo} = usermodel.checkToken(params.payload)
        if (tokenError) {
            return this.error("token parse error , please check with your token!")
        } else {
            console.log("token info is ", tokenInfo)
            const rawToken = decodeURIComponent(tokenInfo.token)
            let tron_address = ''
            let currency = ''
            try {
                let iToken = decrypt(rawToken)
                let [dayTime, addr, currencyTmp] = iToken.split("-")
                console.log("decrypt iToken is ", dayTime, addr, currencyTmp)
                console.log("decrypt time is ", Date.now() - Number(dayTime))
                //
                const time = Date.now() - Number(dayTime)
                //token有效期30hours
                if (time >= 30 * 60 * 60 * 1000) {
                    return this.error("token is expire, please check with your token!")
                }
                tron_address = addr
                currency = currencyTmp
            } catch (e) {
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
        logParams(params, 'buy')
        //
        if (!['TRX'].includes(params.currency)) {
            // if (!['TRX', 'USDT'].includes(params.currency)) {
            return this.error("currency value is error !")
        }
        //
        const dictFields = [params.kind, params.status, params.expiration.type]
        const dictFieldsSign = dictFields.every(e => [1, 2].includes(Number(e)))
        if (!dictFieldsSign) {
            return this.error("kind/status/expiration_type value is invaild !")
        }
        const beforebalance = await usermodel.getBalance({addr: params.user, currency: params.currency})
        if (Number(params.sum) > Number(beforebalance.balance)) {
            return this.error("balance not enough!")
        }
        let amount = Number(params.sum)
        // 改成 10000 单笔
        if (amount > 10000 * 1e6) {
            return this.error("play amount too large!")
        }
        //
        const price_now = await usermodel.getTRXPrice(params.currency)
        const rate = getAdditionRate()
        const adAmount = Number(price_now) * rate * amount
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
        console.log(`transaction_id${sqlParam.transaction_id}@addr${sqlParam.addr}@buy${sqlParam.amount / 1e6}TRX`)
        await usermodel.buy(sqlParam)
        const balanceInfo = await usermodel.getBalance(sqlParam)
        //
        return this.success(balanceInfo)
    }

    static async close(params) {
        logParams(params, 'close')
        if (!['TRX', 'USDT'].includes(params.currency)) {
            return this.error("currency value is error !")
        }
        const expiration = params.expiration || {}
        const expiration_date = expiration.date || ''
        const expiration_date_time = new Date(expiration_date).getTime()
        console.log("expiration is ", expiration_date, new Date())
        if (isNaN(expiration_date_time)) {
            const rs = await this.filterClose(params)
            return rs
        }
        // 30 hours
        const timeStr = Date.now() - expiration_date_time - 30 * 60 * 60 * 1000
        if (timeStr > 0) {
            const rs = await this.filterClose(params)
            return rs
        }
        const sqlParam = {
            win: Number(params.income),
            transaction_id: params.id,
            addr: params.user,
            currency: params.currency,
            quote_close: params.quoteClose,
        }
        console.log(`transaction_id${sqlParam.transaction_id}@addr${sqlParam.addr}@close${sqlParam.win / 1e6}TRX`)
        const isClose = await usermodel.isTxClose(sqlParam)
        if (isClose) {
            const rs = await this.filterClose(params)
            return rs
        }
        await usermodel.close(sqlParam)
        const balanceInfo = await usermodel.getBalance(sqlParam)
        // activity
        // sendGameMsg(sqlParam.addr, Date.now(), sqlParam.amount, sqlParam.currency);
        return this.success(balanceInfo)
    }

    static async refund(params) {
        logParams(params, 'refund')
        if (!['TRX', 'USDT'].includes(params.currency)) {
            return this.error("currency value is error !")
        }
        const expiration = params.expiration || {}
        const expiration_date = expiration.date || ''
        const expiration_date_time = new Date(expiration_date).getTime()
        console.log("expiration is ", expiration_date, new Date())
        if (isNaN(expiration_date_time)) {
            const rs = await this.filterClose(params)
            return rs
        }
        // 30 hours
        const timeStr = Date.now() - expiration_date_time - 30 * 60 * 60 * 1000
        if (timeStr > 0) {
            const rs = await this.filterClose(params)
            return rs
        }
        const sqlParam = {
            amount: Number(params.sum),
            transaction_id: params.id,
            addr: params.user,
            currency: params.currency
        }
        console.log(`transaction_id${sqlParam.transaction_id}@addr${sqlParam.addr}@close${sqlParam.amount / 1e6}TRX`)
        const isClose = await usermodel.isTxClose(sqlParam)
        if (isClose) {
            const rs = await this.filterClose(params)
            return rs
        }
        await usermodel.refund(sqlParam)
        const balanceInfo = await usermodel.getBalance(sqlParam)
        return this.success(balanceInfo)
    }

}


module.exports = Service
