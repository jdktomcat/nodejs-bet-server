
const sha3 = require('js-sha3')
const {app} = require('../configs/config')

let originalSeed = sha3.keccak256(Date.now().toString())

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}


function getRandomSeed() {
    let salt = app.randomSalt || "";
    originalSeed = sha3.keccak256(Date.now().toString() + originalSeed + salt);
    return originalSeed;
}

module.exports = {
    sleep,
    getRandomSeed,
}