const config = require('../configs/config');
const CryptoJS = require("crypto-js");
const key = CryptoJS.enc.Utf8.parse("function Common('eAxDWwTCWbwQYqbhWNEJkJLa9dm36w3O')");

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

const cpConfigKey = {
    'Platinus': config.Platinus.secretKey,
    'Binary': config.Binary.secretKey,
}



const getCpToken = function (addr, secretKey) {
    const jwt = require('jsonwebtoken');
    const obj = {
        addr: addr,
    }
    console.log("debug----->obj is ",obj)
    console.log("debug----->secretKey is ",secretKey)
    if(secretKey === cpConfigKey.Platinus){
        const token = jwt.sign(obj, secretKey, {
            algorithm: 'HS256',
            expiresIn: '10 days'
        })
        return token
    }else if(secretKey === cpConfigKey.Binary){
        const s = encrypt(addr)
        return s
    }
}

module.exports = {
    cpConfigKey,
    getCpToken,
}