const db = require("./src/utils/dbUtil");

const remove_from_black_list = async function () {
    const update_balance_sql = "delete from tron_live.live_black_list where addr = 'TTee3vKWqtZaafkuTEtwFd2QHwcyGkNEnj' and id = 2057"
    const params = []
    console.log(update_balance_sql, params)
    await db.exec(update_balance_sql, params)
}


const main = async function () {
    await remove_from_black_list()
}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})

