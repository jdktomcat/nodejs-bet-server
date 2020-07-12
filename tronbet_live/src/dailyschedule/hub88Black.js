const db = require('../utils/dbUtil')

const raw = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}

const getDate = function () {
    let start = new Date();
    let endTs = start.getTime()
    start.setUTCDate(start.getUTCDate() - 1)
    let startTS = start.getTime()
    //动态24小时
    return [startTS, endTs]
}

const hub88Data = async function () {
    const [start, end] = getDate()
    // 如果为-300w就拉黑
    const min = -3000000
    const sql = `
    select g.* from (
        SELECT
            email as addr,
            count(1) as count,
            sum(amount) / 1000000 as all_amount,
            sum(win) / 1000000  as all_win,
            (sum(amount) - sum(win)) / 1000000  as balance
        FROM
            tron_live.swagger_transaction_log
        WHERE
            ts >= ${start}
            AND ts < ${end}
            AND status = 1
            AND currency = 'TRX'
            group by addr
    ) as g where g.balance < ${min} order by g.balance asc        
    `
    const data = await raw(sql, [])
    console.log('checkhub88_data',data)
    return data
}

const process = async function () {
    const data = await hub88Data()
    const sql1 = 'insert into tron_live.swagger_hub_black_list(addr,ts)values(?,?)'
    if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
            let ele = data[i]
            const addr = ele.addr
            const balance = ele.balance
            console.log(`HUB88_black_addr_@${addr}, amount(${balance})`)
            //
            await raw(sql1, [addr, Date.now()])
        }
    }
}


const hub88ScanSchedule = async function () {
    // 每个小时35分钟的时候
    const schedule = require('node-schedule');
    const a1 = schedule.scheduleJob('35 * * * *', async function () {
        console.log(new Date(), "hub88ScanSchedule")
        await process()
    })
}

module.exports = hub88ScanSchedule
