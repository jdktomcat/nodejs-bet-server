const service = require("../service/service");

class apiCall {

    static async identify(ctx) {
        const params = ctx.request.body || {}
        const t  = await service.identify(params)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }

    static async buy(ctx) {
        const params = ctx.request.body || {}
        const t1  = await service.identify(params)
        if(t1.code === 2){
            ctx.status = 400;
            return ctx.body = t1
        }
        const t  = await service.buy(params)
        console.log("debug buy is ",t)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }


    static async close(ctx) {
        const params = ctx.request.body || {}
        const t1  = await service.identify(params)
        if(t1.code === 2){
            ctx.status = 400;
            return ctx.body = t1
        }
        const t  = await service.close(params)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }

    static async refund(ctx) {
        const params = ctx.request.body || {}
        const t1  = await service.identify(params)
        if(t1.code === 2){
            ctx.status = 400;
            return ctx.body = t1
        }
        const t = await service.refund(params)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }
}

module.exports = apiCall
