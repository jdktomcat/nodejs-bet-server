const {raw} = require("./../utils/dbutils")

const getPlayerInfo = async function (params) {
    const addr = params.addr || ''
    const name = params.name || ''
    let sql = `         
        select
            addr,
            name,
            total / 1000000 as total,
            payout / 1000000 as payout,
            (total - payout) / 1000000 as balance
        from tron_bet_wzc.dice_players where
    `
    let sqlParams = []
    if (addr !== "") {
        sql += 'addr like ?'
        sqlParams.push('%' + addr.trim() + "%")
    }else if (name !== "") {
        sql += 'name like ?'
        sqlParams.push('%' + name.trim() + "%")
    }
    const data = await raw(sql,sqlParams)
    return data
}

class QueryPlayer {

    static async getInfo(params) {
        const d = getPlayerInfo(params)
        return d
    }
}


module.exports = QueryPlayer