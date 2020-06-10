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
 * 多久跑一次扫描duel任务 10秒
 * @type {number}
 */
const scanDuelDuration = 10 * 1000

/**
 * 多久跑一次扫描poker任务 10秒
 * @type {number}
 */
const scanPokerDuration = 10 * 1000

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
 * 进行了多少次扫描Duel任务
 */
let scanDuelTimes = 1

/**
 * 进行了多少次同步Poker任务
 */
let scanPokerTimes = 1

/**
 * 扫描下注记录
 */
cronEvent.on('scanBet', () => {
    setInterval(async () => {
        const scanStartTime = new Date();
        console.log('scan start round:' + scanTimes + ' at ' + activityUtil.formatDate(scanStartTime))
        let maxLogId = await activity.getMaxBetLogId();
        console.log('scan param, maxLogId:' + maxLogId + ' startTime:' + startTime + ' endTime:' + endTime)
        const result = await activity.scanBetLog(maxLogId, startTime, endTime);
        if (result && result.length !== 0) {
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
                maxLogId = (maxLogId < record.id ? record.id : maxLogId)
            });
            // 保存用户积分信息
            await activity.saveUserIntegral(userIntegralList)
            // 保存用户飞行燃料信息
            await activity.saveUserFlight(userFlightList)
            // 保存最大扫描记录标示
            await activity.setMaxBetLogId(maxLogId)
        }
        const scanEndTime = new Date();
        const costTime = scanEndTime.getTime() - scanStartTime.getTime();
        console.log('scan bet log complete, round:' + scanTimes + ', at ' + activityUtil.formatDate(scanEndTime) + ', cost:' + costTime + 'ms')
        scanTimes++
    }, scanDuration);
})

/**
 * 扫描duel下注记录表
 */
cronEvent.on("scanDuel", () => {
    setInterval(async () => {
        const scanStartTime = new Date();
        console.log('scan duel start round:' + scanDuelTimes + ' at ' + activityUtil.formatDate(scanStartTime))
        let maxDuelLogId = await activity.getMaxDuelLogId()
        console.log('scan duel param,maxDuelLogId:' + maxDuelLogId + ' startTime:' + startTime + ' endTime:' + endTime)
        const duelResult = await activity.scanDuelBetLog(maxDuelLogId, startTime, endTime);
        if (duelResult && duelResult.length !== 0) {
            const userBetLogList = [];
            duelResult.forEach(record => {
                if (record.player1) {
                    userBetLogList.push([record.player1, record.id, record.amount, 3])
                }
                if (record.player2) {
                    userBetLogList.push([record.player2, record.id, record.amount, 3])
                }
                if (record.player3) {
                    userBetLogList.push([record.player3, record.id, record.amount, 3])
                }
                if (record.player4) {
                    userBetLogList.push([record.player4, record.id, record.amount, 3])
                }
                maxDuelLogId = (maxDuelLogId < record.id ? record.id : maxDuelLogId)
            })
            // 保存用户下注流水日志信息
            await activity.saveUserBetLog(userBetLogList)
            // 保存最大扫描记录标示
            await activity.setMaxDuelLogId(maxDuelLogId)
        }
        const scanEndTime = new Date();
        const costTime = scanEndTime.getTime() - scanStartTime.getTime();
        console.log('scan duel log complete, round:' + scanDuelTimes + ', at ' + activityUtil.formatDate(scanEndTime) + ', cost:' + costTime + 'ms')
        scanDuelTimes++
    }, scanDuelDuration)
})

/**
 * 扫描poker下注记录表
 */
cronEvent.on("scanPoker", () => {
    setInterval(async () => {
        const scanStartTime = new Date();
        console.log('scan poker start round:' + scanPokerTimes + ' at ' + activityUtil.formatDate(scanStartTime))
        let maxPokerLogId = await activity.getMaxPokerLogId()
        console.log('scan poker param,maxPokerLogId:' + maxPokerLogId + ' startTime:' + startTime + ' endTime:' + endTime)
        const pokerResult = await activity.scanPokerBetLog(maxPokerLogId, startTime, endTime);
        if (pokerResult && pokerResult.length !== 0) {
            const userBetLogList = [];
            pokerResult.forEach(record => {
                userBetLogList.push([record.addr, record.id, record.amount, 9])
                maxPokerLogId = (maxPokerLogId < record.id ? record.id : maxPokerLogId)
            })
            // 保存用户下注流水日志信息
            await activity.saveUserBetLog(userBetLogList)
            // 保存最大扫描记录标示
            await activity.setMaxPokerLogId(maxPokerLogId)
        }
        const scanEndTime = new Date();
        const costTime = scanEndTime.getTime() - scanStartTime.getTime();
        console.log('scan poker log complete, round:' + scanPokerTimes + ', at ' + activityUtil.formatDate(scanEndTime) + ', cost:' + costTime + 'ms')
        scanPokerTimes++
    }, scanPokerDuration)
})

// 开奖
cronEvent.on("draw", () => {
    const championshipEndTime = new Date(config.activity.championship.endTime).getTime();
    const nowTime = new Date().getTime();
    if (championshipEndTime > nowTime) {
        const timeout = championshipEndTime - nowTime + 5000;
        setTimeout(async () => {
            const result = await activity.queryTopUserIntegral(top);
            if (result && result.length !== 0) {
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
