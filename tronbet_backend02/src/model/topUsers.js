const {raw} = require("./utils/dbutils")

const getTopUserOfDice = async function (offset, limit) {
    const sql = `
        SELECT
            addr,
            total,
            payout,
            play_times,
            win_times,
            moon_total,
            moon_payout,
            wheel_payout,
            wheel_total,
            name        
        FROM
            tron_bet_wzc.dice_players limit ?,?
    `
    let params = [
        offset, limit
    ]
    const t = await raw(sql, params)
    const o = t.map(e => {
        const k = {
            addr: e.addr,
            total: e.total,
            payout: e.payout,
            balance: e.total - e.payout
        }
        return k
    })
    o.sort((x, y) => x.balance - y.balance)
    return o
}

const getTopUserOfLive = async function (offset, limit) {
    const sql = `select addr, sum(amount) / 1000000 as total, sum(win) / 1000000 as payout,(sum(amount) / 1000000 - sum(win) / 1000000) as balance from tron_live.live_bet_info group by addr order by balance desc limit ?,?`
    let params = [
        offset, limit
    ]
    const t = await raw(sql, params)
    return t
}

class TopUser {

    static async getTopUserList(type, offset, limit) {
        const liveDict = {
            "dice": getTopUserOfDice,
            "live": getTopUserOfLive,
        }
        const data = await liveDict[type](offset, limit)
        return data
    }

    static async getTopUserFile(type, offset, limit) {
        const data = await this.getTopUserList(type, offset, limit)
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


module.exports = TopUser