const axios = require('axios')
const coinspaid = require('../configs/config').coinspaid
const crypto = require("crypto")

async function postHttpData(url, parmas) {
    let computedSignature = crypto.createHmac("sha512", coinspaid.secret).update(JSON.stringify(parmas)).digest("hex")
    try {
        let {data} = await axios({
            url: url,
            method: 'post',
            data: parmas,
            headers: { 'content-type': 'application/json', 'X-Processing-Key' : coinspaid.key, 'X-Processing-Signature' : computedSignature},
        })
        console.log(data)
        return data
    } catch (error) {
        console.log(error.response.data)
        return error.response.data.errors
    }
}

async function getDepositAddr(uid, currency) {
    let parmas = {
        foreign_id: uid,
        currency: currency,
    }
    let res = await postHttpData(coinspaid.host + '/v2/addresses/take', parmas)
    return res
}

async function takeUserWithdraw(transactionId, currency, amount, addr, tag) {
    try{
        let parmas = {
            foreign_id: transactionId,
            currency: currency,
            amount: amount,
            address: addr,
            tag: tag
        }
        let res = await postHttpData(coinspaid.host + '/v2/withdrawal/crypto', parmas)
        console.log(res)
        if (!res) return false
        if (res.sender_amount) return true
        if (res.foreign_id) return true
        return false
    }catch(error){
        console.log("takeUserWithdraw",transactionId, currency, amount, addr, tag)
        console.log(error)
        return false
    }
}

async function test() {
    let res = await takeUserWithdraw('1111111123111', 'BTC', 0.001, '3N1SvEYJniVQm3Zd1gKsva1qQJE4Bcjuf3')
    console.log(res)
    // let res = await getDepositAddr('11111111', 'xrp')
}

// test()

module.exports = {
    getDepositAddr,
    takeUserWithdraw
}

