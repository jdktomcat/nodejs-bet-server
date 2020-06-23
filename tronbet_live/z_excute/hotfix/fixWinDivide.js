const db = require("../../src/utils/dbUtil");

const rawQuery = async function (sql, params) {
    console.log(sql, params)
    const res = await db.exec(sql, params)
    console.log("affectedRows is : " + res.affectedRows + "\n")
    return res
}


const update1 = async function () {
    const sql = "update tron_bet_admin.sum_dice_data set data_str = ? where day_str = '2020-06-14' and id = 2048"
    const data = {
        "day": "2020-06-14",
        "dau": 420,
        "count": 80844,
        "all_amount": 38727250,
        "all_win": 37511957.0777,
        "balance": 1215292.9223
    }
    // +-----+-------+---------------+---------------+--------------+
    // | dau | count | all_amount    | all_win       | balance      |
    // +-----+-------+---------------+---------------+--------------+
    // | 420 | 80844 | 38727250.0000 | 37511957.0777 | 1215292.9223 |
    // +-----+-------+---------------+---------------+--------------+
    const o = JSON.stringify(data)
    await rawQuery(sql, [o])
}


const update2 = async function () {
    const sql = "update tron_bet_admin.sum_dice_data set data_str = ? where day_str = '2020-06-13' and id = 2046"
    const data = {
        "day": "2020-06-13",
        "dau": 557,
        "count": 64034,
        "all_amount": 27505974,
        "all_win": 27172540.0858,
        "balance": 333433.9142
    }
    // +-----+-------+---------------+---------------+-------------+
    // | dau | count | all_amount    | all_win       | balance     |
    // +-----+-------+---------------+---------------+-------------+
    // | 557 | 64034 | 27505974.0000 | 27172540.0858 | 333433.9142 |
    // +-----+-------+---------------+---------------+-------------+
    const o = JSON.stringify(data)
    await rawQuery(sql, [o])
}

const main = (async function () {
    await update1()
    await update2()
})().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})

module.exports = main