const axios = require('axios')
const db = require('./src/utils/dbUtil')


async function getAllUsers(){
    let sql = "select * from live_user"
    return await db.exec(sql, [])
}

async function userRegister(addr, nickName, balance) {
    let sql = "insert into live_account(email, nickName, currency) values (?, ?, ?)"
    let res = await db.exec(sql, [addr, nickName, 'TRX'])

    let uidSql = "select * from live_account where email = ?"
    let user = await db.exec(uidSql, [addr])

    let addBalanceSql = "insert into live_balance(uid, addr, currency, tag, balance) values (?,?,?,?,?) on DUPLICATE KEY UPDATE addr = ?, tag = ?"
    await db.exec(addBalanceSql, [user[0].uid, addr, 'TRX', '', balance, addr, ''])
    return user
}

async function main() {
    let res = await getAllUsers()
    for(let one of res) {
        await userRegister(one.addr, one.nickName, one.trx)
    }
}

main()