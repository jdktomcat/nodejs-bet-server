const config = require('../configs/config')
const events = require('events')
const cronEvent = new events.EventEmitter()

/**
 * 活动数据访问接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
const activity = require('../model/activity')

/**
 * 活动工具类
 * @type {*}
 */
const activityUtil = require('../utils/activityUtil')

/**
 * 活动开始时间
 */
const startTime = new Date(config.activity.startTime).getTime()

/**
 * 活动结束时间
 */
const endTime = new Date(config.activity.endTime).getTime()

/**
 * 燃料汇率
 * @type {number}
 */
const fuelRate = config.activity.flight.rate

/*
 *   多久跑一次任务
 */
const duration = 30 * 1000

/**
 * 奖品排名映射
 *
 * @type {{"44": number, "45": number, "46": number, "47": number, "48": number, "49": number, "50": number, "10": number, "11": number, "12": number, "13": number, "14": number, "15": number, "16": number, "17": number, "18": number, "19": number, "1": number, "2": number, "3": number, "4": number, "5": number, "6": number, "7": number, "8": number, "9": number, "20": number, "21": number, "22": number, "23": number, "24": number, "25": number, "26": number, "27": number, "28": number, "29": number, "30": number, "31": number, "32": number, "33": number, "34": number, "35": number, "36": number, "37": number, "38": number, "39": number, "40": number, "41": number, "42": number, "43": number}}
 */
const orderPrize = config.activity.championship.prize

/**
 * 锦标赛奖励排名
 * @type {number}
 */
const top = config.activity.championship.top

/**
 * 锦标赛开始时间
 * @type {number}
 */
const championshipStartTime = new Date(config.activity.championship.startTime).getTime()

/**
 * 锦标赛结束时间
 * @type {number}
 */
const championshipEndTime = new Date(config.activity.championship.endTime).getTime()

/**
 * 飞行游戏开始时间
 * @type {number}
 */
const flightStartTime = new Date(config.activity.flight.startTime).getTime()

/**
 * 飞行游戏结束时间
 * @type {number}
 */
const flightEndTime = new Date(config.activity.flight.startTime).getTime()

/*
    进行了多少次任务
 */
let times = 1

/**
 * 扫描下注记录
 */
cronEvent.on('scanBet', () => {
    setInterval(async () => {
        const maxLogId = await activity.getMaxLogId();
        const result = await activity.scanBetLog(maxLogId, startTime, endTime);
        if (result && result.length != 0) {
            const userIntegralList = [];
            const userFlightList = [];
            result.forEach(record => {
                if (record.ts >= championshipStartTime && record.ts < championshipEndTime) {
                    userIntegralList.push([record.addr, activityUtil.calIntegral(record.ts, record.amount), record.id])
                }
                if (record.ts >= flightStartTime && record.ts < flightEndTime) {
                    if (record.amount >= config.activity.flight.minAmount) {
                        userFlightList.push([record.addr, record.amount * fuelRate, 0, record.id])
                    } else {
                        console.warn("bet amount is too small,can not get fuel! bet log id:" + record.id)
                    }
                }
            });
            // 保存用户积分信息
            await activity.saveUserIntegral(userIntegralList)
            // 保存用户飞行燃料信息
            await activity.saveUserFlight(userFlightList)
        }
        console.log('scan bet log complete, round:' + times)
        times++
    }, duration);
})

// 开奖
cronEvent.on("draw", () => {
    const championshipEndTime = new Date(config.activity.championship.endTime).getTime();
    const nowTime = new Date().getTime();
    if (championshipEndTime > nowTime) {
        const timeout = championshipEndTime - nowTime + 5000;
        setTimeout(async () => {
            const result = await activity.queryTopUserIntegral(top);
            if (!result && result.length != 0) {
                let order = 1
                let awardUsers = [];
                result.forEach(record => {
                    awardUsers.push([record.addr, order, record.integral, orderPrize.get(order)])
                })
                await activity.saveAwardUser(awardUsers)
                console.log("draw success at " + new Date().format("yyyy-MM-dd hh:mm:ss"))
            } else {
                console.error("draw fail,because there is no user data in database,please checkout the data!!!")
            }

        }, timeout)
        console.log('draw will happen at ' + timeout + 'ms!')
    }
})

module.exports = cronEvent
