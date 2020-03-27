const {newUtcTime, raw } = require("./utils/dbutils")
const {gethubProName, getSportDict} = require("./utils/getProductDict")

const getTopLossOfHub88 = async function (startDateTmp, endDateTmp) {
    const startDate = newUtcTime(startDateTmp).getTime()
    const endDate = newUtcTime(endDateTmp).getTime()
    const sql = `
        SELECT
            gameId as game_id,
            count(1) as count,
            SUM(amount) / 1000000 as all_amount,
            SUM(win) / 1000000  as all_win,
            SUM(amount) / 1000000  - SUM(win) / 1000000  as balance
        FROM
            tron_live.swagger_transaction_log
        WHERE
            ts >= ?
            AND ts < ?
            AND status = 1
            AND currency = ?
            group by gameId
    `
    let params = [
        startDate,
        endDate,
        'TRX'
    ]
    // const currencyArray = ['TRX', 'BTC', 'ETH', 'LTC', 'BNB']
    const t = await raw(sql, params)
    t.forEach(e => {
        e.gameName = gethubProName(e.game_id)
    })
    return t
}

const getTopLossOfSport = async function (startDateTmp, endDateTmp) {
    const startDate = newUtcTime(startDateTmp).getTime()
    const endDate = newUtcTime(endDateTmp).getTime()
    const sql = `
        SELECT
            count(1) as count,
            SUM(a.amount) / 1000000  as all_amount,
            SUM(a.win) / 1000000  as all_win,
            SUM(a.amount) / 1000000  - SUM(a.win) / 1000000  as balance
        FROM
            tron_live.sports_transaction_log a
            left join (
                select distinct transactionId as transactionId
                from sports_bet_detail_log
                where sportId = ?
            )  b  on a.transactionId = b.transactionId
        WHERE
            a.transactionId = b.transactionId
            and a.ts >= ?
            AND a.ts < ?
            AND (a.status = 50 or a.status = 51)
            AND a.currency = ?
    `
    const dict = getSportDict()
    const ids = Object.keys(dict)
    // const currencyArray = ['TRX', 'USDT']
    const currencyArray = ['TRX']
    let a = []
    let rawData = []
    for (let e of ids) {
        let p = [e, startDate, endDate, currencyArray[0]]
        const t = await raw(sql, p) || []
        let obj = t[0] || {}
        let tmpObj = {}
        tmpObj[e] = obj
        rawData.push(JSON.stringify(tmpObj))
        let o = {
            game_id: e,
            count: obj.count || 0,
            all_amount: obj.all_amount || 0,
            all_win: obj.all_win || 0,
            balance: obj.balance || 0,
        }
        a.push(o)
    }
    console.log("----->\n", rawData)
    return a
}


const getTopLossOfEM = async function (startDate, endDate) {
    const sql = `
        select
            g.game_id,
            g.count,
            sum(g.all_amount) as all_amount,
            sum(g.all_win) as all_win,
            sum(g.all_amount) - sum(g.all_win) as balance
        from (
            select
                EMGameId as game_id,
                count(1) as count,
                sum(amount) as all_amount,
                0 as all_win
            from tron_live.live_action_log_v2
            where ts >= ?
                AND ts < ?
                and action = 'bet'
                and txstatus = 1
                and currency = 'TRX'
                group by EMGameId
            union all
            select
                EMGameId as game_id,
                0 as count,
                0 as all_amount,
                sum(amount) as all_win
            from tron_live.live_action_log_v2
            where ts >= ?
                AND ts < ?
                and action = 'result'
                and txstatus = 1
                and currency = 'TRX'
                group by EMGameId
        ) as g
        group by g.game_id
    `
    const start = newUtcTime(startDate).getTime()
    const end = newUtcTime(endDate).getTime()
    const o = await raw(sql, [
        start, end, start, end,
    ])
    return o
}


const getTopLossOfOldEM = async function (startDate, endDate) {
    const sql = `
        select
            g.game_id,
            g.count,
            sum(g.all_amount) as all_amount,
            sum(g.all_win) as all_win,
            sum(g.all_amount) - sum(g.all_win) as balance
        from (
            select
                EMGameId as game_id,
                count(1) as count,
                sum(amount) as all_amount,
                0 as all_win
            from tron_live.live_action_log
            where ts >= ?
                AND ts < ?
                and action = 'bet'
                and txstatus = 1
                group by EMGameId
            union all
            select
                EMGameId as game_id,
                0 as count,
                0 as all_amount,
                sum(amount) as all_win
            from tron_live.live_action_log
            where ts >= ?
                AND ts < ?
                and action = 'result'
                and txstatus = 1
                group by EMGameId
        ) as g
        group by g.game_id
    `
    const start = newUtcTime(startDate).getTime()
    const end = newUtcTime(endDate).getTime()
    const o = await raw(sql, [
        start, end, start, end,
    ])
    return o
}


const getEMdict = function (data) {
    let dict = {}
    for (let e of data) {
        dict[e.game_id] = e
    }
    return dict
}

const getTopLossOfAllEM = async function (startDate, endDate) {
    const s = new Date('2019-11-04').getTime()
    //
    const ndata = await getTopLossOfEM(startDate, endDate)
    if (new Date(startDate).getTime() <= s) {
        const odata = await getTopLossOfOldEM(startDate, endDate)
        //
        const ndict = getEMdict(ndata)
        const odict = getEMdict(odata)
        //
        const keysTmp = Object.keys(ndict).concat(Object.keys(odict))
        const keys = Array.from(new Set(keysTmp))
        //
        let a = []
        for (let k of keys) {
            const d1 = odict[k] || {}
            const d2 = ndict[k] || {}
            let o = {game_id: k}
                ['count', 'all_amount', 'all_win', 'balance'].forEach(e => {
                d1[e] = d1[e] || 0
                d2[e] = d2[e] || 0
                o[e] = d1[e] + d2[e]
            })
            a.push(o)
        }
        return a
    } else {
        return ndata
    }
}

class TopLoss {

    static async getTopLoss(type, start, end) {
        const liveDict = {
            "em": getTopLossOfAllEM,
            "hub88": getTopLossOfHub88,
            "sport": getTopLossOfSport,
        }
        const data = await liveDict[type](start, end)
        data.sort((a1, a2) => a1.balance - a2.balance)
        return data
    }

    static async  getTopLossFile(type, startDate, endDate) {
        const data = await this.getTopLoss(type, startDate, endDate)
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


module.exports = TopLoss