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

createTableLiveBalanceAuditOffset().then(() => {
// main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})

