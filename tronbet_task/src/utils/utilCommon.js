
function injectPromise(func, ...args) {
    return new Promise((resolve, reject) => {
        func(...args, (err, res) => {
            if(err)
                reject(err);
            else resolve(res);
        });
    });
}

module.exports.injectPromise = injectPromise;

///////////////////////////////////////////////////
const moment = require('moment-timezone');
const TIME_ZONE = 'Asia/Shanghai';
const TIMESTAMP_FORMAT = "YYYY-MM-DD HH:mm:ss";
module.exports.toBeijingTime = (ts)=>{
    return moment(ts).tz(TIME_ZONE).format(TIMESTAMP_FORMAT) + " UTC+8";
}

///////////////////////////////////////////////////
module.exports.sleep = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            return resolve(true);
        }, 1000);
    })
}
