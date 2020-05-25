const service = require("./../service/balance_service")

const res = function (data) {
    const t  = {
        code: 200,
        message : "success",
        data: data
    }
    console.log("koa_response ",t)
    return t
}

class BalanceController {

    static async queryBalance(ctx) {
        const p = ctx.request.body
        console.log("https headers is ",ctx.request.headers)
        const data = await service.query(p)
        ctx.body = res(data)
    }


    static async addBalance(ctx) {
        const p = ctx.request.body
        const data = await service.addBalance(p)
        ctx.body = res(data)
    }


    static async subBalance(ctx) {
        const p = ctx.request.body
        const data = await service.decreaseBalance(p)
        ctx.body = res(data)
    }


}

module.exports = BalanceController