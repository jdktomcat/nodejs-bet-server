const {getdayList,getTimeFormat} = require('./../utils/dbutils')
const dailyDAU = require('./dailyDAU')
const dailyAmount = require('./dailyAmount')


const sche = async function () {
    // const c = getdayList('2019-11-04','2020-02-24')
    const c = getdayList('2019-11-04','2019-11-05')
    const now = getTimeFormat(new Date())
    let ss = []
    for (let i = 0; i < c.length - 1; i++) {
        let start = c[i]
        let end = c[i + 1]
        console.log(getTimeFormat(start),getTimeFormat(end))
        const dau = await dailyDAU.getData(start,end)
        const totalAddr = await dailyDAU.getData('2019-07-19',now)
        const amount = await dailyAmount.getData(start,end)
        const o = {
            day : getTimeFormat(start),
            dau : dau,
            totalAddr : totalAddr,
        }
        Object.assign(o,amount)
        console.log(o)
    }
}

sche()