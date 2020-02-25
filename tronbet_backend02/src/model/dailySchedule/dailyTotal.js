const {getdayList,getTimeFormat,newUtcTime,raw} = require('./../utils/dbutils')
const dailyDAU = require('./dailyDAU')
const dailyAmount = require('./dailyAmount')

const addAllData = async function (day_str, data_str, ts) {
    const sql = `insert into tron_bet_admin.sum_dice_data(type,day_str,data_str,ts) values ('all',?,?,?)`
    await raw(sql, [day_str, data_str, ts])
}

const queryEmptyData = async function () {
    const sql = `select * from tron_bet_admin.sum_dice_data where type = 'all'`
    const data = await raw(sql,[])
    if(data.length === 0){
        return true
    }else {
        return false
    }
}

const processAllData = async function (start ,end) {
    const c = getdayList(start ,end)
    const now = getTimeFormat(new Date())
    let ss = []
    for (let i = 0; i < c.length - 1; i++) {
        let start = c[i]
        let end = c[i + 1]
        console.log(getTimeFormat(start),getTimeFormat(end))
        const dau = await dailyDAU.getData(start,end)
        const totalAddr = await dailyDAU.getData('2019-01-01',now)
        const amount = await dailyAmount.getData(start,end)
        const o = {
            day : getTimeFormat(start),
            dau : dau,
            totalAddr : totalAddr,
        }
        Object.assign(o,amount)
        const data_str = JSON.stringify(o)
        //
        const day_str = o.day
        const ts = newUtcTime(day_str).getTime()
        await addAllData(day_str, data_str, ts);
    }
}


const startSche = async function(){
    const bool = await queryEmptyData()
    if(bool){
        await processAllData('2019-11-04','2020-02-25')
    }else {
        console.log("do not need insert")
    }
}


module.exports = {
    startSche,
    processAllData
}