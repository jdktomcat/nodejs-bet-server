const ctxUtils = require("./ctxUtils")
const QueryById = require("../model/live/queryById")
const QueryUsers = require("../model/live/queryUsers")
const queryEM = require("../model/live/queryEM")
const queryHub88 = require("../model/live/queryHub88")
const querySport = require("../model/live/querySport")
const queryDeposit = require("../model/live/queryDeposit")
const queryWithDraw = require("../model/live/queryWithDraw")

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

    static async getFileByGameId(ctx) {
        const type = ctx.query.type
        const start = ctx.query.start
        const end = ctx.query.end
        const game_id = ctx.query.game_id
        const data = await QueryById.getDataFile(type, start, end,game_id)
        ctxUtils.file(ctx, data)
    }


    static async getAccount(ctx) {
        const email = ctx.query.email
        const data = await QueryUsers.getAccount(email)
        ctx.body = ctxUtils.success(data)
    }


    static async getEM(ctx) {
        const params = ctx.query || {}
        const data = await queryEM.getData(params)
        ctx.body = ctxUtils.success(data)
    }

    static async getHub88(ctx) {
        const params = ctx.query || {}
        const data = await queryHub88.getData(params)
        ctx.body = ctxUtils.success(data)
    }

    static async getSport(ctx) {
        const params = ctx.query || {}
        const data = await querySport.getData(params)
        ctx.body = ctxUtils.success(data)
    }

    static async getDeposit(ctx) {
        const params = ctx.query || {}
        const data = await queryDeposit.getData(params)
        ctx.body = ctxUtils.success(data)
    }

    static async getWithDraw(ctx) {
        const params = ctx.query || {}
        const data = await queryWithDraw.getData(params)
        ctx.body = ctxUtils.success(data)
    }
}

module.exports = LiveController