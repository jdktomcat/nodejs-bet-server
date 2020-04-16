const service = require("../service/service");

class apiCall {

    static async identify(ctx) {
        const params = ctx.query || {}
        const t  = await service.identify(params)
        if(t.code === '2'){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }

    static async buy(ctx) {
        const params = ctx.request.body || {}
        const t  = await service.buy(params)
        if(t.code === '2'){
            console.log("debug-------->",ctx)
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }


    static async close(ctx) {
        const params = ctx.request.body || {}
        const t  = await service.close(params)
        if(t.code === '2'){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }

    static async refund(ctx) {
        const params = ctx.request.body || {}
        const t = await service.refund(params)
        if(t.code === '2'){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }
}

module.exports = apiCall
