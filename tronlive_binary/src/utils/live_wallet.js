const fetch = require('node-fetch');
const config = require('./../configs/config');
const basePath = config.live_wallet_url

const queryBalance = async function (body) {
    const url = basePath + "/api/query"
    const res = await fetch(url, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
    })
    const rawData = await res.json()
    console.log("request body is___>",body)
    console.log("response body is___>",rawData)
    if(rawData.code !== 200){
        throw new Error(rawData.message)
    }
    return rawData
}


const increaseBalance = async function () {
    const url = basePath + "/api/increase"
    const body = {
        "addr": "TJ8x34N7H3MxQkucpjFhnwW8aGjcYA94Ab",
        "currency": "TRX"
    }
    const res = await fetch(url, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
    })
    const rawData = await res.json()
    console.log("request body is___>",body)
    console.log("response body is___>",rawData)
    if(rawData.code !== 200){
        throw new Error(rawData.message)
    }
    return rawData
}


const decreaseBalance = async function (body) {
    const url = basePath + "/api/decrease"
    const res = await fetch(url, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
    })
    const rawData = await res.json()
    console.log("request body is___>",body)
    console.log("response body is___>",rawData)
    if(rawData.code !== 200){
        throw new Error(rawData.message)
    }
    return rawData
}


// queryBalance({
//     "addr" : "TJ8x34N7H3MxQkucpjFhnwW8aGjcYA94Ab",
//     "currency":"TRX",
//     "amount" : 1000000
// }).then(e=>{
//     console.log(e)
// })

module.exports = {
    queryBalance,
    increaseBalance,
    decreaseBalance,
}