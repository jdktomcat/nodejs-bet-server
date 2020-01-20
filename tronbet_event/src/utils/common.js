
const sha3 = require('js-sha3')
const {app, boxConf} = require('../configs/config')

const redisUtil = require('./redisUtil')
const _ = require('lodash')._

let originalSeed = sha3.keccak256(Date.now().toString())


let freeRate = [150000, 1000000]
let payRate = [150000, 999992, 1000000]

// const luckNums = [randomRange(1, 2000000), randomRange(2000001, 5000000), randomRange(5000001, 10000000), randomRange(100000001, 1000000000)]

const luckNums = [randomRange(1, 2000), randomRange(6000001, 7000000)]

let redisKey = 'event:poker:info'


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}


function getRandomSeed() {
    let salt = app.randomSalt || "";
    originalSeed = sha3.keccak256(Date.now().toString() + originalSeed + salt);
    return originalSeed;
}

// function hasHitBefore(addr) {
//     for(let i =0; i<luckyUsers.length; i++) {
//         if (addr == luckyUsers[i].addr) return true
//     }

//     return false
// }

// async function isYouAVeryLuckBoy(num) {
//     console.log('--------openPayNum---------->>>>>>>>>>>>>>>>', num)
//     if (num < 1) return false
//     for (let i = 0; i< num; i++) {
//         let luckyNum = await getRandomInt(0, 5e6)
//         if (luckyNum == 5e6) return true
//     }
//     return false
// }

// async function openBox(addr, freeNum, openNum) {
//     let payOpenTimes = await redisUtil.hget(redisKey, 'opentimes')
//     if (!payOpenTimes) {
//         payOpenTimes = 0
//     } else {
//         payOpenTimes = Number(payOpenTimes)
//     }

//     let now = new Date().getTime()
//     let lastpayOpenTimes = payOpenTimes

//     let joker101 = []
//     if(freeNum < openNum) {
//         payOpenTimes += (openNum - freeNum)
//         if (!hasHitBefore(addr)) {
//             let indeedOpenTimes = await redisUtil.hincrby(redisKey, 'opentimes', openNum - freeNum)
//             // console.log('addr,indeedOpenTimes ,payOpenTimes---------->>>>>>>>>>>>>>>',addr,indeedOpenTimes ,payOpenTimes )
//             // if (lastpayOpenTimes <= 2e6) {
//             //    // 1 - 200w
//             //    let luckNum = luckNums[0]
//             //    let begin = indeedOpenTimes - (openNum - freeNum);
//             //    console.log('begin, luckNum, payOpenTimes ------->:',addr, begin, luckNum, payOpenTimes)
//             //    if (begin < luckNum && indeedOpenTimes >= luckNum) {
//             //        //要中奖了小伙子
//             //         let checkNum = await redisUtil.hincrby(redisKey, 'luckersNum1', 1)
//             //         if (checkNum == 1) {
//             //             //真的中奖了, 在次检测该玩家是否曾经中奖
//             //             if (!hasHitBefore(addr)) {
//             //                 openNum = openNum - 1
//             //                 luckyUsers.push({addr : addr, ts : now})
//             //                 await redisUtil.hset(redisKey, 'luckyUsers', JSON.stringify(luckyUsers))
//             //                 joker101.push(53)
//             //             }
//             //         }
//             //    }
//             // }  else if (lastpayOpenTimes > 6e6 && lastpayOpenTimes <= 7e6 && indeedOpenTimes == payOpenTimes) {
//             //    // 600w - 700w
//             //    let luckNum = luckNums[1]
//             //    let begin = indeedOpenTimes - (openNum - freeNum);
//             //    console.log('begin, luckNum, payOpenTimes ------->:',addr, begin, luckNum, payOpenTimes)
//             //    if (begin < luckNum && indeedOpenTimes >= luckNum) {
//             //        //要中奖了小伙子
//             //         let checkNum = await redisUtil.hincrby(redisKey, 'luckersNum2', 1)
//             //         if (checkNum == 1) {
//             //             //真的中奖了, 在次检测该玩家是否曾经中奖
//             //             if (!hasHitBefore(addr)) {
//             //                 openNum = openNum - 1
//             //                 luckyUsers.push({addr : addr, ts : now})
//             //                 await redisUtil.hset(redisKey, 'luckyUsers', JSON.stringify(luckyUsers))
//             //                 joker101.push(53)
//             //             }
//             //         }
//             //    }
//             // } 
//             // else if (lastpayOpenTimes > 2e6 && lastpayOpenTimes <= 10e6 && indeedOpenTimes == payOpenTimes) {
//             //     let luckNum = luckNums[2]
//             //     console.log('lastpayOpenTimes, luckNum, payOpenTimes', lastpayOpenTimes, luckNum, payOpenTimes)
//             //     if (lastpayOpenTimes < luckNum && payOpenTimes >= luckNum) {
//             //         //要中奖了小伙子
//             //         let checkNum = await redisUtil.hincrby(redisKey, 'luckersNum3', 1)
//             //         if (checkNum == 1) {
//             //             //真的中奖了, 在次检测该玩家是否曾经中奖
//             //             if (!hasHitBefore(addr)) {
//             //                 openNum = openNum - 1
//             //                 luckyUsers.push({addr : addr, ts : now})
//             //                 await redisUtil.hset(redisKey, 'luckyUsers', JSON.stringify(luckyUsers))
//             //                 joker101.push(53)
//             //             }
//             //         }
//             //     }
//             // }
//         }
//     }

//     let luckyNumRandomNum = await redisUtil.hget(redisKey, 'luckyNumRandom')

//     if (!luckyNumRandomNum) {
//         luckyNumRandomNum = 0
//     } else {
//         luckyNumRandomNum = Number(luckyNumRandomNum)
//     }

//     if((freeNum < openNum)  && (luckyNumRandomNum < 2)) {
//         console.log('---------------------------------in--random--field-------------------------------------------')
//         let payOpenNum = openNum - freeNum
//         let isLuck = await isYouAVeryLuckBoy(payOpenNum)
//         if (isLuck && !hasHitBefore(addr)) {
//             let checkNum = await redisUtil.hincrby(redisKey, 'luckyNumRandom', 1)
//             if (checkNum <= 2) {
//                 openNum = openNum - 1
//                 luckyUsers.push({addr : addr, ts : now})
//                 await redisUtil.hset(redisKey, 'luckyUsers', JSON.stringify(luckyUsers))
//                 joker101.push(53)
//             }
//         }
//     }

//     let result = []
//     // 只有付费箱子才能开出小王
//     // if(freeNum < openNum) {
//     //     result = [...(await openFreeMultiBox(freeNum)), ...(await openMultiBox(openNum - freeNum))]
//     // } else {
//     //     result = (await openFreeMultiBox(openNum))
//     // }

//     result = (await openMultiBox(openNum))
    
//     if (joker101.length == 1) {
//         result =  [...result, ...joker101]
//     }

//     try {
//         for (let one of result) {
//             if (one == 52) {
//                 joker100.push({addr : addr, ts : new Date().getTime()})
//                 await redisUtil.hset(redisKey, 'joker100', JSON.stringify(joker100))
//             }
//         }
//     } catch (error) {
//         console.log(error)
//     }

//     return result
// }

// async function randomCards(types) {
//     if (types == 0) {
//         return await getRandomInt(32, 51)
//     } else if (types == 1) {
//         return await getRandomInt(0, 31)
//     } else if (types == 2) {
//         return 52
//     } else {
//         return 0
//     }
// }

// async function open1Box() {
//     let luckyNum = await getRandomInt(1, 1000000)
//     let sum = 0
//     let rate = payRate
//     for (let i =0; i< rate.length; i++) {
//         sum = rate[i]
//         if (sum >= luckyNum) return await randomCards(i)
//     }
//     return 1
// }

// async function openMultiBox(num) {
//     let result = []
//     for (let i = 0; i < num; i++){
//         result.push(await open1Box())
//     }
//     return result
// }


// async function open1FreeBox() {
//     let luckyNum = await getRandomInt(1, 1000000)
//     let sum = 0
//     let rate = freeRate
//     for (let i =0; i< rate.length; i++) {
//         sum = rate[i]
//         if (sum >= luckyNum) return await randomCards(i)
//     }
//     return 1
// }

// async function openFreeMultiBox(num) {
//     let result = []
//     for (let i = 0; i < num; i++){
//         result.push(await open1FreeBox())
//     }
//     return result
// }

async function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function randomRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function openBox(num) {
    if (num > 1) {
        return await openMultiBox(num)
    } else {
        return [await open1Box()]
    }
}

async function open1Box() {
    let luckyNum = await getRandomInt(1, 38628)
    let sum = 0
    let rate = boxConf.goodsRate
    for (let i =0; i< rate.length; i++) {
        sum = rate[i]
        if (sum >= luckyNum) return i + 1
    }
    return 1
}

async function openMultiBox(num) {
    let result = []
    for (let i = 0; i < num; i++){
        result.push(await open1Box())
    }
    return result
}

async function lottery() {
    let luckyNum = await getRandomInt(1, 999000)
    let sum = 0
    let rate = boxConf.lotteryRate
    for (let i =0; i< rate.length; i++) {
        sum += rate[i]
        if (sum >= luckyNum) return i + 1
    }
    return 1
}

async function lotteryFree() {
    let luckyNum = await getRandomInt(1, 1440000)
    let sum = 0
    let rate = [50000, 50000, 600000, 400000, 300000, 40000]
    for (let i =0; i< rate.length; i++) {
        sum += rate[i]
        if (sum >= luckyNum) return i + 1
    }
    return 1
}

async function randTrx() {
    let luckyNum = await getRandomInt(1, 100000)
    if (luckyNum <=  90100){
        return getRandomInt(20, 50)
    }else {
        return  100
    }
    // if (luckyNum <=  99100) return getRandomInt(51, 1000)
    // if (luckyNum <=  99900) return getRandomInt(1001, 10000)
    // if (luckyNum <=  100000) return getRandomInt(10001, 99999)
}

async function isWardTrx() {
    let luckyNum = await getRandomInt(1, 1000)
    if (luckyNum <= 200) return true
    return false
}

async function randomMulti(){
    let multi = [5,10,20,25,30,50,100,200,500,1000]
    let rate = [100000,50000,10000,5000,3000,1000,300,100,30,10]
    let luckyNum = await getRandomInt(1, 169440)
    let sum = 0
    for (let i =0; i< rate.length; i++) {
        sum += rate[i]
        if (sum >= luckyNum) return multi[i]
    }
    return multi[0]
}

async function randomBMW() {
    // 暂时屏蔽掉
    let luckyNum = await getRandomInt(1, 100000)
    // 概率 100 / 100000  大概是 1/1000
    // if (luckyNum <= 100){
    if (luckyNum >= 1000){
        return true
    }
    
    return false
}

module.exports = {
    sleep,
    getRandomSeed,
    openBox,
    lottery,
    randTrx,
    lotteryFree,
    isWardTrx,
    randomMulti,
    randomBMW
}
