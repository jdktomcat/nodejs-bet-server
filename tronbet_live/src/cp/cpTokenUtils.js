const config = require('../configs/config');
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
    const token = jwt.sign(obj, secretKey, {
        algorithm: 'HS256',
        expiresIn: '10 days'
    })
    return token
}

module.exports = {
    cpConfigKey,
    getCpToken,
}