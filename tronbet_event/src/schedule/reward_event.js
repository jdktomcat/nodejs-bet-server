const {sequelize, rawQuery, updateQuery} = require("./../utils/mysqlUtils")
const tronUtils = require("./../utils/tronUtil")

const getData = async function () {
    await sequelize.transaction(async (t) => {
        let querySql = 'select * from tron_bet_event.mine_reward_list'
        let queryData = await rawQuery(querySql, [], t)
        //为空才插入
        if (queryData.length === 0) {
            let sql1 = "select addr,sum(boxNum) as amount from tron_bet_event.mine_box where type = 'hero' group by addr order by sum(boxNum) desc"
            let r1 = await rawQuery(sql1, [], t)
            //
            let sum = 0
            r1.forEach(e => {
                const tmp = e.amount || 0
                sum += tmp
            })
            //
            const trx_amount = 30 * 10000
            for (let k of r1) {
                //
                const addr_row = k.addr || 0
                const tmp = k.amount || 0
                const tmp2 = tmp / sum * trx_amount
                // 实际的trx
                const tmp3 = Math.floor(tmp2 * 100) / 100
                // insert into
                //todo insert record
                console.log(addr_row, tmp3)
                //
                let sql1 = "insert into tron_bet_event.mine_reward_list(addr,amount,tx_id) values (?,?,'')"
                await updateQuery(sql1, [addr_row, tmp3], t)
            }
        }
    })
}

const sendTRX = async function () {
    await sequelize.transaction(async (t) => {
        let querySql = 'select * from tron_bet_event.mine_reward_list'
        let queryData = await rawQuery(querySql, [], t)
        console.log("queryData is ",queryData)
        for (let e of queryData) {
            let addr = e.addr
            let amount = e.amount
            console.log("addr, amount is ",addr, amount)
            let tx = await tronUtils.sendTRX(addr, amount)
            console.log("tx is ", tx)
            const id = tx.transaction.txID
            let sql2 = 'update tron_bet_event.mine_reward_list set tx_id = ? where addr = ? and amount = ?'
            //
            await updateQuery(sql2, [id, addr, amount])
        }
    }).catch(e=>{
        console.log("error is ",e.toString())
    })
}


const rewardSchedule = async function () {
    // 每个小时30分的时候重启dice扫描
    const schedule = require('node-schedule');
    //
    const a1 = schedule.scheduleJob('30 * * * *', async function () {
        await getData()
        //
        await sendTRX()
    })
}

rewardSchedule()