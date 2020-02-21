const {raw} = require("./../utils/dbutils")

const getOldEM = async function (params) {
    const addr = params.addr || ''
    let sql = `         
        select
            sum(t.AddsAmount) as sum
        from tron_live.live_action_log as t
        where
        txStatus = 1 and action = 'bet' and
        addr = ?;
    `
    const rsData = await raw(sql, [addr])
    if (rsData.length > 0) {
        return rsData[0].sum || 0
    }
    return 0
}

const getEM = async function (params) {
    const addr = params.addr || ''
    let sql = `         
        select
            sum(t.AddsAmount) as sum
        from tron_live.live_action_log_v2 as t
        where
        txStatus = 1 and action = 'bet' and
        addr = ?;
    `
    const rsData = await raw(sql, [addr])
    if (rsData.length > 0) {
        return rsData[0].sum || 0
    }
    return 0
}


const getHub88 = async function (params) {
    const addr = params.addr || ''
    let sql = `         
    select
        sum(t.adAmount) / 1000000 as sum
    from
        tron_live.swagger_transaction_log
    where
        status = 1  and 
        email = ?
    `
    const rsData = await raw(sql, [addr])
    if (rsData.length > 0) {
        return rsData[0].sum || 0
    }
    return 0
}


const getSport = async function (params) {
    const addr = params.addr || ''
    let sql = `         
        select
            sum(t.adAmount) / 1000000 as sum
        from
            tron_live.sports_transaction_log as t
        where
        status in(0, 50,51)  and addr = ?
    `
    const rsData = await raw(sql, [addr])
    if (rsData.length > 0) {
        return rsData[0].sum || 0
    }
    return 0
}


const getAir = async function (params) {
    const addr = params.addr || ''
    let sql = `         
        select
            sum(t.betAmount) as air_amount,
            sum(t.adAmount) / 1000000 as air_live
        from
            tron_live.live_airdrop_log as t
        where
            addr = ?
    `
    const rsData = await raw(sql, [addr])
    const ele = rsData[0]
    Object.keys(ele).forEach(k => ele[k] = ele[k] || 0)
    return ele
}


class QueryDrop {

    static async getData(params) {
        const oldEM = await getOldEM(params)
        const em = await getEM(params)
        const hub88 = await getHub88(params)
        const sport = await getSport(params)
        const air = await getAir(params)
        const {air_amount, air_live} = air
        const all_live = oldEM + em + hub88 + sport
        const data = {
            oldEM: oldEM,
            em: em,
            hub88: hub88,
            sport: sport,
            all_live : all_live,
            air_amount: air_amount,
            air_live: air_live,
        }
        return data
    }
}

module.exports = QueryDrop