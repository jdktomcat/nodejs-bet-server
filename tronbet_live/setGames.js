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

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})

