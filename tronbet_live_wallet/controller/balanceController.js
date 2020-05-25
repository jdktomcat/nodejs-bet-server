const service = require("./../service/balance_service")

class BalanceController {

    static async queryBalance(ctx) {
        const p = ctx.request.body
        const data = await service.query(p)
        ctx.body = {
            code: 200,
            data: data
        }
    }


    static async addBalance(ctx) {
        const p = ctx.request.body
        const data = await service.addBalance(p)
        ctx.body = {
            code: 200,
            data: data
        }
    }


    static async subBalance(ctx) {
        const p = ctx.request.body
        const data = await service.decreaseBalance(p)
        ctx.body = {
            code: 200,
            data: data
        }
    }


}

module.exports = BalanceController