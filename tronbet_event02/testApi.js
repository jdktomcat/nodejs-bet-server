const config = require('./src/configs/config')

/**
 * 活动数据访问接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
const activity = require('./src/model/activity')

const activityUtil = require('./src/utils/activityUtil')

const redisUtil = require('./src/utils/redisUtil')

/**
 * 测试保存信息
 * @returns {Promise<void>}
 */
async function testSaveUserIntegral() {
    const userIntegralDataList = [];
    for (let index = 0; index < 10; index++) {
        userIntegralDataList.push([Math.random().toString(36).substr(2), index, index])
    }
    await activity.saveUserIntegral(userIntegralDataList)
}

async function testFormat() {
    console.log(activityUtil.formatDate(new Date()))
}


async function main() {
    const result = await redisUtil.lpush("list-key", ["value1", "value2", "value3", "value4", "value5"])
    console.log(result)
    process.exit(0)
}

main()
