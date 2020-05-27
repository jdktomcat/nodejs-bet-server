const schedule = require('node-schedule')
const db = require('../utils/dbUtil')

const raw = async function (sql, params) {
    console.log(sql)
    console.log(params)
    const data = await db.exec(sql, params)
    return data
}

const getMaxUid = async function () {
    let sql = "select max(uid) as max_uid from tron_live.live_account where currency='trx'"
    const data = await raw(sql, [])
    if (data.length > 0) {
        console.log("%s getMaxUid success, uid: %d", new Date().toUTCString(), data[0].max_uid)
        return data[0].max_uid
    } else {
        console.log("%s getMaxUid failed", new Date().toUTCString())
        return null
    }
}

const getAddr = async function (uid) {
    let sql = "select distinct email from tron_live.live_account where uid=? and currency='trx'"
    const data = await raw(sql, [uid])
    if (data.length > 0) {
        console.log("%s getAddr success, addr: %s", new Date().toUTCString(), data[0].email)
        return data[0].email
    } else {
        console.log("%s getAddr failed", new Date().toUTCString())
        return null
    }
}

const getLiveBalanceAndFlagInAudit = async function (addr) {
    let sql = "select live_balance, flag from tron_live.live_balance_audit where addr=?"
    const data = await raw(sql, [addr])
    if (data.length > 0) {
        console.log("%s getLiveBalanceAndFlagInAudit success, live_balance: %d, flag: %s",
                new Date().toUTCString(), data[0].live_balance, data[0].flag)
        return data[0]
    } else {
        console.log("%s getLiveBalanceAndFlagInAudit failed", new Date().toUTCString())
        return null
    }
}

const getLiveBalance = async function (addr) {
    let sql = "select sum(balance) as live_balance from tron_live.live_balance where addr=? and currency = 'trx' group by addr"
    const data = await raw(sql, [addr])
    if (data.length > 0) {
        console.log("%s getAddr success, live_balance: %d", new Date().toUTCString(), data[0].live_balance)
        return data[0].live_balance
    } else {
        console.log("%s getAddr failed", new Date().toUTCString())
        return null
    }
}

const getLiveBalanceAndCalcBalance = async function (addr) {
    let sql = `
        select sum(info.live_balance) as live_balance,
            sum(info.deposit) - sum(info.withdraw) - sum(info.amount) + sum(info.win) as calc_balance from
            (
                select sum(balance) as live_balance, 0 as deposit, 0 as withdraw, 0 as amount, 0 as win
                    from tron_live.live_balance where addr=? and currency = 'trx' group by addr
                union all
                select 0 as live_balance, sum(amount) as deposit, 0 as withdraw, 0 as amount, 0 as win
                    from tron_live.live_cb_deposit_log where addr=? and currency = 'trx' group by addr
                union all
                select 0 as live_balance, 0 as deposit, sum(amount) as withdraw, 0 as amount, 0 as win
                    from tron_live.live_cb_withdraw_log where addr=? and currency = 'trx' and status = 1 group by addr
                union all
                select 0 as live_balance, 0 as deposit, 0 as withdraw, sum(total.amount) as amount, sum(total.win) as win from
                (
                    select sum(em.amount) as amount, sum(em.win) as win from
                    (
                        select cast(sum(amount) * 1000000 as unsigned) as amount, 0 as win from tron_live.live_action_log_v2
                            where addr=? and currency = 'trx' and action = 'bet' and txstatus = 1 group by addr
                        union all 
                        select 0 as amount, cast(sum(amount) * 1000000 as unsigned) as win from tron_live.live_action_log_v2
                            where addr=? and currency = 'trx' and action = 'result' and txstatus = 1 group by addr
                    ) as em
                    union all
                    select sum(amount) as amount, sum(win) as win
                        from tron_live.swagger_transaction_log where email=? and currency = 'trx' and status = 1 group by email
                    union all
                    select sum(amount) as amount, sum(win) as win
                        from tron_live.sports_transaction_log where addr=? and currency = 'trx' and (status = 50 or status = 51) group by addr
                    union all
                    select sum(amount) as amount, sum(win) as win
                        from tron_live.platipus_transaction_log where addr=? and currency = 'trx' and status = 2 and resultId is not null group by addr
                    union all
                    select sum(amount) as amount, sum(win) as win
                        from tron_live.binary_transaction_log where addr=? and currency = 'trx' and status = 'close' group by addr 
                ) as total
            ) as info`

    const data = await raw(sql, [addr, addr, addr, addr, addr, addr, addr, addr, addr])
    if (data.length > 0) {
        console.log("%s getLiveBalanceAndCalcBalance success, live_balance: %d, calc_balance: %d",
                new Date().toUTCString(), data[0].live_balance, data[0].calc_balance)
        return data[0]
    } else {
        console.log("%s getLiveBalanceAndCalcBalance failed", new Date().toUTCString())
        return null
    }
}

const updateLiveBalance = async function (addr, live_balance, calc_balance) {
    let flag = (live_balance - calc_balance > 1000000000) ? 'malicious' : 'normal'
    let sql = `
        insert into tron_live.live_balance_audit (addr, live_balance, calc_balance, flag) values(?, ?, ?, ?)
            on DUPLICATE KEY update live_balance=values(live_balance), calc_balance=values(calc_balance), flag=values(flag)`

    const data = await raw(sql, [addr, live_balance, calc_balance, flag])
    console.log("%s updateLiveBalance success", new Date().toUTCString())
}

const updateAudit = async function (uid) {
    let addr = await getAddr(uid)
    if (!addr) {
        return 
    }

    let balance_and_flag = await getLiveBalanceAndFlagInAudit(addr)
    if (balance_and_flag && balance_and_flag.flag === 'malicious') {
        return
    }

    let live_balance = await getLiveBalance(addr)
    if (!live_balance) {
        return
    }

    if (balance_and_flag && balance_and_flag.live_balance === live_balance) {
        return
    }

    let live_balance_and_calc_balance = await getLiveBalanceAndCalcBalance(addr)
    if (!live_balance_and_calc_balance) {
        return
    }

    await updateLiveBalance(addr, live_balance_and_calc_balance.live_balance, live_balance_and_calc_balance.calc_balance)
}

const run = async function () {
    const minUid = 50000
    let maxUid = await getMaxUid()

    for (let uid = minUid; uid <= maxUid; uid++) {
        await updateAudit(uid)
    }
}

const auditSchedule = function () {
    const a1 = schedule.scheduleJob('*/5 * * * *', async function () {
        await run()
    })
}

module.exports = auditSchedule

