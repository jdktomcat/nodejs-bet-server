const db = require("../../src/utils/dbUtil");

const rawQuery = async function (sql, params) {
    console.log(sql, params)
    const res = await db.exec(sql, params)
    console.log("res is : " + JSON.stringify(res) + "\n")
    return res
}


//select div_state from tron_bet_wzc.win_ver_v1 where ver = 331 and div_state = 1;
const update_win_divide = async function () {
    const sql = "update tron_bet_wzc.win_ver_v1 set div_state = 2 where ver = 331 and div_state = 1"
    await rawQuery(sql, [])
}


const main = (async function () {
    await update_win_divide()
})().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})

module.exports = main