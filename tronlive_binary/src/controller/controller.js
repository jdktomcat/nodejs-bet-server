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
        const body = ctx.request.body || {}
        const {tokenError, tokenInfo}  = await service.getToken(body)
        if (tokenError) {
            ctx.status = 400;
            return ctx.body = 'check with token!'
        }
        const t  = await service.buy(tokenInfo)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }


    static async close(ctx) {
        const body = ctx.request.body || {}
        const {tokenError, tokenInfo}  = await service.getToken(body)
        if (tokenError) {
            ctx.status = 400;
            return ctx.body = 'check with token!'
        }
        const t  = await service.close(tokenInfo)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }

    static async refund(ctx) {
        const body = ctx.request.body || {}
        const {tokenError, tokenInfo}  = await service.getToken(body)
        if (tokenError) {
            ctx.status = 400;
            return ctx.body = 'check with token!'
        }
        const t = await service.refund(tokenInfo)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }
}

module.exports = apiCall
