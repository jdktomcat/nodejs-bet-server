const CryptoJS = require("crypto-js");
const config = require('../configs/config');
const salt = config.Platinus.secretKey
const key = CryptoJS.enc.Utf8.parse(salt);

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


const sign = function (addr) {
    const jwt = require('jsonwebtoken');
    const config = require("./../configs/config")
    const secretKey = config.Platinus.secretKey
    const obj = {
        addr: addr,
    }
    // console.log("debug----->obj is ",obj)
    // console.log("debug----->secretKey is ",secretKey)
    const token = jwt.sign(obj, secretKey, {
        algorithm: 'HS256',
        expiresIn: '10 days'
    })
    return token
}

module.exports = sign