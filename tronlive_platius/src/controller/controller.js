const service = require("../service/service");

class apiCall {

    static async balance(ctx) {
        try {
            const params = ctx.request.body || {}
            console.log("debug----->param", params)
            Object.keys(params).forEach(e => params[e] = params[e] || '')
            const data = await service.checkBalance(params)
            await service.sendMsgToClient(ctx, 0, "Success", data);
        } catch (e) {
            await service.sendMsgToClient(ctx, 500, e.toString());
        }
    }

    static async bet(ctx) {
        try {
            const type = 'bet'
            const {error, msg, info} = await service.beforeBusiness(ctx, type)
            if (error) {
                return await service.sendMsgToClient(ctx, 500, msg);
            }
            await service.execBet(info)
            // 触发活动
            service.sendGameMsg(info.addr, Date.now(), info.amount, info.currency);
            const result = await service.getRs(info)
            return await service.sendMsgToClient(ctx, 0, "Success", result);
        } catch (e) {
            console.log(new Date(), ' platinus bet error : ', e)
            await service.sendMsgToClient(ctx, 500, e.toString());
        }
    }


    static async result(ctx) {
        try {
            const type = 'result'
            const {error, msg, info} = await service.beforeBusiness(ctx, type)
            if (error) {
                return await service.sendMsgToClient(ctx, 500, msg);
            }
            await service.execBet(info)
            // 触发活动
            service.sendGameMsg(info.addr, Date.now(), info.amount, info.currency);
            const result = await service.getRs(info)
            await service.sendMsgToClient(ctx, 0, "Success", result);
        } catch (e) {
            console.log(new Date(), ' platinus result error : ', e)
            await service.sendMsgToClient(ctx, 500, e.toString(), {});
        }
    }

    static async rollback(ctx) {
        try {
            const type = 'rollback'
            const {error, msg, info} = await service.beforeBusiness(ctx, type)
            if (error) {
                return await service.sendMsgToClient(ctx, 500, msg);
            }
            await service.execRollBack(info)
            // 触发活动
            service.sendGameMsg(info.addr, Date.now(), info.amount, info.currency);
            const result = await service.getRs(info)
            await service.sendMsgToClient(ctx, 0, "Success", result);
        } catch (e) {
            console.log(new Date(), ' platinus rollback error : ', e)
            await service.sendMsgToClient(ctx, 500, e.toString());
        }
    }
}

module.exports = apiCall
