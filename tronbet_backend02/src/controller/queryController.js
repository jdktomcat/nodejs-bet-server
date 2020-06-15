const DailyTransaction = require("../model/dailyTransaction")
const TopLoss = require("../model/topLoss")
const DrainageTransaction = require("../model/drainageTransaction")
const TopGameId = require("../model/topGameId")
const TopUser = require("../model/topUsers")
const TransactionByAddr = require("../model/transactionByAddr")
const transactionByAddrAndDate = require("../model/transactionByAddrAndDate")
const BalanceAudit = require("../model/balanceAudit")
const ctxUtils = require("../utils/ctxUtils")

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
        //startDate, endDate
        const addr = ctx.query.addr
        const startDate = ctx.query.startDate
        const endDate = ctx.query.endDate
        const data = await TransactionByAddr.getData(addr, startDate, endDate)
        ctx.body = ctxUtils.success(data)
    }

    static async getAddrTransaction(ctx) {
        const addr = ctx.query.addr
        const startDate = ctx.query.startDate
        const endDate = ctx.query.endDate
        const data = await TransactionByAddr.getDataFile(addr, startDate, endDate)
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
        const data = await transactionByAddrAndDate.getData(addr, start, end)
        ctx.body = ctxUtils.success(data)
    }

    static async getAddrDate(ctx) {
        const addr = ctx.query.addr
        const start = ctx.query.start
        const end = ctx.query.end
        const data = await transactionByAddrAndDate.getDataFile(addr, start, end)
        ctxUtils.file(ctx, data)
    }

    /**
     * 根据日期余额审计查询列表
     */
    static async getBalanceAuditList(ctx) {
        const addr = ctx.query.addr
        const startDate = ctx.query.startDate
        const endDate = ctx.query.endDate
        const offset = ctx.query.offset
        const limit = ctx.query.limit
        const count = await BalanceAudit.countBalanceAudit(addr, startDate, endDate)
        const data = await BalanceAudit.getBalanceAuditPage(addr, startDate, endDate, offset, limit)
        data.forEach(record => {
            record.live_balance = record.live_balance / 1000000
            record.calc_balance = record.calc_balance / 1000000
        })
        ctx.body = ctxUtils.success({count: count.total, list: data})
    }

    /**
     * 下载根据日期查询余额信息列表
     */
    static async downloadBalanceAudit(ctx) {
        const addr = ctx.query.addr
        const startDate = ctx.query.startDate
        const endDate = ctx.query.endDate
        const data = await BalanceAudit.getBalanceAuditList(addr, startDate, endDate)
        data.forEach(record => {
            record.live_balance = record.live_balance / 1000000
            record.calc_balance = record.calc_balance / 1000000
        })
        let fileName = 'balance_audit_' + Date.now() + "_" + Math.random().toString(36).substr(2) + '.xls';
        ctxUtils.fileWithData(ctx, data, fileName)
    }

    /**
     * 根据钱包地址查询清除账户日志列表
     */
    static async queryClearLog(ctx) {
        const addr = ctx.query.addr
        const data = await BalanceAudit.queryClearLogList(addr)
        data.forEach(record => {
            record.clear_balance = record.clear_balance / 1000000
            record.live_balance = record.live_balance / 1000000
            record.calc_balance = record.calc_balance / 1000000
        })
        ctx.body = ctxUtils.success(data)
    }

    /**
     * 下载根据钱包地址查询清除账户日志列表
     */
    static async downloadClearLog(ctx) {
        const addr = ctx.query.addr
        const data = await BalanceAudit.queryClearLogList(addr)
        data.forEach(record => {
            record.clear_balance = record.clear_balance / 1000000
            record.live_balance = record.live_balance / 1000000
            record.calc_balance = record.calc_balance / 1000000
        })
        let fileName = 'clear_log_' + Date.now() + "_" + Math.random().toString(36).substr(2) + '.xls';
        ctxUtils.fileWithData(ctx, data, fileName)
    }
}

module.exports = QueryController
