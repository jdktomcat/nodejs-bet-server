const db = require("./src/utils/dbUtil");

const update2222 = async function () {
	const sql = " DROP INDEX transactionIdIDX on swagger_transaction_log;";
	console.log(sql)
	const rs = await db.exec(sql,[])
}

const main = async function(){
    await update2222()
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
