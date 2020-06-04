const ctxUtils = require("../utils/ctxUtils")
const queryWin = require("../model/win/queryWin")

class WinController {

    static async getWin(ctx) {
        const params = ctx.query || {}
        const data = await queryWin.getWin(params)
        ctxUtils.file(ctx, data)
    }

    static async getLive(ctx) {
        const params = ctx.query || {}
        const data = await queryWin.getLive(params)
        ctxUtils.file(ctx, data)
    }

    static async getPoker(ctx) {
        const params = ctx.query || {}
        const data = await queryWin.getPoker(params)
        ctxUtils.file(ctx, data)
    }

    static async getOneDay(ctx) {
        const params = ctx.query || {}
        const data = await queryWin.getOneDayTotal(params)
        ctxUtils.file(ctx, data)
    }

}

module.exports = WinController
