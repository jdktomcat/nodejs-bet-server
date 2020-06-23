const config = require('../configs/config')
const events = require('events')
const cronEvent = new events.EventEmitter()

/**
 * 活动数据访问接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
const activity = require('../service/activity')

/**
 * 支付时常间隔
 * @type {number}
 */
const payTimeout = 60 * 60 * 1000

// 开奖
cronEvent.on('draw', () => {
    const championshipEndTime = new Date(config.activity.championship.endTime).getTime()
    const nowTime = new Date().getTime()
    if (championshipEndTime > nowTime) {
        const timeout = championshipEndTime - nowTime + 5000
        setTimeout(async () => {
            await draw()
        }, timeout)
        console.log('draw will happen at ' + timeout + 'ms!')
    }
})

// 发放奖励
cronEvent.on('pay', async () => {
    const payAll = await activity.pay()
    if (!payAll) {
        setTimeout(async () => {
            // 发放奖品
            cronEvent.emit('pay')
        }, payTimeout)
    }
})

/**
 * 开奖
 */
async function draw() {
    // 开奖处理
    await activity.draw()

    // 发放奖品 开奖两天之后
    setTimeout(async () => {
        cronEvent.emit('pay')
    }, 2 * 24 * 60 * 60 * 100)
}

module.exports = cronEvent
