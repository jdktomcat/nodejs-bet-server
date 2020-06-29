const {raw, newUtcTime} = require("../utils/dbutils")

const DauSql = `
    select
    distinct g.addr as addr
    from (
        SELECT
         distinct addr  as addr
        FROM
        tron_bet_admin.dice_user_order
        WHERE ts >= ? AND ts < ?
        
        union all
        
        SELECT
            distinct addr  as addr
        FROM
            tron_bet_admin.moon_user_order
        WHERE
            ts >= ?
            AND ts < ?
            And crashAt is not null   
       
        union all
       
        SELECT
            distinct addr  as addr
        FROM
            tron_bet_admin.wheel_user_order
        WHERE
            roll is not null
            AND ts >= ?
            AND ts < ? 
        
        union all
        
        SELECT
            distinct addr  as addr
        FROM
            tron_bet_wzc.mine_event_log
        WHERE
            AND ts >= ?
            AND ts < ? 
            
        union all
        
        select
            distinct addr  as addr
        from
            tron_live.live_action_log_v2
        where
            ts >= ?
            AND ts < ?
            and action = 'bet'
            and txstatus = 1 
        
        union all
        
        SELECT
            distinct email  as addr
        FROM
            tron_live.swagger_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            AND status = 1
            
        union all
        
        SELECT
            distinct addr as addr
        FROM
            tron_live.platipus_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            AND status = 1    
            
        union all
        
        SELECT
            distinct addr as addr
        FROM
            tron_live.sports_transaction_log
        WHERE
            ts >= ?
            AND ts < ?    
    ) as g
`

const getAll = async function (startDate, endDate) {
    const sql = DauSql
    const start = newUtcTime(startDate).getTime()
    const end = newUtcTime(endDate).getTime()
    const params = [
        start, end,
        start, end,
        start, end,
        startDate + ' 00:00:00', endDate + ' 23:59:59',
        start, end,
        start, end,
        start, end,
        start, end,
    ]
    return await raw(sql, params)
}


class DailyDAU {

    static async getTotalAddr(endDate) {
        const sql = `select count(distinct addr) as sum from tron_bet_admin.sum_addr_detail where ts > ? and  ts < ? `
        const start = newUtcTime("2019-01-01").getTime()
        const end = newUtcTime(endDate).getTime()
        const params = [start, end,]
        const t = await raw(sql, params)
        if(t[0]){
            return t[0].sum || 0
        }else {
            return 0
        }
    }


    static async getData(startDate, endDate) {
        const data = await getAll(startDate, endDate)
        for (let d of data) {
            const addr = d.addr
            const k = {
                'day': startDate,
                'addr': addr,
                'ts': newUtcTime(startDate).getTime()
            }
            const sql0 = 'select * from tron_bet_admin.sum_addr_detail where addr = ?'
            const data0 = await raw(sql0, [addr])
            if (data0.length === 0) {
                const sql = `insert into tron_bet_admin.sum_addr_detail(day,addr,ts) values (?,?,?)`
                await raw(sql, [k.day, k.addr, k.ts])
            }
        }
        return data.length
    }

}


module.exports = DailyDAU
