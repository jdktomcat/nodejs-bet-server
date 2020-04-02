const {raw,newUtcTime} = require("./../utils/dbutils")

const queryAirList = async function (params) {
    let {startDate, endDate, addr,page,pageNum} = params
    const start= newUtcTime(startDate).getTime() / 1000
    const end= newUtcTime(endDate).getTime() / 1000
    const limit = Number(pageNum)
    const offset = (Number(page) - 1) * limit
    let sql = `
            SELECT
            addr,
            betAmount,
            adAmount / 1000000 as adAmount,
            from_unixtime(startTs, '%Y-%m-%d %H:%i:%S') as startTs,
            from_unixtime(endTs, '%Y-%m-%d %H:%i:%S') as endTs,
            txId,
            status
        FROM
            tron_live.live_airdrop_log
        WHERE
            startTs >= ?
            AND startTs < ?
            And addr = ?
            order by startTs desc
    `
    let sqlC = `select count(1) as count from (${sql}) as g`
    const crs = await raw(sqlC, [start,end,addr])
    const count = crs[0].count || 0
    //
    sql +=  ' limit ?,?'
    const p = [start,end,addr,offset,limit]
    let rsData = await raw(sql, p)
    const rs = {
        count: count,
        rows: rsData
    }
    return rs
}


class queryAirData {

    static async getData(p) {
        const data = await queryAirList(p)
        return data
    }

}

module.exports = queryAirData

