const sha3 = require('js-sha3')
const {app, softswiss} = require('../configs/config')
const crypto = require("crypto")
const CryptoJS = require("crypto-js");
const key = CryptoJS.enc.Utf8.parse("function Common('eAxDWwTCWbwQYqbhWNEJkJLa9dm36w3O')");

let originalSeed = sha3.keccak256(Date.now().toString())

function sleep(ms) {    
	return new Promise(resolve => setTimeout(resolve, ms))
}

function cipher(str) {
    let key = app.cipherKey
    const cipher = crypto.createCipher('aes192', key);
    let crypted = cipher.update(str + '|' + Date.now().toString(), 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decipher(str) {
    let key = app.cipherKey
    const decipher = crypto.createDecipher('aes192', key);
    let decrypted = decipher.update(str, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function encrypt(message) {
   var encrypted = CryptoJS.DES.encrypt(message, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

function decrypt(message) {
  try {
    var plaintext = CryptoJS.DES.decrypt(message, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    })
    return plaintext.toString(CryptoJS.enc.Utf8)
  } catch (e) {
    // console.log(e);
    return ""
  }

}

function getRandomSeed(length) {
    if(!length) length = 64
    let salt = app.randomSalt || "";
    originalSeed = sha3.keccak256(Date.now().toString() + originalSeed + salt);
    originalSeed = originalSeed.substr(0, length)
    return originalSeed;
}

function hashPass(pass) {
    let result = sha3.keccak256(pass + app.randomSalt);
    return result
}

function VerifySign(sign, message) {
    let key = softswiss.AUTH_TOKEN
    try {
        message = JSON.stringify(message)
    } catch (error) {
        console.log(message)
    }
    let computedSignature = crypto.createHmac("sha256", key).update(message).digest("hex")

    if (computedSignature == sign) return true
    return false

}

//兼容新老字段不一致的问题老的code, info ---> errno,errmsg
//实际上只需要一对就够了, 但是为了兼容老的客户端, 这个暂时先并存一段时间
async function sendMsgToClient(ctx, errno, errmsg, data) {
    let result = {
        errno: errno,
        code: errno,
        errmsg: errmsg,
        info: errmsg,
        data: data
    }
    ctx.body = result
}

module.exports = { 
    sleep,
    getRandomSeed,
    VerifySign,
    sendMsgToClient,
    hashPass,
    cipher,
    decipher,
    encrypt
}