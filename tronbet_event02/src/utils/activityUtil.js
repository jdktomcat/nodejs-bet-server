const {activity} = require('../configs/config')

/**
 * 计算积分
 *
 * @param ts 下注时间戳
 * @param amount 下注金额
 * @returns {number} 积分值
 */
function calIntegral(ts, amount) {
    let integral = 0;
    const stages = activity.championship.stage;
    for (let index = 0; index < stages.length; index++) {
        const stage = stages[index];
        if (ts >= stage.startTime && ts < stage.endTime) {
            integral = amount * stage.rate;
            break;
        }
    }
    return integral;
}

module.exports = {
    calIntegral
}
