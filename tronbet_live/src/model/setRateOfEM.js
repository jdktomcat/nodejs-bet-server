const redisUtil = require("../utils/redisUtil");

async function getSingleAddition(item){
    //
    const redisKey = "tronlive:addition"
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

async function setSingleAddition(item){
    const redisKey = "tronlive:addition"
    const gameId = "" + item.gameId
    const num = item.rate
    //
    let redisRes = await redisUtil.hset(redisKey, gameId, num);
    console.log("redisRes", item.name, redisRes);
}

async function getSingleEMRate(gameItem) {
    await setSingleAddition(gameItem);
    const data = await getSingleAddition(gameItem);
    return data
}


async function getEMAddition(item){
    //
    const redisKey = "tronlive:addition"
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

module.exports = {
    getSingleEMRate,
    getEMAddition,
}
