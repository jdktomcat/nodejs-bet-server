const sha3 = require('js-sha3')
const {app, softswiss} = require('../configs/config')
const crypto = require("crypto");
const signingKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3Ryb25iZXQuaW8vIiwic3ViIjoiV2FuZ21hbiIsInNjb3BlIjoiYWxsIiwianRpIjoiODQxY2MwMWEtNTY3Mi00ZDE2LWFkMzYtNzI2ODdjZDcwZWQyIiwiaWF0IjoxNTQxNDk3MzI0LCJleHAiOjE1NDE1MDA5MjR9.QwiPvbW22xK2puq85_sYK4Ao3XoEYuFBcF4KHfS2ZzY"
const nJwt = require('njwt')

let originalSeed = sha3.keccak256(Date.now().toString())

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}


function verifyUserToken(token){
    try{
      let verifiedJwt = nJwt.verify(token, signingKey);
      return verifiedJwt;
    }catch(e){
      console.error(e)
      return false;
    }
}

async function sendMsgToClient(ctx, errno, errmsg, data) {
    data = data || {}
    let result = {
        errno,
        errmsg,
        data
    }
    ctx.body = result
}

function getRandomSeed(length) {
    if(!length) length = 64
    let salt = app.randomSalt || "";
    originalSeed = sha3.keccak256(Date.now().toString() + originalSeed + salt);
    originalSeed = originalSeed.substr(0, length)
    return originalSeed;
}

function VerifySign(sign, message) {
    let key = softswiss.AUTH_TOKEN
    try {
        message = JSON.stringify(message)
    } catch (error) {
        console.log(message)
    }
    console.log(message)
    let computedSignature = crypto.createHmac("sha256", key).update(message).digest("hex")

    if (computedSignature == sign) return true
    return false

}

module.exports = { 
    sleep,
    getRandomSeed,
    VerifySign,
    verifyUserToken,
    sendMsgToClient
}