const {newUtcTime, raw} = require("./../utils/dbutils")


const getDataOfEM = async function (params) {
    const roundId = params.roundId || ''
    const addr = params.addr || ''
    const startDate = params.startDate || ''
    const endDate = params.endDate || ''
    const page = params.page || ''
    const pageNum = params.pageNum || ''
    let piece = ''
    let sqlParams = []
    if(roundId !== ''){
        piece = 'RoundId = ?'
        sqlParams.push(roundId)
    }else{
        piece = ' addr = ? and ts >= ? and ts <= ?'
        const start = newUtcTime(startDate).getTime()
        const end = newUtcTime(endDate).getTime()
        sqlParams = [addr,start,end]
    }
    const sql = `
            select
                from_unixtime(ts / 1000,'%Y-%m-%d %H:%i:%s') as day,
                addr,
                GPGameId,
                EMGameId,
                TransactionId,
                GPId,
                RoundId,
                amount,
                currency,
                txId,
                RoundStatus,
                action,
                txStatus,
                AddsAmount
            from tron_live.live_action_log_v2
            where ${piece}
    `
    //
    let rs = {}
    if(roundId !== ''){
        const o = await raw(sql, sqlParams)
        rs = {
            count : 1,
            rows : o
        }
    }else {
        let sqlC = `select count(1) as count from (${sql}) as g`
        const crs = await raw(sqlC,[])
        const count = crs[0].count || 0
        //
        const sql2 = sql + ' limit ?,?'
        const limit = Number(pageNum)
        const offset = (Number(page) - 1) * limit
        sqlParams.push(offset)
        sqlParams.push(limit)
        const rsData = await raw(sql2,sqlParams)
        rs = {
            count : count,
            rows : rsData
        }
    }
    return rs
}


class QueryEM {

    static async getData(params) {
        const data = await getDataOfEM(params)
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

module.exports = QueryEM