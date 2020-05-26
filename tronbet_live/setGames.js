const db = require("./src/utils/dbUtil");
const child_process = require("child_process");

const raw = async function (updateSql, params) {
    console.log(updateSql, params)
    const t = await db.exec(updateSql, params);
    return t
}

const logProcess = function () {
    console.log("----reScanDice---->", new Date());
    const cmd = 'pm2 list'
    try{
        const a = child_process.execSync(cmd).toString()
        console.log("reScanDice_out: \n",a)
        process.exit(0)
    }catch (e) {
        console.log("reScanDice_error: \n",e)
        process.exit(1)
    }
}

const main = function () {
    logProcess()
}

main()
