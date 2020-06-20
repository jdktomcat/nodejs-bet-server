const config = require('./src/configs/config')

/**
 * 活动数据访问接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
const activity = require('./src/model/activity')

const activityUtil = require('./src/utils/activityUtil')

const redisUtil = require('./src/utils/redisUtil')

const db = require('./src/utils/dbUtil')

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
    // const result = await db.query('insert into learn_base.test_table(id,name) values ? ' +
    //     'on duplicate key update name=values(name)',[[[6,'name5']]])
    const result = await activity.queryTopUserIntegral(10)
    console.log(result)
    result.forEach((record, index) => {
        record.prize = activityUtil.getPrize(index + 1)
    })
    console.log(result)
    process.exit(0)
}

main()
