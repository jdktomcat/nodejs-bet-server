const redisUtil = require("../utils/redisUtil");

async function getSingleAddition(item){
    const redisKey = "tronlive:hub88:addition"
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


async function getAddition(hub88Gamelist) {
    let a = []
    for (let item of hub88Gamelist) {
        let o = await getSingleAddition(item)
        a.push(o)
    }
    return a
}


async function setSingleAddition(gameInfo){
    const redisKey = "tronlive:hub88:addition"
    const gameId = "" + gameInfo.gameId
    const rate = gameInfo.rate
    //
    let redisRes = await redisUtil.hset(redisKey, gameId, rate);
    console.log("redisRes", gameInfo.name, redisRes);
}

async function setAddition(hub88Gamelist) {
    for (let gameInfo of hub88Gamelist) {
        await setSingleAddition(gameInfo)
    }
}


// [
//     {
//         "name": "Torch of Fire",
//         "gameId": 619,
//         "rate": 1
//     },
//     {
//         "name": "Hidden Kingdom",
//         "gameId": 620,
//         "rate": 1
//     },
//     {
//         "name": "Magic Forest",
//         "gameId": 621,
//         "rate": 1
//     }
// ]
async function setHub88Rate(hub88Gamelist) {
    try {
        await setAddition(hub88Gamelist);
        const a = await getAddition(hub88Gamelist);
        return a
    } catch (e) {
        console.log("set/get hub88 mutiple error." + e.toString());
    }
}



async function getSingleHub88Rate(gameItem) {
    try {
        await setSingleAddition(gameItem);
        const a = await getSingleAddition(gameItem);
        return a
    } catch (e) {
        console.log("set/get hub88 single error." + e.toString());
    }
}


module.exports = {
    setHub88Rate,
    getSingleHub88Rate,
    getSingleAddition
}
