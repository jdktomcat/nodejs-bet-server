const bip39 = require('bip39');
const assert = require('assert');
const hdkey = require('hdkey');
const secp256k1 = require('secp256k1');
const Buffer = require('safe-buffer').Buffer;
const sha3 = require('js-sha3');
const Jssha = require('jssha');
const bs58 = require('bs58');
const EC = require('elliptic').ec

const TOKEN_DRIVE_PATH = {
    TRX: "m/44'/194'/0'/0/",
    ETH: "m/44'/60'/0'/0/"
}

class HDWallet {
    static generateMnemonic() {
        return bip39.generateMnemonic()
    }

    static fromMnemonic(mnemonic, isTestNet = false) {
        if (mnemonic == null) {
            mnemonic = this.generateMnemonic();
            console.log("random mnemonic:", mnemonic);
        }

        return new this({ mnemonic });
    }

    static fromPrivateKey(privateKey) {
        return new this({ privateKey })
    }

    constructor({ mnemonic, privateKey }) {
        if (mnemonic) {
            let _seed = bip39.mnemonicToSeedHex(mnemonic);
            console.log("new hd wallet from mnemonic ->", mnemonic);
            console.log("mnemonic -> seed", _seed);
            this._root = hdkey.fromMasterSeed(Buffer(_seed, 'hex'));
            this._rootType = "fromMnemonic";
        } else if (privateKey) {
            let privateKeyBuffer = new Buffer(privateKey, "HEX");
            console.log(privateKeyBuffer);
            assert.equal(privateKeyBuffer.length, 32, 'Private key must be 32 bytes.');
            assert(secp256k1.privateKeyVerify(privateKeyBuffer), 'Invalid private key');
            let node = new hdkey();
            node.privateKey = privateKeyBuffer;
            this._root = node;
            this._rootType = "fromPrivateKey";
        }
        //this._pubKeyBytes = getTronPubKey(this._node.publicKey);
    }

    //   getPrivateKey () {
    //     assert(this._node.privateKey, 'can not get private when generate from public key')
    //     return this._node.privateKey
    //   }

    //   getTronPrivateKey () {
    //     const priKey = this.getPrivateKey()
    //     let priKeyHex = priKey.toString('hex')
    //     while (priKeyHex.length < 64) {
    //       priKeyHex = '0' + priKeyHex
    //     }
    //     this._priKeyBytes = hexStr2byteArray(priKeyHex)

    //     return byteArray2hexStr(this._priKeyBytes)
    //   }

    //   getAddress () {
    //     const addressBytes = computeAddress(this._pubKeyBytes, this._isTestNet)
    //     return getBase58CheckAddress(addressBytes)
    //   }

    getAccount(_path, _index) {
        assert(this._root.derive, 'can not derive when generate from private / public key')
        _path = _path + _index;
        return this._root.derive(_path);
    }
}

// let wallet = HDWallet.fromMnemonic("session crunch torch old oval soap legal supply front stool regret pride");
// // let wallet = HDWallet.fromPrivateKey('4ed24432897627619a682d0a6a6b195ca0d5d1f113b74a1eda4fbe934b130f9b');
// //console.log(wallet);
// let ethereumAccount = wallet.getAccount(TOKEN_DRIVE_PATH.TRX, 1);
// //console.log("ethereumAccount",ethereumAccount);
// console.log("privateKeyHex:", ethereumAccount._privateKey.toString('hex'));
// console.log("publicKeyHex:", ethereumAccount._publicKey.toString('hex'));
// console.log("address", getAddress(ethereumAccount._publicKey));

let wallet1 = HDWallet.fromMnemonic("session crunch torch old oval soap legal supply front stool regret pride");
let tronAccount = wallet1.getAccount(TOKEN_DRIVE_PATH.TRX, 1);
//console.log("tronAccount",tronAccount);
console.log("privateKeyHex:", tronAccount._privateKey.toString('hex'));
let xxx = getTronPubKey(tronAccount._publicKey);
console.log("publicKeyHex:", xxx.toString('hex'));
console.log("address", getTrxAddress(xxx));

module.exports = HDWallet;

function getTronPubKey(pubKeyBytes) {
    var ec = new EC('secp256k1')
    var key = ec.keyFromPublic(pubKeyBytes, 'bytes')
    var pubkey = key.getPublic()
    var x = pubkey.x
    var y = pubkey.y
    var xHex = x.toString('hex')
    while (xHex.length < 64) {
        xHex = '0' + xHex
    }
    var yHex = y.toString('hex')
    while (yHex.length < 64) {
        yHex = '0' + yHex
    }
    var pubkeyHex = '04' + xHex + yHex
    var pubkeyBytes = hexStr2byteArray(pubkeyHex)
    return pubkeyBytes
}

function getAddress(pubKey, sanitize = true) {
    pubKey = toBuffer(pubKey);
    if (sanitize && pubKey.length !== 64) {
        pubKey = secp256k1.publicKeyConvert(pubKey, false).slice(1);
    }
    assert(pubKey.length === 64);
    let addressHex = sha3.keccak256(pubKey).toString().substring(24);
    return '0x' + addressHex;
}

function getTrxAddress(pubBytes, sanitize = true) {
    //pubKey = toBuffer(pubKey);
    //if (sanitize && pubKey.length !== 64) {
    //  pubKey = secp256k1.publicKeyConvert(pubKey, false).slice(1);
    //}
    //assert(pubKey.length === 64);
    //let addressHex = sha3.keccak256(pubKey).toString().substring(24);
    //console.log("--->address is ready:",addressHex);
    //let addressBytes = hexStr2byteArray(addressHex)
    //return  toTrxAddress(addressHex);


    if (pubBytes.length === 65) {
        pubBytes = pubBytes.slice(1)
    }
    var hash = sha3.keccak256(pubBytes).toString()
    var addressHex = hash.substring(24)
    addressHex = '41' + addressHex
    var addressBytes = hexStr2byteArray(addressHex)
    var hash0 = SHA256(addressBytes)
    var hash1 = SHA256(hash0)
    var checkSum = hash1.slice(0, 4)
    checkSum = addressBytes.concat(checkSum)
    var base58Check = bs58.encode(checkSum)
    return base58Check
}

function toTrxAddress(ethAddress) {
    return getBase58CheckAddress(ethAddress);

}

function computeAddress(pubBytes, isTestNet = false) {
    if (pubBytes.length === 65) {
        pubBytes = pubBytes.slice(1)
    }
    var hash = sha3.keccak256(pubBytes).toString()
    var addressHex = hash.substring(24)
    //addressHex = (isTestNet ? prefixTestNet : prefix) + addressHex
    var addressBytes = hexStr2byteArray(addressHex)
    return addressBytes
}
function byte2hexStr(byte) {
    var hexByteMap = '0123456789ABCDEF'
    var str = ''
    str += hexByteMap.charAt(byte >> 4)
    str += hexByteMap.charAt(byte & 0x0f)
    return str
}

function byteArray2hexStr(byteArray) {
    let str = ''
    for (let i = 0; i < (byteArray.length); i++) {
        str += byte2hexStr(byteArray[i])
    }
    return str
}

function hexStr2byteArray(str) {
    var byteArray = []
    var d = 0
    var j = 0
    var k = 0

    for (let i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (isHexChar(c)) {
            d <<= 4
            d += hexChar2byte(c)
            j++
            if ((j % 2) === 0) {
                byteArray[k++] = d
                d = 0
            }
        }
    }
    return byteArray
}

function getBase58CheckAddress(addressHex) {
    let addressBytes = hexStr2byteArray(addressHex)
    var hash0 = SHA256(addressBytes)
    var hash1 = SHA256(hash0)
    var checkSum = hash1.slice(0, 4)
    checkSum = addressBytes.concat(checkSum)
    var base58Check = bs58.encode(checkSum)
    return base58Check
}

function SHA256(msgBytes) {
    let shaObj = new Jssha('SHA-256', 'HEX')
    let msgHex = byteArray2hexStr(msgBytes)
    shaObj.update(msgHex)
    let hashHex = shaObj.getHash('HEX')
    return hexStr2byteArray(hashHex)
}

function isHexChar(c) {
    if ((c >= 'A' && c <= 'F') ||
        (c >= 'a' && c <= 'f') ||
        (c >= '0' && c <= '9')) {
        return 1
    }
    return 0
}

function hexChar2byte(c) {
    var d = 0
    if (c >= 'A' && c <= 'F') {
        d = c.charCodeAt(0) - 'A'.charCodeAt(0) + 10
    } else if (c >= 'a' && c <= 'f') {
        d = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10
    } else if (c >= '0' && c <= '9') {
        d = c.charCodeAt(0) - '0'.charCodeAt(0)
    }
    return d
}

function toBuffer(v) {
    if (!Buffer.isBuffer(v)) {
        if (Array.isArray(v)) {
            v = Buffer.from(v);
        } else if (typeof v === 'string') {
            if (exports.isHexString(v)) {
                v = Buffer.from(exports.padToEven(exports.stripHexPrefix(v)), 'hex');
            } else {
                v = Buffer.from(v);
            }
        } else if (typeof v === 'number') {
            v = exports.intToBuffer(v);
        } else if (v === null || v === undefined) {
            v = Buffer.allocUnsafe(0);
        } else if (BN.isBN(v)) {
            v = v.toArrayLike(Buffer);
        } else if (v.toArray) {
            // converts a BN to a Buffer
            v = Buffer.from(v.toArray());
        } else {
            throw new Error('invalid type');
        }
    }
    return v;
};