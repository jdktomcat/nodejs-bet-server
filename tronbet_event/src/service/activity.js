/**
 * 处理下注订单信息
 *
 * @param message 下注订单信息
 * @returns {Promise<void>}
 */
const mine = require("./../model/mine")
async function handleMsg(message) {
    console.log("enter_message",message)
    // const now = Date.now()
    // const isStart = now >= new Date("2020-07-04").getTime()
    // const isEnd = now < new Date("2020-07-09").getTime()
    // let isBegin = isStart && isEnd
    // if(process.env.NODE_ENV === "test"){
    //     console.log("isBegin test",isBegin)
    //     isBegin = isEnd
    // }
    // console.log("isBegin last",isBegin)
    // if(isBegin){
    //     const messageData = JSON.parse(message)
    //     await mine.saveActivityData(messageData)
    // }
}

module.exports = {
    handleMsg
}
