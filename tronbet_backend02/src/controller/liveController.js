const ctxUtils = require("./ctxUtils")
const QueryById = require("../model/live/queryById")
const QueryUsers = require("../model/live/queryUsers")

class LiveController {
    /**
     * 搜索部分用户区间段交易
     */
    static async getListByGameId(ctx) {
        const type = ctx.query.type
        const start = ctx.query.start
        const end = ctx.query.end
        const game_id = ctx.query.game_id
        const data = await QueryById.getData(type, start, end, game_id)
        ctx.body = ctxUtils.success(data)
    }

    static async getFlieByGameId(ctx) {
        const type = ctx.query.type
        const start = ctx.query.start
        const end = ctx.query.end
        const game_id = ctx.query.game_id
        const data = await queryUsers.getDataFile(type, start, end,game_id)
        ctxUtils.file(ctx, data)
    }


    static async getAccount(ctx) {
        const email = ctx.query.email
        const data = await QueryUsers.getAccount(email)
        ctxUtils.file(ctx, data)
    }

}

module.exports = LiveController