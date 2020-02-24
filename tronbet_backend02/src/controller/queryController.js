const DailyTransaction = require("../model/dailyTransaction")
const TopLoss = require("../model/topLoss")
const DrainageTransaction = require("../model/drainageTransaction")
const TopGameId = require("../model/topGameId")
const TopUser = require("../model/topUsers")
const TransactionByAddr = require("../model/transactionByAddr")
const transactionByAddrAndDate = require("../model/transactionByAddrAndDate")
const dailyDAU = require("../model/dailyDAU")
const ctxUtils = require("./ctxUtils")

class QueryController {

    /**
     * daily data
     * @param ctx
     * @returns {Promise<void>}
     */
    static async dailyDataList(ctx) {
        if (ctxUtils.businessCheck(ctx)) {
            const {type, startDate, endDate} = ctx.query
            const data = await DailyTransaction.getDailyData(type, startDate, endDate)
            ctx.body = ctxUtils.success(data)
        }
    }

    //
    static async dailyData(ctx) {
        if (ctxUtils.businessCheck(ctx)) {
            const {type, startDate, endDate} = ctx.query
            const data = await DailyTransaction.getDailyDataFile(type, startDate, endDate)
            ctxUtils.file(ctx, data)
        }
    }

    /**
     * top loss list
     * @param ctx
     * @returns {Promise<void>}
     */
    static async getTopLoss(ctx) {
        if (ctxUtils.businessCheck(ctx)) {
            const {type, startDate, endDate} = ctx.query
            const data = await TopLoss.getTopLossFile(type, startDate, endDate)
            ctxUtils.file(ctx, data)
        }
    }

    static async getTopLossList(ctx) {
        if (ctxUtils.businessCheck(ctx)) {
            const {type, startDate, endDate} = ctx.query
            const data = await TopLoss.getTopLoss(type, startDate, endDate)
            ctx.body = ctxUtils.success(data)
        }
    }

    /**
     * 引流人数的交易流水汇总
     * @param ctx
     * @returns {Promise<void>}
     */
    static async getDrainageList(ctx) {
        const params = ctx.query
        Object.keys(params).forEach(e => params[e] = params[e] || '')
        const {type, startDate, endDate} = params
        const data = await DrainageTransaction.getDrainageData(type, startDate, endDate)
        ctx.body = ctxUtils.success(data)
    }


    static async getDrainageFile(ctx) {
        const params = ctx.query
        Object.keys(params).forEach(e => params[e] = params[e] || '')
        const {type, startDate, endDate} = params
        const data = await DrainageTransaction.getDrainageDataFile(type, startDate, endDate)
        ctxUtils.file(ctx, data)
    }


    /**
     * gameId daily交易流水汇总
     * @param ctx
     * @returns {Promise<void>}
     */
    static async topLossById(ctx) {
        const params = ctx.query
        Object.keys(params).forEach(e => params[e] = params[e] || '')
        const {type, game_id, startDate, endDate} = params
        const data = await TopGameId.getTopLossById(type, game_id, startDate, endDate)
        ctx.body = ctxUtils.success(data)
    }

    //
    static async topLossByIdFile(ctx) {
        const params = ctx.query
        Object.keys(params).forEach(e => params[e] = params[e] || '')
        const {type, game_id, startDate, endDate} = params
        const data = await TopGameId.getTopLossByIdFile(type, game_id, startDate, endDate)
        ctxUtils.file(ctx, data)
    }

    /**
     * topUsers
     */
    static async topUserList(ctx) {
        const params = ctx.query
        Object.keys(params).forEach(e => params[e] = params[e] || '')
        const {type, offset, limit} = params
        const start = Number(offset) + 1
        const end = Number(limit)
        const data = await TopUser.getTopUserList(type, start, end)
        ctx.body = ctxUtils.success(data)
    }

    static async topUser(ctx) {
        const params = ctx.query
        Object.keys(params).forEach(e => params[e] = params[e] || '')
        const {type, offset, limit} = params
        const data = await TopUser.getTopUserFile(type, offset, limit)
        ctxUtils.file(ctx, data)
    }

    /**
     * 根据用户获取交易
     */
    static async getAddrTransactionList(ctx) {
        const addr = ctx.query.addr
        const data = await TransactionByAddr.getData(addr)
        ctx.body = ctxUtils.success(data)
    }

    static async getAddrTransaction(ctx) {
        const addr = ctx.query.addr
        const data = await TransactionByAddr.getDataFile(addr)
        ctxUtils.file(ctx, data)
    }

    //
    /**
     * 搜索部分用户区间段交易
     */
    static async getAddrDateList(ctx) {
        const addr = ctx.query.addr
        const start = ctx.query.start
        const end = ctx.query.end
        const data = await transactionByAddrAndDate.getData(addr,start,end)
        ctx.body = ctxUtils.success(data)
    }

    static async getAddrDate(ctx) {
        const addr = ctx.query.addr
        const start = ctx.query.start
        const end = ctx.query.end
        const data = await transactionByAddrAndDate.getDataFile(addr,start,end)
        ctxUtils.file(ctx, data)
    }

    /**
     * 根据用户获取交易
     */
    static async getDAU(ctx) {
        const day = ctx.query.day
        const data = await dailyDAU.getDailyData(day)
        ctx.body = ctxUtils.success(data)
    }

}

module.exports = QueryController