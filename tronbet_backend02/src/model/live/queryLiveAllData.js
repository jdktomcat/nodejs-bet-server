const {raw} = require("./../utils/dbutils")

const getEM = async function (params) {
    const addr = params.addr || ''
    const startDate = params.startDate || ''
    const endDate = params.endDate || ''
    let sql = `         
        select
            sum(t.Amount) as sum
        from tron_live.live_action_log_v2 as t
        where
        txStatus = 1 and action = 'bet' and
        addr = ? and ts >= ?  and ts < ?
    `
    const rsData = await raw(sql, [addr,startDate,endDate])
    if (rsData.length > 0) {
        return Number(rsData[0].sum) || 0
    }
    return 0
}


const getHub88 = async function (params) {
    const addr = params.addr || ''
    const startDate = params.startDate || ''
    const endDate = params.endDate || ''
    let sql = `         
    select
        sum(amount) / 1000000 as sum
    from
        tron_live.swagger_transaction_log
    where
        status = 1  and 
        email = ? and ts >= ?  and ts < ?
    `
    const rsData = await raw(sql, [addr,startDate,endDate])
    if (rsData.length > 0) {
        return Number(rsData[0].sum) || 0
    }
    return 0
}


const getSport = async function (params) {
    const addr = params.addr || ''
    const startDate = params.startDate || ''
    const endDate = params.endDate || ''
    let sql = `         
        select
            sum(t.amount) / 1000000 as sum
        from
            tron_live.sports_transaction_log as t
        where
        status in (50,51)  and addr = ?  and ts >= ?  and ts < ?
    `
    const rsData = await raw(sql, [addr,startDate,endDate])
    if (rsData.length > 0) {
        return Number(rsData[0].sum) || 0
    }
    return 0
}


const getPlatius = async function (params) {
    const addr = params.addr || ''
    const startDate = params.startDate || ''
    const endDate = params.endDate || ''
    let sql = `         
        select
            sum(t.amount) / 1000000 as sum
        from
            tron_live.platipus_transaction_log as t
        where
        status = 2  and addr = ?  and ts >= ?  and ts < ?
    `
    const rsData = await raw(sql, [addr,startDate,endDate])
    if (rsData.length > 0) {
        return Number(rsData[0].sum) || 0
    }
    return 0
}


class QueryLiveAllData {

    static async getData(request_params) {
        const addr = request_params.addr || ''
        const startDate = request_params.startDate || ''
        const endDate = request_params.endDate || ''
        if(addr === ''){
            return []
        }
        const params = {
            addr : addr,
            startDate : new Date(startDate).getTime(),
            endDate : new Date(endDate).getTime(),
        }
        const em = await getEM(params)
        const hub88 = await getHub88(params)
        const sport = await getSport(params)
        const platius = await getPlatius(params)
        const all_live = em + hub88 + sport + platius
        const data = {
            addr : addr,
            live_sum: all_live,
        }
        return [data]
    }
}


module.exports = QueryLiveAllData