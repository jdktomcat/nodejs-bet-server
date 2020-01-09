
const sha3 = require('js-sha3')
const {app} = require('../configs/config')

const redisUtil = require('./redisUtil')
const _ = require('lodash')._

let originalSeed = sha3.keccak256(Date.now().toString())


let freeRate = [150000, 1000000]
let payRate = [150000, 999992, 1000000]

// const luckNums = [randomRange(1, 2000000), randomRange(2000001, 5000000), randomRange(5000001, 10000000), randomRange(100000001, 1000000000)]

const luckNums = [randomRange(1, 2000), randomRange(6000001, 7000000)]

let redisKey = 'event:poker:info'

let luckyUsers = []
let joker100 = []

console.log(luckNums)

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}


function getRandomSeed() {
    let salt = app.randomSalt || "";
    originalSeed = sha3.keccak256(Date.now().toString() + originalSeed + salt);
    return originalSeed;
}

function hasHitBefore(addr) {
    for(let i =0; i<luckyUsers.length; i++) {
        if (addr == luckyUsers[i].addr) return true
    }

    return false
}

async function openBox(addr, freeNum, openNum) {
    let payOpenTimes = await redisUtil.hget(redisKey, 'opentimes')
    if (!payOpenTimes) {
        payOpenTimes = 0
    } else {
        payOpenTimes = Number(payOpenTimes)
    }

    let now = new Date().getTime()
    let lastpayOpenTimes = payOpenTimes

    let joker101 = []
    if(freeNum < openNum) {
        payOpenTimes += (openNum - freeNum)
        if (!hasHitBefore(addr)) {
            let indeedOpenTimes = await redisUtil.hincrby(redisKey, 'opentimes', openNum - freeNum)
            console.log('addr,indeedOpenTimes ,payOpenTimes---------->>>>>>>>>>>>>>>',addr,indeedOpenTimes ,payOpenTimes )
            if (lastpayOpenTimes <= 2e6) {
               // 1 - 200w
               let luckNum = luckNums[0]
               let begin = indeedOpenTimes - (openNum - freeNum);
               console.log('begin, luckNum, payOpenTimes ------->:',addr, begin, luckNum, payOpenTimes)
               if (begin < luckNum && indeedOpenTimes >= luckNum) {
                   //要中奖了小伙子
                    let checkNum = await redisUtil.hincrby(redisKey, 'luckersNum1', 1)
                    if (checkNum == 1) {
                        //真的中奖了, 在次检测该玩家是否曾经中奖
                        if (!hasHitBefore(addr)) {
                            openNum = openNum - 1
                            luckyUsers.push({addr : addr, ts : now})
                            await redisUtil.hset(redisKey, 'luckyUsers', JSON.stringify(luckyUsers))
                            joker101.push(53)
                        }
                    }
               }
            }  else if (lastpayOpenTimes > 6e6 && lastpayOpenTimes <= 7e6 && indeedOpenTimes == payOpenTimes) {
               // 600w - 700w
               let luckNum = luckNums[1]
               let begin = indeedOpenTimes - (openNum - freeNum);
               console.log('begin, luckNum, payOpenTimes ------->:',addr, begin, luckNum, payOpenTimes)
               if (begin < luckNum && indeedOpenTimes >= luckNum) {
                   //要中奖了小伙子
                    let checkNum = await redisUtil.hincrby(redisKey, 'luckersNum2', 1)
                    if (checkNum == 1) {
                        //真的中奖了, 在次检测该玩家是否曾经中奖
                        if (!hasHitBefore(addr)) {
                            openNum = openNum - 1
                            luckyUsers.push({addr : addr, ts : now})
                            await redisUtil.hset(redisKey, 'luckyUsers', JSON.stringify(luckyUsers))
                            joker101.push(53)
                        }
                    }
               }
            } 
            // else if (lastpayOpenTimes > 2e6 && lastpayOpenTimes <= 10e6 && indeedOpenTimes == payOpenTimes) {
            //     let luckNum = luckNums[2]
            //     console.log('lastpayOpenTimes, luckNum, payOpenTimes', lastpayOpenTimes, luckNum, payOpenTimes)
            //     if (lastpayOpenTimes < luckNum && payOpenTimes >= luckNum) {
            //         //要中奖了小伙子
            //         let checkNum = await redisUtil.hincrby(redisKey, 'luckersNum3', 1)
            //         if (checkNum == 1) {
            //             //真的中奖了, 在次检测该玩家是否曾经中奖
            //             if (!hasHitBefore(addr)) {
            //                 openNum = openNum - 1
            //                 luckyUsers.push({addr : addr, ts : now})
            //                 await redisUtil.hset(redisKey, 'luckyUsers', JSON.stringify(luckyUsers))
            //                 joker101.push(53)
            //             }
            //         }
            //     }
            // }
        }
    }

    let result = []
    if(freeNum < openNum) {
        result = [...(await openFreeMultiBox(freeNum)), ...(await openMultiBox(openNum - freeNum))]
    } else {
        result = (await openFreeMultiBox(openNum))
    }
    
    if (joker101.length == 1) {
        result =  [...result, ...joker101]
    }

    try {
        for (let one of result) {
            if (one == 52) {
                joker100.push({addr : addr, ts : new Date().getTime()})
                await redisUtil.hset(redisKey, 'joker100', JSON.stringify(joker100))
            }
        }
    } catch (error) {
        console.log(error)
    }

    return result
}

async function randomCards(types) {
    if (types == 0) {
        return await getRandomInt(32, 51)
    } else if (types == 1) {
        return await getRandomInt(0, 31)
    } else if (types == 2) {
        return 52
    } else {
        return 0
    }
}

async function open1Box() {
    let luckyNum = await getRandomInt(1, 1000000)
    let sum = 0
    let rate = payRate
    for (let i =0; i< rate.length; i++) {
        sum = rate[i]
        if (sum >= luckyNum) return await randomCards(i)
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


async function open1FreeBox() {
    let luckyNum = await getRandomInt(1, 1000000)
    let sum = 0
    let rate = freeRate
    for (let i =0; i< rate.length; i++) {
        sum = rate[i]
        if (sum >= luckyNum) return await randomCards(i)
    }
    return 1
}

async function openFreeMultiBox(num) {
    let result = []
    for (let i = 0; i < num; i++){
        result.push(await open1FreeBox())
    }
    return result
}

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

async function initData() {
    let res = await redisUtil.hget(redisKey, 'luckyUsers')
    let joker100s = await redisUtil.hget(redisKey, 'joker100')
    console.log('luckyUsers--luckyUsers--luckyUsers================>', res, joker100s)
    try {
        if (res) {
            luckyUsers = JSON.parse(res)
        }
        if(joker100s) {
            joker100 = JSON.parse(joker100s)
        }
    } catch (error) {
        console.log(error)
    }

}

initData()

module.exports = {
    sleep,
    getRandomSeed,
    openBox,
}


async function main() {
    let result = await openBox(0,100000000)

    let obj = {}
    result.map(item => {
        obj[item] = (obj[item] || 0) + 1
    })

    console.log(obj)
}