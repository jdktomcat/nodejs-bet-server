const {activity} = require('../configs/config')

const moment = require('moment');

/**
 * 阶段配置
 * @type {[{rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}]|[{rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}]|[{rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}, {rate: number, name: string, startTime: string, endTime: string}]}
 */
const stages = activity.championship.stage;

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
 * 格式化日期显示
 * @param date 日期
 * @returns {string} 格式化
 */
function formatDate(date){
    return new moment(date).format('YYYY-MM-DD HH:mm:ss')
}

module.exports = {
    calIntegral,
    formatDate
}
