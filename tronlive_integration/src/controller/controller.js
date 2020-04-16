const service = require("../service/service");

class apiCall {

    static async identify(ctx) {
        const params = ctx.query || {}
        ctx.body = await service.identify(params)
    }

    static async buy(ctx) {
        const params = ctx.request.body || {}
        ctx.body = await service.buy(params)
    }


    static async close(ctx) {
        const params = ctx.request.body || {}
        ctx.body = await service.close(params)
    }

    static async refund(ctx) {
        const params = ctx.request.body || {}
        ctx.body = await service.refund(params)
    }
}

module.exports = apiCall
