const db = require('../utils/dbUtil');
const config = require('../configs/config');

let times=1;
let duration = 3*24*60*60*1000;
let lost=0;

let startLogId=256856;//跑完这次之后，可以设置为1 重新跑一遍
let finishTerm=0;//每重新跑一次，计数+1
const queryMaxLogId = async function () {
    let params = []
    let sql = "select logId from live_cb_deposit_log order by logId desc limit 1";
    let result = await db.query(sql, params);
    return result[0];
}
const queryNewRecord = async function (logId) {
    let params = [logId]
    let sql = "select * from live_cb_deposit_log where logId=?";
    let result = await db.query(sql, params);
    return result[0];
}
const deleteNewRecord = async function (logId) {
    let params = [logId]
    let sql = "delete from live_cb_deposit_log where logId=?";
    let result = await db.exec(sql, params);
    return result[0];
}
const queryOldRecord = async function (txId) {
    let params = [txId]
    let sql = "select * from live_charge_log where txId=?";
    let result = await db.query(sql, params);
    return result[0];
}
const queryBalance = async function (uid,currency) {
    let params = [uid,currency];
    let sql = "select balance from live_balance where uid=? and currency=?";
    let result = await db.query(sql, params);
    return result[0];
}
//更新余额
const updateBalance= async function(record){
    let res=await queryBalance(record.uid,record.currency);
    console.log(JSON.stringify(res));
    let sql = "update live_balance set balance=? where uid=? and currency=?";
    let params=[];
    if(res.balance-record.amount>=0){
        params=[res.balance-record.amount,record.uid,record.currency];
        let rs = await db.exec(sql,params);
    }else if(res.balance>0){//如果小于0 就没有必要更新了
        params=[0,record.uid,record.currency];//我们转给用户的钱损失了
        lost+=record.amount-res.balance;
        let rs = await db.exec(sql,params);
    }else{
        lost+=record.amount;
    }
    console.log("Lost:%s",lost/1000000);
}

const doUpdates=async function(record){
    await updateBalance(record);//减少余额，删除
    await deleteNewRecord(record.logId);//删除掉记录
}

/*
    大概有12万条的数据需要清理 清理live_cb_deposit_log，将重复的数据干掉
 */
const doJob = async function () {
    console.log("do job ..." + times);
    let startId=startLogId;
    while (true){
        let newRecord=await queryNewRecord(startId);//当太大其实会找不到的,中间会有断层，需要查找一下最大值 ,这个值开始是没有的哦
        let oldRecord;
        if(newRecord){//代表还有
            let txId=newRecord.txId;
            oldRecord=await queryOldRecord(txId);
            if(oldRecord){//已经更新过了
               console.log("new Record:"+JSON.stringify(newRecord));
               console.log("old Record:"+JSON.stringify(oldRecord));
               await doUpdates(newRecord);//同时需要删除这条记录
            }
        }else{//找不到了
            let maxRecord=await queryMaxLogId();
            if(maxRecord.logId<startId){
                console.log("达到最大值了，从头开始重新检查...");
                finishTerm++;
                startId=0;
                break;//先停掉
            }
        }
        console.log("Term:%s LogId:%s",finishTerm,startId);
        startId++;
    }
}

/*
     1.没空隔t时间执行一次任务，如果执行任务的过程中超过了t时间，那么接下来继续执行
     2.如果执行的过程中出现了异常，那么重新执行
 */
const startMission = async function () {
    let start = new Date().getTime();
    finishTerm++;
    let end;
    try {
        await doJob()
    } catch (e) {
        console.log("job 执行异常 " + e);
    } finally {
        end = new Date().getTime();
        console.log("finally...start:" + new Date(start) + " end:" + new Date(end) + "[end-start]:" + (end - start));
    }
    if (end - start < duration) {
        setTimeout(startMission, duration - (end - start));
    } else {
        await startMission();

    }
}

/*
    定时任务开始
 */
const depositHealthCheck = async function () {
    await  db.init(config);
    await startMission();
}

module.exports =depositHealthCheck;


