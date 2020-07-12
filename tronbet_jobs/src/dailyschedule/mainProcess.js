const depositHealthCheck = require("./depositHealthCheck")
const main = async function () {
    //屏蔽测试环境
    if(process.env.NODE_ENV !== 'test'){
        console.log("live jobs  start....")
        await depositHealthCheck()
    }

}
module.exports = main
