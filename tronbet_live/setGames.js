const db = require("./src/utils/dbUtil");

// const query_balance = async function (addr) {
//     const sql = "select * from tron_live.live_balance where addr = ? and currency = 'TRX'"
//     const params = [addr]
//     console.log(sql, params)
//     const a = await db.exec(sql, params)
//     console.log("balance info is ", a)
//     //
// }

const remove_from_black_list = async function () {
    const update_balance_sql = "delete from tron_live.live_black_list where addr = 'TTee3vKWqtZaafkuTEtwFd2QHwcyGkNEnj' and id = 2057"
    const params = []
    console.log(update_balance_sql, params)
    await db.exec(update_balance_sql, params)
}

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

// const addBalance = async function (addr, amount) {
//     await query_balance(addr);

//     const sql = "update tron_live.live_balance set balance = balance + ?  where addr = ? and currency = 'TRX'";
//     const params = [amount, addr]
//     console.log("before addBalance: addr: %s, amount: %d", addr, amount);
//     const a = await db.exec(sql, params)
//     console.log("after addBalance: addr: %s, amount: %d", addr, amount);

//     await query_balance(addr);
// }

const createTable = async function () {
    const sql = `
        CREATE TABLE IF NOT EXISTS live_balance_audit_all (
          id bigint(20) NOT NULL AUTO_INCREMENT,
          addr varchar(64) NOT NULL,
          live_balance bigint(20) NOT NULL,
          calc_balance bigint(20) NOT NULL,
          diff bigint(20) NOT NULL,
          PRIMARY KEY (id),
          UNIQUE KEY live_balance_audit_addr_all_index (addr)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8`;
    const a = await db.exec(sql, [])
    console.log("after createTable");
}

let batchSize=300;
let startUid=43073;

const queryLiveBalanceAndCalcBalance = async function (addresses) {
    let sql = `
        select addr, sum(info.live_balance) as liveBalance,
            sum(info.deposit) - sum(info.withdraw) - sum(info.amount) + sum(info.win) as calcBalance,
            live_balance - (sum(info.deposit) - sum(info.withdraw) - sum(info.amount) + sum(info.win)) as diff
            from
            (
                select sum(balance) as live_balance, 0 as deposit, 0 as withdraw, 0 as amount, 0 as win,addr
                    from tron_live.live_balance where addr in (?) and currency = 'trx' group by addr
                union all
                select 0 as live_balance, sum(amount) as deposit, 0 as withdraw, 0 as amount, 0 as win,addr
                    from tron_live.live_cb_deposit_log where addr in (?) and currency = 'trx' group by addr
                union all
                select 0 as live_balance, 0 as deposit, sum(amount) as withdraw, 0 as amount, 0 as win,addr
                    from tron_live.live_cb_withdraw_log where addr in (?) and currency = 'trx' and status = 1 group by addr
                union all
                select 0 as live_balance, 0 as deposit, 0 as withdraw, sum(total.amount) as amount, sum(total.win) as win,addr from
                (
                    select sum(em.amount) as amount, sum(em.win) as win,addr  from
                    (
                        select cast(sum(amount) * 1000000 as unsigned) as amount, 0 as win,addr  from tron_live.live_action_log_v2
                            where addr in(?) and currency = 'trx' and action = 'bet' and txstatus = 1 group by addr
                        union all
                        select 0 as amount, cast(sum(amount) * 1000000 as unsigned) as win,addr from tron_live.live_action_log_v2
                            where addr in(?) and currency = 'trx' and action = 'result' and txstatus = 1 group by addr
                    ) as em group by addr
                    union all
                    select sum(amount) as amount, sum(win) as win,email as addr
                        from tron_live.swagger_transaction_log where email in (?) and currency = 'trx' and status = 1 group by email
                    union all
                    select sum(amount) as amount, sum(win) as win,addr
                        from tron_live.sports_transaction_log where addr in (?) and currency = 'trx' and (status = 50 or status = 51) group by addr
                    union all
                    select sum(amount) as amount, sum(win) as win,addr
                        from tron_live.platipus_transaction_log where addr in (?) and currency = 'trx' and status = 2 and resultId is not null group by addr
                    union all
                    select sum(amount) as amount, sum(win) as win,addr
                        from tron_live.binary_transaction_log where addr in (?) and currency = 'trx' and status = 'close' group by addr
                )  as total group by addr
            ) as info group by addr`

    const data = await db.query(sql, [addresses, addresses, addresses, addresses, addresses, addresses, addresses, addresses, addresses])
    return data
}

const queryAccounts =async function(){
    let params =['TRX', startUid]
    let sql="select * from live_balance where currency=? and uid>?"
    let result=await db.query(sql,params);
    return result;
}

const doBatchUpdate = async function(list){
    for(let i=0;i<Math.floor(list.length/batchSize+1);i++){
        let start=i*batchSize;
        let end=(i+1)*batchSize;
        if(end>list.length){
            end=list.length;
        }
        let bl=list.slice(start,end);
        let addresses=[];
        bl.forEach((record)=>{
            addresses.push(record.addr);
        });
        let rl=await queryLiveBalanceAndCalcBalance(addresses);
        if (!rl || rl.length===0){
            console.log("queryLiveBalanceAndCalcBalance error")
            return
        }
        let il=[]
        rl.forEach((record)=>{
            il.push([record.addr,record.liveBalance,record.calcBalance,record.diff]);
        });
        let sql="insert into tron_live.live_balance_audit_all (addr, live_balance, calc_balance, diff) values ? on duplicate key update live_balance=values(live_balance),calc_balance=values(calc_balance),diff=values(diff)";
        await db.query(sql, [il]);
    }
}

const doJob=async function(){
    await createTable();

    let list= await queryAccounts();
    if (list && list.length>0){
        await doBatchUpdate(list)
    }
}

const main = async function () {
    // await remove_from_black_list()
    // await addBalance('TTee3vKWqtZaafkuTEtwFd2QHwcyGkNEnj', 100 * 10000 * 1000000)
    await doJob();
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
    await db.query(sql);
}

createClearLogTable().then(() => {
// main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})

