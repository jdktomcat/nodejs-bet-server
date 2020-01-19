const redisUtil = require("../utils/redisUtil");

class RedisRate {
    constructor(redisKey) {
        this.redisKey = redisKey
    }

    async setRate(item) {
        const redisKey = this.redisKey
        const gameId = "" + item.gameId
        const num = item.rate
        let redisRes = await redisUtil.hset(redisKey, gameId, num);
        console.log("redisRes", item.name, redisRes);
    }

    async getRate(item) {
        const redisKey = this.redisKey
        const gameId = "" + item.gameId
        let multi = await redisUtil.hget(redisKey, gameId);
        //
        console.log(redisKey, multi);
        let o = {
            gameId: item.gameId,
            name: item.name,
            nowRate: multi,
        }
        return o
    }

    static async setAndGetRate(redisKey, gameItem) {
        const o = new RedisRate(redisKey)
        await o.setRate(gameItem)
        const data = await o.getRate(gameItem);
        return data
    }
}

class RefreshRateUtils {
    static async refreshEM(gameItem) {
        const redisKey = "tronlive:addition"
        const data = await RedisRate.setAndGetRate(redisKey, gameItem);
        return data
    }

    static async getRateEM(gameItem) {
        const redisKey = "tronlive:addition"
        const data = await new RedisRate(redisKey).getRate(gameItem);
        return data
    }

    static async refreshHub88(gameItem) {
        const redisKey = "tronlive:hub88:addition"
        const data = await RedisRate.setAndGetRate(redisKey, gameItem);
        return data
    }

    //
    static async getRateHub88(gameItem) {
        const redisKey = "tronlive:hub88:addition"
        const data = await new RedisRate(redisKey).getRate(gameItem);
        return data
    }


    static async refreshSport(num) {
        let info = {};
        info.type = "all";
        info.num = num;
        let redisRes = await redisUtil.hset("tronlive:sport:addition", "" + info.type, info.num);
        console.log("redisRes", info.type, redisRes);
    }

    //
    static async getRateSport() {
        let multi = await redisUtil.hget("tronlive:sport:addition", "" + "all");
        console.log("tronlive:sport:addition", multi);
        if (!multi) return 1;
        return Number(multi);
    }

}

module.exports = RefreshRateUtils
