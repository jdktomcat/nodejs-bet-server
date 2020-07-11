const db = require("../../src/utils/dbUtil");

const rawQuery = async function (sql, params) {
    console.log(sql, params)
    const res = await db.exec(sql, params)
    console.log("affectedRows is : " + res.affectedRows + "\n")
    return res
}
// | 26 | test1    |
// | 27 | test0    |
// | 28 | prd1     |
// | 29 | data1    |
// | 30 | support1 |
// | 31 | testback |

const main = async function () {
    const sql1 = `delete from tron_live.live_fix_log where ts >= 1594350270236`
    await rawQuery(sql1,[])
    // 等于0的移除
    const sql2 = `delete from tron_live.live_fix_log where amount < 1`
    await rawQuery(sql2,[])
}


main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})