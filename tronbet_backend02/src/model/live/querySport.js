const {newUtcTime, raw} = require("./../utils/dbutils")

const formatData = (data)=>{
    const dict = {
        '0' : 'bet', //下注
        '10' : 'refund', // 退款
        '20' : 'cancel', // cancel, 之后不能在有其他操作
        '30' : 'settle', // 完成   之后可以回滚
        '40' : 'rollback', // 回滚  之后可以输赢
        '50' : 'win',    // win    之后回滚操作
        '51' : 'lost'
    }
    data.forEach(e=>{
        e.status = dict[e.status]
    })
}

const getData = async function (params) {
    const roundId = params.betslipId || ''
    const addr = params.addr || ''
    const startDate = params.startDate || ''
    const endDate = params.endDate || ''
    const page = params.page || ''
    const pageNum = params.pageNum || ''
    let piece = ''
    let sqlParams = []
    if(roundId !== ''){
        piece = 'betslipId = ?'
        sqlParams.push(roundId)
    }else{
        piece = ' addr = ? and ts >= ? and ts <= ?'
        const start = newUtcTime(startDate).getTime()
        const end = newUtcTime(endDate).getTime()
        sqlParams = [addr,start,end]
    }
    const sql = `         
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d %H:%i:%s') as day,
            logId,
            addr,
            transactionId,
            betslipId,
            status,
            amount,
            win,
            crossRateEuro,
            action,
            currency,
            adAmount 
        FROM
            tron_live.sports_transaction_log
        where ${piece}
    `
    //
    let rs = {}
    if(roundId !== ''){
        const o = await raw(sql, sqlParams)
        formatData(o)
        rs = {
            count : 1,
            rows : o
        }
    }else {
        let sqlC = `select count(1) as count from (${sql}) as g`
        const crs = await raw(sqlC,sqlParams)
        const count = crs[0].count || 0
        //
        const sql2 = sql + ' limit ?,?'
        const limit = Number(pageNum)
        const offset = (Number(page) - 1) * limit
        sqlParams.push(offset)
        sqlParams.push(limit)
        const rsData = await raw(sql2,sqlParams)
        formatData(rsData)
        rs = {
            count : count,
            rows : rsData
        }
    }
    return rs
}


class QuerySport {

    static async getData(params) {
        const data = await getData(params)
        return data
    }

    static async getDataFile(params) {
        const data = await this.getData(params).rows
        const keys = Object.keys(data[0])
        let sbody = ''
        keys.forEach(e => {
            sbody += e + "\t"
        })
        sbody = sbody.trim()
        sbody += "\n"
        //
        data.forEach(e => {
            keys.forEach((k) => {
                let t = e[k] || 0
                sbody = sbody + t + '\t'
            })
            sbody = sbody.trim()
            sbody += '\n'
        })
        return sbody
    }
}

module.exports = QuerySport