const BigNumber = require('bignumber.js');
const sha3 = require('js-sha3');
const TronWeb = require("tronweb");
const HttpProvider = TronWeb.providers.HttpProvider;
const assertJS = require('assert');

function hexStringToBigNumber(hexStr) {
    return new BigNumber('0x' + hexStr);
}

function hexStringToInt(hexStr) {
    return parseInt(hexStringToBigNumber(hexStr).toString());
}

let originalSeed = sha3.keccak_256(Date.now().toString());
function getRandomSeed(salt) {
    salt = salt || "";
    originalSeed = sha3.keccak_256(Date.now().toString() + originalSeed + salt);
    return originalSeed;
}

// 此节点无需联网, 用于本地签名
const fullNode = new HttpProvider('https://api.trongrid.io');
const solidityNode = new HttpProvider('https://api.trongrid.io');
const tronWeb = new TronWeb(fullNode, solidityNode, null, '0000000000000000000000000000000000000000000000000000000000000001');
async function verifySign(hexStr, signature, publicKey) {
    // let hexStr = TronWeb.fromUtf8(msg);
    try {
        let ret = await tronWeb.trx.verifyMessage(hexStr, signature, publicKey).catch((err) => { return false; });
        return ret;
    } catch(e) {
        return false;
    }
}

function getAccountName(addr, cb) {
    try {
        tronWeb.trx.getAccount(addr, (err, account) => {
            if (err) { cb('');  return; }
            let account_name = account.account_name;
            if (account_name == null || account_name.length < 2) {
                cb('');
            } else {
                cb(TronWeb.toUtf8(account_name));
            }
        });
    } catch(e) {
        cb('');
    }
}

function getUnixTimeStamp() {
    return Math.floor(Date.now() / 1000);
}

function assert(v1, v2) {
    if (process.env.NODE_ENV !== 'production') {
        assertJS.strictEqual(v1, v2);
    }
}


module.exports.hexStringToBigNumber = hexStringToBigNumber;
module.exports.hexStringToInt = hexStringToInt;
module.exports.getRandomSeed = getRandomSeed;
module.exports.verifySign = verifySign;
module.exports.getAccountName = getAccountName;
module.exports.getUnixTimeStamp = getUnixTimeStamp;
module.exports.assert = assert;