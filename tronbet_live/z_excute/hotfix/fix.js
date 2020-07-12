const db = require("../../src/utils/dbUtil");

const rawQuery = async function (sql, params) {
    console.log(sql, params)
    const res = await db.exec(sql, params)
    console.log("affectedRows is : " + res.affectedRows + "\n")
    return res
}

const test1 = async function () {
    const sql0 = `CREATE TABLE tron_live.swagger_hub_black_list (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        addr varchar(64) DEFAULT NULL,
        ts bigint(20) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY live_black_list_ts_index (ts)
    )`
    await rawQuery(sql0,[])
}

const test2 = async function () {
    const sql1 = 'insert into tron_live.swagger_hub_black_list(addr,ts)values(?,?)'
    const addrs = [
        'TE5TW1foNEY6w8NJ21DWdDRZrSAN3Tm2Wf',
        'TD9LS5xgVgcEBKhSLYSq2KeGcgHUQtMYZG',
        //
        'TTee3vKWqtZaafkuTEtwFd2QHwcyGkNEnj',
        'TV1jb3L3mHtuyeBk9Vj6oLZ3zzSwjQSHbR',
    ]
    for (let i = 0; i < addrs.length; i++) {
        let addr = addrs[i]
        await rawQuery(sql1,[addr,Date.now()])
    }
}

const main = async function () {
    await test1()
    await test2()
}


main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})