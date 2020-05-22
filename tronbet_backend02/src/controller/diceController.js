const ctxUtils = require("./ctxUtils")
const diceQuery = require("../model/dice/diceQuery")
const queryPlayers = require("../model/dice/queryPlayers")

class LiveController {

    static async queryDice(ctx) {
        const data = await diceQuery.queryDice(ctx.query)
        ctx.body = ctxUtils.success(data)
    }

    static async queryMoon(ctx) {
        const data = await diceQuery.queryMoon(ctx.query)
        ctx.body = ctxUtils.success(data)
    }

    static async queryRing(ctx) {
        const data = await diceQuery.queryRing(ctx.query)
        ctx.body = ctxUtils.success(data)
    }


    static async queryPlayer(ctx) {
        const data = await queryPlayers.getInfo(ctx.query)
        ctx.body = ctxUtils.success(data)
    }


    static async test(ctx) {
        const logPm2List = require("./../dailySchedule/logPm2List")
        const data = logPm2List()
        ctx.body = ctxUtils.success(data)
    }

}

module.exports = LiveController