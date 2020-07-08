const fs = require("fs")
const db = require('../utils/dbUtil')

function newUtcTime(today) {
    let start = new Date(today);
    start.setUTCHours(0)
    start.setUTCMinutes(0)
    start.setUTCSeconds(0)
    start.setUTCMilliseconds(0)
    return start
}


const raw = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}

const generateCsv = function (data) {
    if (data.length === 0) {
        return ''
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

const generate_dict = function (p1_data, filename) {
    const p1_data_str = generateCsv(p1_data)
    //
    fs.writeFileSync("./" + filename, p1_data_str)
    //
    let attachmentObj = {}
    attachmentObj.filename = filename
    attachmentObj.path = "./" + filename
    return attachmentObj
}

const getDiceTRX = async function (startDate, endDate) {
    //Date	Total Dividend (TRX)	Wink Pool Dividend (TRX)	Dice Holder Dividend (TRX)
    const sql = `
        select 
        tmp.d as day, 
        sum(tmp.t) as Total_Dividend_TRX, 
        sum(tmp.t) * 0.49 as Wink_Pool_Dividend_TRX, 
        sum(tmp.t) * 0.51 as Dice_Holder_Dividend_TRX
        from
        (
            select from_unixtime(send_ts, '%Y-%m-%d') as d, total_trx / 1000000 as t
            from tron_bet_wzc.dice_ver_v1
            where send_ts >= ? and send_ts < ?
        ) tmp
        group by tmp.d
        order by tmp.d asc
    `
    const params = [
        newUtcTime(startDate).getTime() / 1e3,
        newUtcTime(endDate).getTime() / 1e3
    ]
    const data = await raw(sql, params)
    return data
}


const getLiveTRX = async function (startDate, endDate) {
    //Date	Total Dividend (TRX)	Leaderboard Dividend (TRX)	Tron Dividend (TRX)
    const sql = `
        select 
        from_unixtime(tmp1.st, '%Y-%m-%d') as day, 
        sum(tmp1.t) as Total_Dividend_TRX, 
        sum(tmp1.r) as Leaderboard_Dividend_TRX,
        sum(tmp2.t) as Tron_Dividend_TRX
        from
        (
            select round, min(send_ts) as st, sum(total_trx + rank_trx) / 1000000 as t, sum(rank_trx) / 1000000 as r
            from tron_live.live_div_info
            where send_ts >= ? and send_ts < ?
            group by round
        ) tmp1
        left join
        (
            select round, sum(trx) / 1000000 as t
            from tron_live.live_div_detail
            where addr = "TFLYd2Bk7CtsfQFpLnm2fKp2CsSwTDGmx2"
            group by round
        ) tmp2
        on tmp1.round = tmp2.round
        group by from_unixtime(tmp1.st, '%Y-%m-%d')
        order by from_unixtime(tmp1.st, '%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime() / 1e3,
        newUtcTime(endDate).getTime() / 1e3
    ]
    const data = await raw(sql, params)
    return data
}


const getRakeTRX = async function (startDate, endDate) {
    //Date	Total Dividend (TRX)	Jackpot Dividend (TRX)	Tron Dividend (TRX)
    const sql = `
        select 
        from_unixtime(tmp1.st, '%Y-%m-%d') as day, 
        sum(tmp1.t) as Total_Dividend_TRX, 
        sum(tmp1.t) * 0.03 as Jackpot_Dividend_TRX, 
        sum(tmp2.t) * 0.126 as Tron_Dividend_TRX
        from
        (
            select round, min(send_ts) as st, sum(total_trx) / 1000000 as t
            from tronbet_poker_log.rake_div_info
            where send_ts >= ? and send_ts < ?
            group by round
        ) tmp1
        left join
        (
            select round, sum(trx) / 1000000 as t
            from tronbet_poker_log.rake_div_detail
            where addr = "TQp7pBWhEYiTUs6B1YBpWrmnjf5QjT1gXH"
            group by round
        ) tmp2
        on tmp1.round = tmp2.round
        group by from_unixtime(tmp1.st, '%Y-%m-%d')
        order by from_unixtime(tmp1.st, '%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime() / 1e3,
        newUtcTime(endDate).getTime() / 1e3
    ]
    const data = await raw(sql, params)
    return data
}


const getWinkTRX = async function (startDate, endDate) {
    //Date	Total Dividend (TRX)	Tron Dividend (TRX)
    const sql = `
        select 
        from_unixtime(tmp1.st, '%Y-%m-%d') as day, 
        sum(tmp1.t) as Total_Dividend_TRX, 
        sum(tmp2.t) as Tron_Dividend_TRX
        from
        (
            select ver, min(send_ts) as st, sum(total_trx) / 1000000 as t
            from tron_bet_wzc.win_ver_v1
            where send_ts >= ? and send_ts < ?
            group by ver
        ) tmp1
        left join
        (
            select ver, sum(trx) / 1000000 as t
            from tron_bet_wzc.win_dividends_v1
            where addr = "TFLYd2Bk7CtsfQFpLnm2fKp2CsSwTDGmx2"
            group by ver
        ) tmp2
        on tmp1.ver = tmp2.ver
        group by from_unixtime(tmp1.st, '%Y-%m-%d')
        order by from_unixtime(tmp1.st, '%Y-%m-%d')
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const data = await raw(sql, params)
    return data
}


const getSupplierData = async function (startDate, endDate) {
    const id_company = {
        131: "ISoftBet",
        132: "Ezugi",
        133: "BetGames",
        134: "Vivo",
        209: "Booongo",
        216: "Fugaso",
        223: "Platipus",
        227: "OneTouch",
        229: "ReelNRG"
    }
    const bSql = `
        select GPId, sum(Amount) amount
        from tron_live.live_action_log_v2
        where ts >= ? and ts < ?
        and txStatus = 1 and action = 'bet'
        group by GPId
    `
    const rSql = `
        select GPId, sum(Amount) payout
        from tron_live.live_action_log_v2
        where ts >= ? and ts < ?
        and txStatus = 1 and action = 'result'
        group by GPId
    `
    const params = [
        newUtcTime(startDate).getTime(),
        newUtcTime(endDate).getTime()
    ]
    const bData = await raw(bSql, params)
    const rData = await raw(rSql, params)
    //
    let bDict = {}
    // GPId | amount
    bData.forEach(e=> bDict[e.GPId] = e.amount || 0 )
    //
    let rDict = {}
    rData.forEach(e=>rDict[e.GPId] = e.payout || 0)
    //
    const cpListTmp = Object.keys(bDict).concat(Object.keys(rDict))
    const cpList = Array.from(new Set(cpListTmp))
    let last = []
    //ID	COMPANY	BET(交易总额，用户下注总数)	PAYOUT(支出给用户的)	PROFIT
    for (let i = 0; i < cpList.length; i++) {
        let e = cpList[i]
        let o = {}
        o.ID = e
        o.COMPANY = id_company[e] || 'NAMETOADD'
        o.BET = bDict[e] || 0
        o.PAYOUT = rDict[e] || 0
        o.PROFIT = Number(o.BET) - Number(o.PAYOUT)
        last.push(o)
    }
    return last
}

const task = async function (startDate, endDate) {
    let a = []
    //
    const dice = await getDiceTRX(startDate, endDate)
    const diceInfo = generate_dict(dice, 'Dice_TRX_Divide.xls')
    a.push(diceInfo)
    //
    const live = await getLiveTRX(startDate, endDate)
    const liveInfo = generate_dict(live, 'Live_TRX_Divide.xls')
    a.push(liveInfo)
    //
    const rake = await getRakeTRX(startDate, endDate)
    const rakeInfo = generate_dict(rake, 'Rake_TRX_Divide.xls')
    a.push(rakeInfo)
    //
    const wink = await getWinkTRX(startDate, endDate)
    const winkInfo = generate_dict(wink, 'Wink_TRX_Divide.xls')
    a.push(winkInfo)
    //
    const supplier = await getSupplierData(startDate, endDate)
    const supplierInfo = generate_dict(supplier, 'Supplier_Data.xls')
    a.push(supplierInfo)
    //
    return a
}


module.exports = task