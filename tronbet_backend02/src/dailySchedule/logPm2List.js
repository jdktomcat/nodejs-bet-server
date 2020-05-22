const logProcess = function () {
    console.log("----reScanDice---->", new Date());
    const cmd = 'pm2 list'
    try{
        const child_process = require("child_process")
        const a = child_process.execSync(cmd).toString()
        console.log("reScanDice_out: \n",a)
        return a
    }catch (e) {
        console.log("reScanDice_error: \n",e)
        return e.toString()
    }
}

module.exports = logProcess