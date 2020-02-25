const ctxUtils = require("./ctxUtils")
const dailyTotal = require("../model/dailySchedule/dailyTotal")


class TotalController {
    /**
     * 搜索部分用户区间段交易
     */
    static async getTotalData(ctx) {
        const startDate = ctx.query.startDate
        const endDate = ctx.query.endDate
        const data = await dailyTotal.queryAllData(startDate,endDate)
        ctx.body = ctxUtils.success(data)
    }

    static async getTotalFile(ctx) {
        const startDate = ctx.query.startDate
        const endDate = ctx.query.endDate
        const data = await dailyTotal.queryAllDataFile(startDate,endDate)
        ctxUtils.file(ctx, data)
    }

}

module.exports = TotalController