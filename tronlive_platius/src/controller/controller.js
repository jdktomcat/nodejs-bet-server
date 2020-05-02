const service = require("../service/service");

class apiCall {

    static async balance(ctx) {
        try {
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
            const type = 'bet'
            const params = ctx.request.body || {}
            console.log("debug bet----->param", params)
            const {error, msg, info,code} = await service.beforeBusiness(ctx, type)
            if (error) {
                return await service.sendMsgToClient(ctx, code, msg);
            }
            await service.execBet(info)
            const result = await service.getRs(info)
            return await service.sendMsgToClient(ctx, 0, "Success", result);
        } catch (e) {
            console.log(new Date(), ' platinus bet error : ', e)
            await service.sendMsgToClient(ctx, 1004, e.toString());
        }
    }


    static async result(ctx) {
        try {
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
            // 触发活动
            service.sendGameMsg(info.addr, Date.now(), info.amount, info.currency);
            await service.sendMsgToClient(ctx, 0, "Success", result);
        } catch (e) {
            console.log(new Date(), ' platinus result error : ', e)
            await service.sendMsgToClient(ctx, 1004, e.toString(), {});
        }
    }

    static async rollback(ctx) {
        try {
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
