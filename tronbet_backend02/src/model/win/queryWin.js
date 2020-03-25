const {newUtcTime, raw} = require("./../utils/dbutils")

const getWinTrx = async function (params) {
    const type = params.type || ''
    if(type !== 'all'){
        return []
    }
    const sql = `
            select
                from_unixtime(b.send_ts,'%Y-%m-%d') as day,
                a.ver,
                a.trx / 1000000 as trx,
                a.total_trx / 1000000 as total_trx,
                a.tx_id
            from tron_bet_wzc.win_dividends_v1 as a
            left join tron_bet_wzc.win_ver_v1 as b
            on a.ver = b.ver
            where a.ver = b.ver 
            and  a.addr = 'TFLYd2Bk7CtsfQFpLnm2fKp2CsSwTDGmx2' 
            order by ver desc
    `
    //
    let rs = await raw(sql,[])
    return rs
}

const getLiveTrx = async function (params) {
    const type = params.type || ''
    if(type !== 'all'){
        return []
    }
    const sql = `
            select
                a.round,
                a.trx / 1000000 as trx,
                a.total_trx / 1000000 as total_trx,
                from_unixtime(b.send_ts,'%Y-%m-%d %H:%i:%s') as day,
                a.tx_id
            from tron_live.live_div_detail as a
            left join tron_live.live_div_info as b
            on a.round = b.round
            where a.round = b.round 
            and  a.addr = 'TFLYd2Bk7CtsfQFpLnm2fKp2CsSwTDGmx2' 
            order by round desc
    `
    //
    let rs = await raw(sql,[])
    return rs
}




const getPokerTrx = async function (params) {
    const type = params.type || ''
    if(type !== 'all'){
        return []
    }
    const sql = `
            select
                from_unixtime(b.send_ts,'%Y-%m-%d %H:%i:%s') as day,
                a.round,
                a.trx / 1000000 as trx,
                a.total_trx / 1000000 as total_trx,
                a.tx_id
            from tronbet_poker_log.rake_div_detail as a
            left join tronbet_poker_log.rake_div_info as b
            on a.round = b.round
            where a.round = b.round 
            and  a.addr = 'TQp7pBWhEYiTUs6B1YBpWrmnjf5QjT1gXH' 
            order by round desc
    `
    //
    let rs = await raw(sql,[])
    return rs
}


class QueryWinData {

    static async getDataFile(data) {
        if(data.length === 0){
            return 'empty file\t\n'
        }
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

    static async getWin(params) {
        const data = await getWinTrx(params)
        const csv = this.getDataFile(data)
        return csv
    }

    static async getLive(params) {
        const data = await getLiveTrx(params)
        const csv = this.getDataFile(data)
        return csv
    }

    static async getPoker(params) {
        const data = await getPokerTrx(params)
        const csv = this.getDataFile(data)
        return csv
    }
}

module.exports = QueryWinData