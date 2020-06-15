const Common = require("./common");
const DbDo = Common.DbDo;
const Log = Common.Log;

async function getBalance(addr) {
    const sql = `select balance from live_balance where addr = ? and currency = 'trx'`;
    const res = await DbDo(sql, [addr]);
    if (res.length > 0) {
        return res[0].balance;
    } else {
        return null;
    }
}

const getUidByAddr = async function(addr) {
    const sql = `select uid from live_account where email = ?`;
    const res = await DbDo(sql, [addr]);
    if (res.length > 0) {
        return res[0].uid;
    } else {
        return null;
    }
}

const AddLiveBalanceOffset = async function(addr, offset) {
    const uid = await getUidByAddr(addr);
    if (uid === null) {
        Log("AddLiveBalanceOffset: uid === null");
        return
    }

    const sql = `insert into live_balance_audit_offset (uid, addr, offset, create_time)
                 values (?, ?, ?, ?)`;
    await DbDo(sql, [uid, addr, offset, new Date().getTime()]);
    Log("AddLiveBalanceOffset: uid: %d, addr: %s, offset: %d", uid, addr, offset);
}

async function updateBalance(sql, addr, balance) {
    Log("updateBalance: sql: %s, addr: %s, balance: %d", sql, addr, balance);

    const before = await getBalance(addr);
    if (before === null) {
        Log("updateBalance: before === null");
        return
    }
    Log("updateBalance: before: %d", before);

    await DbDo(sql, [balance, addr]);

    const after = await getBalance(addr);
    if (after === null) {
        Log("updateBalance: after === null");
        return
    }
    Log("updateBalance: after: %d", after);
}

async function AddBalance(addr, balance) {
    Log("AddBalance: addr: %s, balance: %d", addr, balance);
    const sql = `update live_balance set balance = balance + ? where addr = ? and currency = 'trx'`;
    await updateBalance(sql, addr, balance);
}

async function SetBalance(addr, balance) {
    Log("SetBalance: addr: %s, balance: %d", addr, balance);
    const sql = `update live_balance set balance = ? where addr = ? and currency = 'trx'`;
    await updateBalance(sql, addr, balance);
}

async function AddBalanceAndBalanceOffset(addr, balance) {
    Log("AddBalanceAndBalanceOffset: addr: %s, balance: %d", addr, balance);
    await AddBalance(addr, balance);
    await AddLiveBalanceOffset(addr, balance);
}

module.exports = {
    AddBalance,
    SetBalance,
    AddBalanceAndBalanceOffset,
}
