const scanDiceRestart = function () {
    try {
        const cmd = 'pm2 list'
        const a = require("child_process").execSync(cmd).toString()
        console.log("1111: \n", a)
    } catch (e) {
        console.log("2222: \n", e)
    }
}

module.exports = scanDiceRestart()