const sha3 = require('js-sha3')
const {app, bettech} = require('../configs/config')
const crypto = require("crypto")
const jwt = require('jsonwebtoken')

let originalSeed = sha3.keccak256(Date.now().toString())

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

function verifyUserToken(token){
    try{
      let verifiedJwt = jwt.verify(token, bettech.publicKey);
      return verifiedJwt;
    }catch(e){
      console.error(e)
      return false;
    }
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
    verifyUserToken
}