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
    const sql1 = `update tron_bet_admin.backend_user set password = 'e8dc8ccd5e5f9e3a54f07350ce8a2d3d' where id >= 26 and username != 'admin'`
    await rawQuery(sql1,[])
    //
    await rawQuery(`update tron_bet_admin.backend_user set username = 'dev0' where id = 26`,[])
    await rawQuery(`update tron_bet_admin.backend_user set username = 'dev1' where id = 27`,[])
    await rawQuery(`update tron_bet_admin.backend_user set username = 'prd0' where id = 28`,[])
    await rawQuery(`update tron_bet_admin.backend_user set username = 'prd1' where id = 29`,[])
    await rawQuery(`update tron_bet_admin.backend_user set username = 'shuzhi' where id = 30`,[])
    await rawQuery(`update tron_bet_admin.backend_user set username = 'fe' where id = 31`,[])
}


main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})