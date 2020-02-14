const ctxUtils = require("./ctxUtils")
const QueryById = require("../model/live/queryById")

class LiveController {
    /**
     * 搜索部分用户区间段交易
     */
    static async getListByGameId(ctx) {
        const addr = ctx.query.addr
        const start = ctx.query.start
        const end = ctx.query.end
        const game_id = ctx.query.game_id
        const data = await QueryById.getData(addr, start, end, game_id)
        ctx.body = ctxUtils.success(data)
    }

    static async getFlieByGameId(ctx) {
        const addr = ctx.query.addr
        const start = ctx.query.start
        const end = ctx.query.end
        const game_id = ctx.query.game_id
        const data = await QueryById.getDataFile(addr, start, end,game_id)
        ctxUtils.file(ctx, data)
    }
}

module.exports = LiveController