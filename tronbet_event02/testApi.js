
const config = require('./src/configs/config')

/**
 * 活动数据访问接口
 * @type {{insertBatch: insertBatch, getMaxLogId: (function(): number)}}
 */
const activity = require('./src/model/activity')

const activityUtil = require('./src/utils/activityUtil')

/**
 * 奖品排名映射
 *
 * @type {{"44": number, "45": number, "46": number, "47": number, "48": number, "49": number, "50": number, "10": number, "11": number, "12": number, "13": number, "14": number, "15": number, "16": number, "17": number, "18": number, "19": number, "1": number, "2": number, "3": number, "4": number, "5": number, "6": number, "7": number, "8": number, "9": number, "20": number, "21": number, "22": number, "23": number, "24": number, "25": number, "26": number, "27": number, "28": number, "29": number, "30": number, "31": number, "32": number, "33": number, "34": number, "35": number, "36": number, "37": number, "38": number, "39": number, "40": number, "41": number, "42": number, "43": number}}
 */
const orderPrize = new Map()

/**
 * 测试保存信息
 * @returns {Promise<void>}
 */
async function testSaveUserIntegral() {
    const userIntegralDataList = [];
    for (let index = 0; index < 10; index++) {
        userIntegralDataList.push([Math.random().toString(36).substr(2),index,index])
    }
    await activity.saveUserIntegral(userIntegralDataList)
}

async function testFormat(){
    console.log(activityUtil.formatDate(new Date()))
}


async function main() {
    let dataMap = new Map(Object.entries(config.activity.championship.prize).map(record => {
        record[0] = parseInt(record[0])
        return record;
    }))
    console.log(dataMap.get(1))
    process.exit(0)
}

main()
