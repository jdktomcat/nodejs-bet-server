const {newUtcTime, raw } = require("./utils/dbutils")

const getTopLossOfHub88 = async function (gameId, startDateTmp, endDateTmp) {
    const startDate = newUtcTime(startDateTmp).getTime()
    const endDate = newUtcTime(endDateTmp).getTime()
    const sql = `
        SELECT
            from_unixtime(ts / 1000,'%Y-%m-%d') as day,
            gameId as game_id,
            count(1) as count,
            count(distinct email) as user_count,
            SUM(amount) / 1000000 as all_amount,
            SUM(win) / 1000000  as all_win,
            SUM(amount) / 1000000  - SUM(win) / 1000000  as balance
        FROM
            tron_live.swagger_transaction_log
        WHERE
            gameId = ?
            And ts >= ?
            AND ts < ?
            AND status = 1
            AND currency = 'TRX'
            group by day
    `
    let params = [
        gameId,
        startDate,
        endDate,
    ]
    const t = await raw(sql, params)
    return t
}


const getTopLossOfEM = async function (gameId, startDate, endDate) {
    const sql = `
    select
        from_unixtime(ts / 1000,'%Y-%m-%d') as day,
        EMGameId as game_id,
        count(1) as count,
        count(distinct addr) as user_count,
        sum(amount) as all_amount
    from tron_live.live_action_log_v2
    where
    EMGameId = ?
    AND ts >= ?
    AND ts < ?
    and action = ? and txstatus = 1
    and currency = 'TRX' group by day  
    `
    const actions = ['bet', 'result']
    const actionsStart = newUtcTime(startDate).getTime()
    const actionsEnd = newUtcTime(endDate).getTime()
    const betParams = [
        gameId, actionsStart, actionsEnd, actions[0]
    ]
    const resultParams = [
        gameId, actionsStart, actionsEnd, actions[1],
    ]
    const rs1 = await raw(sql, betParams)
    const rs2 = await raw(sql, resultParams)
    //
    let dict1 = {}
    rs1.forEach(e => {
        dict1[e.day] = {
            day: e.day,
            game_id: e.game_id,
            count: e.count || 0,
            user_count: e.user_count || 0,
            all_amount: e.all_amount || 0,
        }
    })
    let dict2 = {}
    rs2.forEach(e => {
        dict2[e.day] = {
            day: e.day,
            game_id: e.game_id,
            count: e.count || 0,
            user_count: e.user_count || 0,
            all_win: e.all_amount || 0,
        }
    })
    //
    const productsTmp = Object.keys(dict1).concat(Object.keys(dict2))
    const products = Array.from(new Set(productsTmp))
    let s = []
    for (let e of products) {
        const day = e
        const obj1 = dict1[day] || {}
        const obj2 = dict2[day] || {}
        const count = obj1.count || 0
        const user_count = obj1.user_count || 0
        const all_amount = obj1.all_amount || 0
        const all_win = obj2.all_win || 0
        const balance = Number(all_amount) - Number(all_win)
        const o = {day, count, user_count, all_amount, all_win, balance}
        s.push(o)
    }
    return s
}

class TopGameId{

    static async getTopLossById(type, gameId, start, end){
        const liveDict = {
            "em": getTopLossOfEM,
            "hub88": getTopLossOfHub88,
        }
        const data = await liveDict[type](gameId, start, end)
        return data
    }


    static async getTopLossByIdFile(type, gameId, start, end) {
        const data = await this.getTopLossById(type, gameId, start, end)
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


module.exports = TopGameId