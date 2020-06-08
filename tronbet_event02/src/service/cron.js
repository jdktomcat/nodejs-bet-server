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
const startTime = config.activity.startTime

/**
 * 活动结束时间
 */
const endTime = config.activity.endTime

/**
 * 燃料汇率
 * @type {number}
 */
const fuelRate = config.activity.flight.rate;

/*
    多久跑一次任务
 */
const duration = 30 * 1000;
/*
    进行了多少次任务
 */
let times = 1;

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
                if (record.ts >= config.activity.championship.startTime && record.ts < config.activity.championship.endTime) {
                    userIntegralList.push([record.addr, activityUtil.calIntegral(record.ts, record.amount), record.id])
                }
                if (record.ts >= config.activity.flight.startTime && record.ts < config.activity.flight.endTime) {
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

module.exports = cronEvent
