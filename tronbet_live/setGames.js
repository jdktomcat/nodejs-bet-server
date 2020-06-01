const db = require("./src/utils/dbUtil");

const main = async function(){
    let checkSql=`select * from live_balance where addr in(select addr from live_balance_audit where flag!='normal')`;
    let beforeReset=await db.query(checkSql,[]);
    console.log("before reset")
    console.log(beforeReset)
    let resetSql=`update live_balance set balance=0  where addr in(select addr from live_balance_audit where flag!='normal') and addr!='TMtb6tEzPWFkd1ucT4LQabp3GK17tpK3TJ'`;
    let result =await db.exec(resetSql,[]);
    console.log("reset Result");
    console.log(result);
    let afterReset=await db.query(checkSql,[]);
    console.log("after reset")
    console.log(afterReset)
}

const createTableLiveBalanceAuditOffset = async function(){
    let sql=`
    CREATE TABLE live_balance_audit_offset (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        uid bigint(20) NOT NULL,
        addr varchar(64) NOT NULL,
        offset bigint(20) NOT NULL DEFAULT 0,
        create_time bigint(20) NOT NULL DEFAULT 0,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `;
    let res=await db.query(sql,[]);
}

const getAddresses =async function(){
    let params =['TRX',50000,0]
    let sql="select addr from live_balance where currency=? and uid>? and balance>? order by balance desc limit 500"
    let res=await db.query(sql,params);
    if (res) {
      return res.map(e => String(e.addr).trim());
    } else {
      return [];
    }
}

const queryLiveBalanceAndCalcBalance = async function (addresses) {
    let sql = `
        select sum(info.live_balance) as liveBalance,
            sum(info.deposit) - sum(info.withdraw) - sum(info.amount) + sum(info.win) as calcBalance,addr from
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
                select 0 as live_balance, sum(offset) as deposit, 0 as withdraw, 0 as amount, 0 as win,addr
                    from tron_live.live_balance_audit_offset where addr in (?) group by addr
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

    const data = await db.query(sql, [addresses, addresses, addresses, addresses, addresses, addresses, addresses, addresses, addresses, addresses])
    return data
}


const testQueryBatch = async function(addresses, count){
    let start = new Date().getTime();
    await queryLiveBalanceAndCalcBalance(addresses.slice(0, count));
    let end = new Date().getTime();
    console.log("testQueryBatch:"+new Date(start)+" end:"+new Date(end)+"[end-start]:"+(end-start));
}

const testAuditBatch = async function(){
    let addrs = await getAddresses();
    if (addrs.length < 500) {
        console.log("addrs less than 500")
        return
    }
    await testQueryBatch(addrs, 50);
    await testQueryBatch(addrs, 100);
    await testQueryBatch(addrs, 150);
    await testQueryBatch(addrs, 200);
    await testQueryBatch(addrs, 250);
    await testQueryBatch(addrs, 300);
    await testQueryBatch(addrs, 350);
    await testQueryBatch(addrs, 400);
    await testQueryBatch(addrs, 450);
    await testQueryBatch(addrs, 500);
}

testAuditBatch().then(() => {
//createTableLiveBalanceAuditOffset().then(() => {
// main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})

