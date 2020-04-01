const CryptoJS = require("crypto-js");
const config = require('../configs/config');
const salt = config.Platinus.secretKey
const key = CryptoJS.enc.Utf8.parse(salt);

const sign = function (addr) {
    const jwt = require('jsonwebtoken');
    const config = require("./../configs/config")
    const secretKey = config.Platinus.secretKey
    const obj = {
        addr: addr,
    }
    const token = jwt.sign(obj, secretKey, {
        algorithm: 'HS256',
        expiresIn: '7 days'
    })
    return token
}

const getInfo = function (token) {
    const jwt = require('jsonwebtoken');
    const config = require("./../configs/config")
    const secretKey = config.Platinus.secretKey
    const payload = jwt.verify(token, secretKey)
    return payload
}

class Platius {
    static async sign(addr){
        const t = await sign(addr)
        return t
    }

    static async getInfo(addr){
        const t = await getInfo(addr)
        return t
    }
}


module.exports = Platius