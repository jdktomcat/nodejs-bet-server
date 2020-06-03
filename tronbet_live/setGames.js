const db = require("./src/utils/dbUtil");

const query_balance = async function (addr) {
    const sql = "select * from tron_live.live_balance where addr = ? and currency = 'TRX'"
    const params = [addr]
    console.log(sql, params)
    const a = await db.exec(sql, params)
    console.log("balance info is ", a)
    //
}

// const update_balance = async function (addr,win) {
//     const update_balance_sql = "update tron_live.live_balance set balance = balance + ? where addr = ? and currency = 'TRX'"
//     const params = [win, addr]
//     console.log(update_balance_sql, params)
//     await db.exec(update_balance_sql, params)
//     //
// }


// const main = async function () {
//     const balanceDict = {
//         '1875292415326294017': 6800,
//         '1875292338142715905': 5640,
//     }
//     const sql = `
//     select * from sports_transaction_log where betslipId in
//     (
//         '1875292415326294017',
//         '1875292338142715905'
//     )
//     `
//     let data = await db.exec(sql, []);
//     if (data.length === 2) {
//         console.log("normal")
//         for (let e of data) {
//             //
//             const betslipId = e.betslipId
//             const addr = e.addr
//             //
//             if (Object.keys(balanceDict).includes(betslipId)) {
//                 //
//                 await query_balance(addr)
//                 //
//                 //update 流水
//                 const win = Number(balanceDict[betslipId]) * 1e6
//                 const sql1 = `update sports_transaction_log set status = 50, win = ? where addr = ? and betslipId = ?`
//                 console.log(sql1, [win, addr, betslipId])
//                 await db.exec(sql1, [win, addr, betslipId])
//                 //
//                 await update_balance(addr,win)
//                 //再查一次
//                 await query_balance(addr)
//                 console.log("\n")
//             }
//         }
//     } else {
//         console.log("error")
//     }
// }

const addBalance = async function (addr, amount) {
    await query_balance(addr);

    const sql = "update tron_live.live_balance set balance = balance + ?  where addr = ? and currency = 'TRX'";
    const params = [amount, addr]
    console.log("before addBalance: addr: %s, amount: %d", addr, amount);
    const a = await db.exec(sql, params)
    console.log("after addBalance: addr: %s, amount: %d", addr, amount);

    await query_balance(addr);
}

/**
 * 创建清空账户记录表
 */
const createClearLogTable = async function () {
    let sql = `
        CREATE TABLE \`live_balance_clear_log\` (
            \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
            \`addr\` varchar(100) NOT NULL COMMENT '账户钱包地址或邮箱地址',
            \`clear_balance\` bigint(20) unsigned NOT NULL COMMENT '清除金额',
            \`live_balance\` bigint(20) NOT NULL COMMENT '清除账户余额时对应的余额',
            \`cal_balance\` bigint(20) NOT NULL COMMENT '计算出流水余额',
            \`create_time\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='清空账户日志表'
    `;
    let res = await db.query(sql, []);
}

addBalance('TTee3vKWqtZaafkuTEtwFd2QHwcyGkNEnj', 100 * 10000 * 1000000).then(() => {
// main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})

