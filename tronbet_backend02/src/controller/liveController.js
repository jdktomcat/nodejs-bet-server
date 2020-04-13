const ctxUtils = require("./ctxUtils")
const QueryById = require("../model/live/queryById")
const QueryUsers = require("../model/live/queryUsers")
const queryEM = require("../model/live/queryEM")
const queryHub88 = require("../model/live/queryHub88")
const querySport = require("../model/live/querySport")
const queryDeposit = require("../model/live/queryDeposit")
const queryWithDraw = require("../model/live/queryWithDraw")
const QueryDrop = require("../model/live/queryAirDrop")
const queryOtherCurrency = require("../model/live/queryOtherCurrency")
const queryAirData = require("../model/live/queryAirDropList")
const blackListOpreate = require("../model/live/queryBlackList")

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
        const data = await QueryById.getDataFile(type, start, end, game_id)
        ctxUtils.file(ctx, data)
    }


    static async getAccount(ctx) {
        const email = ctx.query.email
        const data = await QueryUsers.getAccount(email)
        ctx.body = ctxUtils.success(data)
    }


    static async getBalanceFile(ctx) {
        const currency = ctx.query.currency
        const data = await QueryUsers.getBalanceFile(currency)
        ctxUtils.file(ctx, data)
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

    static async getDepositFile(ctx) {
        const params = ctx.query || {}
        const data = await queryDeposit.getDataFile(params)
        ctxUtils.file(ctx,data)
    }


    static async getWithDraw(ctx) {
        const params = ctx.query || {}
        const data = await queryWithDraw.getData(params)
        ctx.body = ctxUtils.success(data)
    }

    static async getWithDrawFile(ctx) {
        const params = ctx.query || {}
        const data = await queryWithDraw.getDataFile(params)
        ctxUtils.file(ctx,data)
    }

    static async getDropList(ctx) {
        const params = ctx.query || {}
        const data = await QueryDrop.getData(params)
        ctx.body = ctxUtils.success(data)
    }

    static async getOtherCurrencyList(ctx) {
        const params = ctx.query || {}
        const data = await queryOtherCurrency.getData(params)
        ctx.body = ctxUtils.success(data)
    }

    static async getOtherCurrencyFile(ctx) {
        const params = ctx.query || {}
        const data = await queryOtherCurrency.getDataFile(params)
        ctxUtils.file(ctx, data)
    }


    static async queryAirDropData(ctx) {
        const params = ctx.query || {}
        const data = await queryAirData.getData(params)
        ctx.body = ctxUtils.success(data)
    }


    static async queryBlackList(ctx) {
        const params = ctx.query || {}
        const data = await blackListOpreate.queryBlackList(params)
        ctx.body = ctxUtils.success(data)
    }


    static async addBlackList(ctx) {
        const params = ctx.body || {}
        console.log("debug ctx.body ",ctx)
        console.log("debug add ",params)
        const data = await blackListOpreate.addBlackList(params)
        ctx.body = ctxUtils.success(data)
    }

}

module.exports = LiveController