const db = require("../src/utils/dbUtil");

/*
    用户余额-计算的余额 允许的最大偏向值
 */
// const allowMiss = 3000 * 1000000;

/*
    用户余额-计算的余额 允许的最大偏向值 (不超过这个值的通过伪流水补齐余额差)
 */
const allowMissForReset = 5e4 * 1e6;

const dbDo = async function(sql, params) {
    console.log(sql, params);
    const res = await db.query(sql, params);
    console.log("res is : " + JSON.stringify(res) + "\n");
    return res;
}

// const addLiveBalanceOffset = async function(uid, addr, offset) {
//     const sql = `insert into live_balance_audit_offset (uid, addr, offset, create_time)
//                  values (?, ?, ?, ?)`;
//     await dbDo(sql, [uid, addr, offset, new Date().getTime()]);
// }

// const getUidByAddr = async function(addr) {
//     const sql = `select uid from live_account where email = ?`;
//     const res = await dbDo(sql, [addr]);
//     if (res.length > 0) {
//         return res[0].uid;
//     } else {
//         return null;
//     }
// }

// const getBalanceInfo = async function(addr) {
//     let sql = `
//         select sum(info.live_balance) as liveBalance,
//             sum(info.deposit) - sum(info.withdraw) - sum(info.amount) + sum(info.win) as calcBalance, addr from
//             (
//                 select sum(balance) as live_balance, 0 as deposit, 0 as withdraw, 0 as amount, 0 as win, addr
//                     from tron_live.live_balance where addr in (?) and currency = 'trx' group by addr
//                 union all
//                 select 0 as live_balance, sum(amount) as deposit, 0 as withdraw, 0 as amount, 0 as win, addr
//                     from tron_live.live_cb_deposit_log where addr in (?) and currency = 'trx' group by addr
//                 union all
//                 select 0 as live_balance, 0 as deposit, sum(amount) as withdraw, 0 as amount, 0 as win, addr
//                     from tron_live.live_cb_withdraw_log where addr in (?) and currency = 'trx' and status = 1 group by addr
//                 union all
//                 select 0 as live_balance, sum(offset) as deposit, 0 as withdraw, 0 as amount, 0 as win, addr
//                     from tron_live.live_balance_audit_offset where addr in (?) group by addr
//                 union all
//                 select 0 as live_balance, 0 as deposit, 0 as withdraw, sum(total.amount) as amount, sum(total.win) as win, addr from
//                 (
//                     select sum(em.amount) as amount, sum(em.win) as win, addr  from
//                     (
//                         select cast(sum(amount) * 1000000 as unsigned) as amount, 0 as win, addr  from tron_live.live_action_log_v2
//                             where addr in(?) and currency = 'trx' and action = 'bet' and txstatus = 1 group by addr
//                         union all
//                         select 0 as amount, cast(sum(amount) * 1000000 as unsigned) as win, addr from tron_live.live_action_log_v2
//                             where addr in(?) and currency = 'trx' and action = 'result' and txstatus = 1 group by addr
//                     ) as em group by addr
//                     union all
//                     select sum(amount) as amount, sum(win) as win,email as addr
//                         from tron_live.swagger_transaction_log where email in (?) and currency = 'trx' and status = 1 group by email
//                     union all
//                     select sum(amount) as amount, sum(win) as win, addr
//                         from tron_live.sports_transaction_log where addr in (?) and currency = 'trx' and (status = 50 or status = 51) group by addr
//                     union all
//                     select sum(amount) as amount, sum(win) as win, addr
//                         from tron_live.platipus_transaction_log where addr in (?) and currency = 'trx' and status = 2 and resultId is not null group by addr
//                     union all
//                     select sum(amount) as amount, sum(win) as win, addr
//                         from tron_live.binary_transaction_log where addr in (?) and currency = 'trx' and status = 'close' group by addr
//                 )  as total group by addr
//             ) as info group by addr`

//     const res = await dbDo(sql, [addr, addr, addr, addr, addr, addr, addr, addr, addr, addr])
//     if (res.length > 0) {
//         return res[0];
//     } else {
//         return null;
//     }
// }

// const updateLiveBalanceAudit = async function(addr, liveBalance, calcBalance) {
//     const sql = `insert into live_balance_audit (addr, live_balance, calc_balance, flag)
//                  values (?, ?, ?, ?)
//                  on duplicate key update flag = values(flag),
//                                          live_balance = values(live_balance),
//                                          calc_balance = values(calc_balance)`;
//     const flag = (liveBalance - calcBalance > allowMiss ? "malicious" : "normal");
//     await dbDo(sql, [addr, liveBalance, calcBalance, flag]);
// }

// const autoAddLiveBalanceOffset = async function(addr) {
//     let uid = await getUidByAddr(addr);
//     if (!uid) {
//         console.log("autoAddLiveBalanceOffset getUidByAddr failed");
//         return;
//     }

//     let balanceInfo = await getBalanceInfo(addr);
//     if (!balanceInfo) {
//         console.log("autoAddLiveBalanceOffset getBalanceInfo failed");
//         return;
//     }

//     let offset = balanceInfo.liveBalance - balanceInfo.calcBalance;
//     if (offset <= 0) {
//         console.log("autoAddLiveBalanceOffset offset <= 0");
//         return;
//     }

//     console.log("autoAddLiveBalanceOffset: uid: %d, addr: %s, offset: %d",
//         uid, addr, offset);
//     await addLiveBalanceOffset(uid, addr, offset);

//     let newBalanceInfo = await getBalanceInfo(addr);
//     if (!newBalanceInfo) {
//         console.log("autoAddLiveBalanceOffset getBalanceInfo failed");
//         return;
//     }
//     await updateLiveBalanceAudit(addr, newBalanceInfo.liveBalance, newBalanceInfo.calcBalance);
// }

// const queryAccounts = async function() {
//     let params = [allowMissForReset]
//     let sql = `select balance.uid as uid,
//                    audit.addr as addr,
//                    audit.live_balance as liveBalance,
//                    audit.calc_balance as calcBalance
//                from live_balance_audit as audit, live_balance as balance
//                where audit.live_balance > audit.calc_balance and
//                    audit.live_balance <= audit.calc_balance + ? and
//                    audit.addr = balance.addr and
//                    balance.currency = 'trx'`;
//     return await dbDo(sql, params);
// }

// const addLiveBalanceOffsetBatch = async function(list) {
//     const sql = `insert into live_balance_audit_offset (uid, addr, offset, create_time)
//                  values ?`;
//     await dbDo(sql, [list]);
// }

// const autoAddLiveBalanceOffsetBatch = async function() {
//     let accounts = await queryAccounts();
//     if (accounts.length === 0) {
//         console.log("autoAddLiveBalanceOffsetBatch: accounts.length === 0");
//         return;
//     }

//     const timestamp = new Date().getTime();
//     console.log("autoAddLiveBalanceOffsetBatch: accounts.length: %d, timestamp: %d",
//         accounts.length, timestamp);

//     let list = accounts.map(e => [e.uid, e.addr, e.liveBalance - e.calcBalance, timestamp]);
//     await addLiveBalanceOffsetBatch(list);
// }

const getBalance = async function(addr) {
    const sql = `select balance from live_balance where addr = ? and currency = 'trx'`;
    const res = await dbDo(sql, [addr]);
    if (res.length > 0) {
        return res[0].balance;
    } else {
        return null;
    }
}

const setBalance = async function(addr, balance) {
    console.log("setBalance: addr: %s", addr);

    const before = await getBalance(addr);
    if (before === null) {
        console.log("setBalance: before === null");
        return
    }
    console.log("setBalance: before: %d", before);

    const sql = `update live_balance set balance = ? where currency = 'trx' and addr = ?`;
    await dbDo(sql, [balance, addr]);

    const after = await getBalance(addr);
    if (after === null) {
        console.log("setBalance: after === null");
        return
    }
    console.log("setBalance: after: %d", after);
}

const getCalcBalance = async function(addr) {
    const sql = `select calc_balance as calcBalance from live_balance_audit where addr = ?`;
    const res = await dbDo(sql, [addr]);
    if (res.length > 0) {
        return res[0].calcBalance;
    } else {
        return null;
    }
}

const autoSetBalance = async function(addr) {
    const calcBalance = await getCalcBalance(addr);
    if (calcBalance === null) {
        console.log("autoSetBalance: calcBalance === null");
        return
    }

    console.log("autoSetBalance: calcBalance: %d", calcBalance);

    await setBalance(addr, calcBalance);
}

const main = (async function() {
    console.log("updateDeclan start!");
    await autoSetBalance("TA1tiExCTYxT4LpEdKHpzxBENPaQSTxGCL");
    // await autoSetBalance("TJGpJpaQkDq6MULddpguYCE4Nn96GDMdPY");
    // await setBalance("TWrivC9o2MkeoKDcR1pvneaxmvw9uVU5zD", 0);
})().then(() => {
    console.log("updateDeclan end!");
    process.exit(0);
}).catch(e => {
    console.log("updateDeclan error: ", e);
    process.exit(1);
})

module.exports = main
