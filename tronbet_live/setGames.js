const db = require("./src/utils/dbUtil");

const update2222 = async function () {
    //ALTER table tableName ADD INDEX indexName(columnName)
	const sql = " ALTER table tron_live.swagger_transaction_log ADD INDEX transactionIdIDX(transactionId)";
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

