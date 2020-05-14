const db = require("./src/utils/dbUtil");

const raw = async function (updateSql, params) {
    console.log(updateSql, params)
    const t = await db.exec(updateSql, params);
    return t
}

// 钱包地址： TGh4p7mwWXaJEoMFSNxbUSnpNGWvXd8rnt
// 钱包余额：626.8858
// 需更新金额：清空钱包余额
//
// 钱包地址：TCcmtm6NyCtmZ5ASokeNu5Nao8fwDjCzNo
// 钱包余额：30217.02969
// 需更新金额：清空钱包余额
//
// 钱包地址：TG9tvcj5urc44qk5QTdDCP39wZowwpA3Nx
// 钱包余额：0.00238
// 需更新金额：清空钱包余额

const updateFix = async function () {
    const addrs = [
        'TGh4p7mwWXaJEoMFSNxbUSnpNGWvXd8rnt',
        'TCcmtm6NyCtmZ5ASokeNu5Nao8fwDjCzNo',
        'TG9tvcj5urc44qk5QTdDCP39wZowwpA3Nx',
    ]
    for(let e of addrs){
        const querySql = `select uid,currency,addr,balance / 1000000 as balance from tron_live.live_balance where addr = ? and currency = 'TRX'`
        const data = await raw(querySql,[e])
        console.log(data)
        const updateSql = "update tron_live.live_balance set balance = 0 where addr = ? and currency = 'TRX'"
        await raw(updateSql,[e])
        console.log("--------\n\n")
    }
}

const main = async function () {
    await updateFix()

}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
