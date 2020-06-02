const db = require('../utils/dbUtil')
const Event= require('events');
/*
    多久跑一次任务
 */
const duration=2*60*1000;
/*
    进行了多少次任务
 */
let times=1;

/*
     每次批量任务的大小
 */
let batchSize=300;

/*
    那个uid开始
 */
let startUid=43073;
//let startUid=3073;

/*
    用户余额-计算的余额 允许的最大偏向值
 */
let allowMiss=1000*1000000;

/*
 *  live_balance-calc_balance>clearBalanceThreshold
 */
let clearBalanceThreshold=10000*1000000;


const queryLiveBalanceAndCalcBalance = async function (addresses) {
    console.log(addresses)
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
    console.log(data); 
    return data
}
/*
    查询出 tron_live.live_balance 中存在，但是 tron_live.live_balance_audit 不存在的数据
 */
const queryNewAccounts =async function(){
    let params =['TRX',startUid,0]
    let sql="select * from live_balance where currency=? and uid>? and balance>? and addr not in(select addr from live_balance_audit) order by balance desc"
    let result=await db.query(sql,params);
    return result;
}

/*
    查询出 tron_live.live_balance 中存在， tron_live.live_balance_audit 也存在，但是余额产生了变化的用户
 */
const queryBalanceChangeAccounts =async function(){
    let params =['TRX',startUid,0]
    let sql="select * from ( select * from live_balance where currency=? and uid>? and balance>?) a inner join (select * from live_balance_audit) b on a.addr=b.addr and a.balance!=b.live_balance"
    let result=await db.query(sql,params);
    return result;
}

/*
    批量处理列表中的数据插入或者更新
 */

const doBatchUpdate = async function(list){
    for(let i=0;i<Math.floor(list.length/batchSize+1);i++){
        let start=i*batchSize;
        let end=(i+1)*batchSize;
        if(end>list.length){
            end=list.length;
        }
        let bl=list.slice(start,end);
        let addresses=[]
        let ilMap={}
        bl.forEach((record)=>{
            addresses.push(record.addr);
            ilMap.addr=record.addr;
            ilMap.data=record
        });
        let rl=await queryLiveBalanceAndCalcBalance(addresses);
        if (!rl || rl.length===0){
            console.log("calc balance wrong!")
            return
        }
        let il=[]
	let cleanAddrs=[];
        rl.forEach((record)=>{
            if(record.liveBalance -record.calcBalance>allowMiss){
                //异常记录
                let tmp=[record.addr,record.liveBalance,record.calcBalance,'malicious'];
                il.push(tmp);
		if((record.liveBalance-record.calcBalance)>clearBalanceThreshold){
			cleanAddrs.push(record.addr);
		}
            }else{
                let tmp=[record.addr,record.liveBalance,record.calcBalance,'normal'];
                il.push(tmp)
            }
        });
	console.log(il);
        let sql="insert into tron_live.live_balance_audit (addr, live_balance, calc_balance, flag) values ? on duplicate key update flag=values(flag),live_balance=values(live_balance),calc_balance=values(calc_balance)";
        await db.query(sql, [il]);
	if(cleanAddrs.length==0){
		return
	}
	console.log("##################################################Clean User Balance##################################################");
	console.log(cleanAddrs);
	console.log("before clean user balance");
	let qUserBalSql=`select uid,addr,balance,tag from live_balance where addr in(?)`;	
	let beforeCleanBalance = await db.query(qUserBalSql, [cleanAddrs]);
	console.log(beforeCleanBalance);
	let cleanBalanceSql="insert into tron_live.live_balance(uid,currency,addr,tag, balance) values ? on duplicate key update balance=0";
	let cleanList=[];
	beforeCleanBalance.forEach((record)=>{
		let tmp =[record.uid,'TRX',record.addr,record.tag,0];
		cleanList.push(tmp);
	});
        await db.query(cleanBalanceSql, [cleanList]);
	console.log("after clear user balance");
	let afterCleanBalance = await db.query(qUserBalSql, [cleanAddrs]);	
	console.log(afterCleanBalance);
	console.log("##################################################Clean User Balance##################################################");
    }
}

/*
    1.查询出 tron_live.live_balance 中存在，但是 tron_live.live_balance_audit 不存在的数据 union 上tron_live.live_balance_audit 以及tron_live.live_balance 中都存在的数数据 余额有变化的数据
    2.对于查询出来的数据，每次进行查找，批量进行处理
 */
const doJob=async function(){
    console.log("do job ..."+times);
    times++
    let newList= await queryNewAccounts();
    console.log("newList")
    console.log(newList);
    if (newList && newList.length>0){
        await doBatchUpdate(newList)
    }
    console.log("end new List")
    let changeList= await queryBalanceChangeAccounts();
    console.log("changeList")
    console.log(changeList);
    if (changeList && changeList.length>0){
        await doBatchUpdate(changeList)
    }
}
/*
     1.没空隔t时间执行一次任务，如果执行任务的过程中超过了t时间，那么接下来继续执行
     2.如果执行的过程中出现了异常，那么重新执行
 */
const startMission= async function () {
    let start = new Date().getTime();
    let end;
    try {
        await doJob()
    } catch (e) {
        console.log("job 执行异常 "+e);
    } finally {
        end = new Date().getTime();
        console.log("finally...start:"+new Date(start)+" end:"+new Date(end)+"[end-start]:"+(end-start));
    }
    if(end-start<duration){
        setTimeout(startMission,duration-(end-start));
    }else{
        await startMission();

    }
}

/*
    定时任务开始
 */
const auditSchedule = async function () {
    await startMission();
}

module.exports = auditSchedule


