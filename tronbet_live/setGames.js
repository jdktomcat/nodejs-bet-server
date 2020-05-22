const db = require("./src/utils/dbUtil");
const {spawn} = require("child_process");

const raw = async function (updateSql, params) {
    console.log(updateSql, params)
    const t = await db.exec(updateSql, params);
    return t
}

const logProcess = async function () {
    console.log("----reScanDice---->", new Date());
    const ls = spawn("pm2", ["list"]);
    ls.stdout.on("data", data => {
        console.log(`reScanDice输出：${data}`);
    });

    ls.stderr.on("data", data => {
        console.log(`reScanDice错误：${data}`);
    });

    ls.on("close", code => {
        console.log(`reScanDice子进程退出码：${code}`);
    });

}

const main = async function () {
    await  logProcess()

}

main().then(() => {
    console.log("end!")
    process.exit(0)
}).catch(e => {
    console.log('error is : ', e)
    process.exit(1)
})
