const service = require("../service/service");

const inWhileList = function (headers) {
    const cf_ip = headers['cf-connecting-ip'] || ''
    const env = process.env.NODE_ENV
    if(env === 'production'){
        console.log("ip is ",cf_ip)
        const whileList = ['92.42.104.130']
        if(whileList.includes(cf_ip.trim())){
            return false
        }else {
            return true
        }
    }
    return false
}

class apiCall {

    static async balance(ctx) {
        try {
            //
            console.log(`${new Date().toJSON()}-->check balance headers : `,ctx.request.headers)
            const isBalck = inWhileList(ctx.request.headers)
            if(isBalck){
                console.log("debug---->Black ",isBalck)
                return service.sendMsgToClient(ctx, 1011, '401 not forbidden!', {});
            }
            //
            const params = ctx.request.body || {}
            console.log("debug----->param", params)
            Object.keys(params).forEach(e => params[e] = params[e] || '')
            const {code,error,data} = await service.checkBalance(params)
            if(code === 0){
                await service.sendMsgToClient(ctx, 0, "Success", data);
            }else {
                await service.sendMsgToClient(ctx, code, error, data);
            }
        } catch (e) {
            await service.sendMsgToClient(ctx, 1004, e.toString());
        }
    }

    static async bet(ctx) {
        try {
            const isBalck = inWhileList(ctx.request.headers)
            if(isBalck){
                console.log("debug---->Black ",isBalck)
                return service.sendMsgToClient(ctx, 1015, '401 not forbidden!', {});
            }
            const type = 'bet'
            const params = ctx.request.body || {}
            console.log("debug bet----->param", params)
            const {error, msg, info,code} = await service.beforeBusiness(ctx, type)
            if (error) {
                return await service.sendMsgToClient(ctx, code, msg);
            }
            await service.execBet(info)
            const result = await service.getRs(info)
            // 触发活动
            service.sendGameMsg(info.addr, info.transaction_id, info.amount, info.currency);
            return await service.sendMsgToClient(ctx, 0, "Success", result);
        } catch (e) {
            console.log(new Date(), ' platinus bet error : ', e)
            await service.sendMsgToClient(ctx, 1004, e.toString());
        }
    }


    static async result(ctx) {
        try {
            const isBalck = inWhileList(ctx.request.headers)
            if(isBalck){
                console.log("debug---->Black ",isBalck)
                return service.sendMsgToClient(ctx, 1015, '401 not forbidden!', {});
            }
            const type = 'result'
            const params = ctx.request.body || {}
            console.log("debug result----->param", params)
            const {error, msg, info,code} = await service.beforeBusiness(ctx, type)
            if (error) {
                return await service.sendMsgToClient(ctx, code, msg);
            }
            const ifExist = await service.queryTxIfExist(info)
            if(ifExist){
                await service.execBet(info)
            }else {
                console.log("this tx_id is over--------> ",info.transaction_id)
                return await service.sendMsgToClient(ctx, 1011, 'the tx_id is close!');
            }
            const result = await service.getRs(info)
            await service.sendMsgToClient(ctx, 0, "Success", result);
        } catch (e) {
            console.log(new Date(), ' platinus result error : ', e)
            await service.sendMsgToClient(ctx, 1004, e.toString(), {});
        }
    }

    static async rollback(ctx) {
        try {
            const isBalck = inWhileList(ctx.request.headers)
            if(isBalck){
                console.log("debug---->Black ",isBalck)
                return service.sendMsgToClient(ctx, 1015, '401 not forbidden!', {});
            }
            const type = 'rollback'
            const params = ctx.request.body || {}
            console.log("debug rollback----->param", params)
            const {error, msg, info,code} = await service.beforeBusiness(ctx, type)
            if (error) {
                return await service.sendMsgToClient(ctx, code, msg);
            }
            const ifExist = await service.queryTxIfExist(info)
            if(ifExist){
                await service.execRollBack(info)
            }else {
                console.log("this tx_id is over: ",info.transaction_id)
                return await service.sendMsgToClient(ctx, 1011, 'the tx_id is close!');
            }
            const result = await service.getRs(info)
            //
            await service.sendMsgToClient(ctx, 0, "Success", result);
        } catch (e) {
            console.log(new Date(), ' platinus rollback error : ', e)
            await service.sendMsgToClient(ctx, 1004, e.toString());
        }
    }
}

module.exports = apiCall
