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

/**
 * 多久跑一次扫描任务 30秒
 */
const scanDuration = 30 * 1000

/**
 * 多久跑一次同步排名任务 60秒
 */
const syncDuration = 60 * 1000

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

/**
 * 进行了多少次扫描任务
 */
let scanTimes = 1

/**
 * 进行了多少次同步任务
 */
let syncTimes = 1

/**
 * 扫描下注记录
 */
cronEvent.on('scanBet', () => {
    setInterval(async () => {
        const scanStartTime = new Date();
        console.log('scan start round:' + scanTimes + ' at ' + activityUtil.formatDate(scanStartTime))
        const maxLogId = await activity.getMaxLogId();
        console.log('scan param,maxLogId:' + maxLogId + ' startTime:' + startTime + ' endTime:' + endTime)
        const result = await activity.scanBetLog(maxLogId, startTime, endTime);
        console.log('scan result:')
        console.log(result)
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
        const scanEndTime = new Date();
        const costTime = scanEndTime.getTime() - scanStartTime.getTime();
        console.log('scan bet log complete, round:' + scanTimes + ', at ' + activityUtil.formatDate(scanEndTime) + ', cost:' + costTime + 'ms')
        scanTimes++
    }, scanDuration);
})

// 同步排名
cronEvent.on("syncRank", () => {
    setInterval(async () => {
        const scanStartTime = new Date();
        console.log('sync rank start, round:' + syncTimes + ' at ' + activityUtil.formatDate(scanStartTime))
        const scanEndTime = new Date();
        const costTime = scanEndTime.getTime() - scanStartTime.getTime();
        console.log('sync rank complete, round:' + syncTimes + ', at ' + activityUtil.formatDate(scanEndTime) + ', cost:' + costTime + 'ms')
        syncTimes++
    }, syncDuration);
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
                let awardUsers = [];
                result.forEach((record, index) => {
                    awardUsers.push([record.addr, index + 1, record.integral, activityUtil.getPrize(index + 1)])
                })
                await activity.saveAwardUser(awardUsers)
                console.log("draw success at " + activityUtil.formatDate(new Date()))
            } else {
                console.error("draw fail,because there is no user data in database,please checkout the data!!!")
            }

        }, timeout)
        console.log('draw will happen at ' + timeout + 'ms!')
    }
})

module.exports = cronEvent
