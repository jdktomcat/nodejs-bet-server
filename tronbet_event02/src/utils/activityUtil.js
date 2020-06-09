const {activity} = require('../configs/config')

const moment = require('moment');

/**
 * 阶段配置
 * @type {[{rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}]|[{rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}]|[{rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}]}
 */
const stages = activity.championship.stage;


/**
 * 奖品排名映射
 *
 * @type {{"44": number, "45": number, "46": number, "47": number, "48": number, "49": number, "50": number, "10": number, "11": number, "12": number, "13": number, "14": number, "15": number, "16": number, "17": number, "18": number, "19": number, "1": number, "2": number, "3": number, "4": number, "5": number, "6": number, "7": number, "8": number, "9": number, "20": number, "21": number, "22": number, "23": number, "24": number, "25": number, "26": number, "27": number, "28": number, "29": number, "30": number, "31": number, "32": number, "33": number, "34": number, "35": number, "36": number, "37": number, "38": number, "39": number, "40": number, "41": number, "42": number, "43": number}}
 */
const orderPrize:Map = new Map(Object.entries(activity.championship.prize).map(record => {
    record[0] = parseInt(record[0])
    return record;
}))



/**
 * 计算积分
 *
 * @param ts 下注时间戳
 * @param amount 下注金额
 * @returns {number} 积分值
 */
function calIntegral(ts, amount) {
    let integral = 0;
    console.log('calculate integral, ts=' + ts + ' amount=' + amount)
    for (let index = 0; index < stages.length; index++) {
        const stage = stages[index];
        if (ts >= new Date(stage.startTime).getTime() && ts < new Date(stage.endTime).getTime()) {
            integral = amount * stage.rate;
            break;
        }
    }
    return integral;
}

/**
 * 获取对应的奖励
 * @param order 排名
 */
function getPrize(order) {
    if(orderPrize.has(order)){
        return orderPrize.get(order);
    }
    return 0;
}

/**
 * 格式化日期显示
 * @param date 日期
 * @returns {string} 格式化
 */
function formatDate(date){
    return new moment(date).format('YYYY-MM-DD HH:mm:ss')
}

module.exports = {
    calIntegral,
    formatDate,
    getPrize
}
