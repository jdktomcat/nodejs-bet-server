const HDWallet = require('./HDWallet');
const secp256k1 = require('secp256k1');
const assert = require('assert');
const sha3 = require('js-sha3');
const ethUtil = require('ethereumjs-util');

const BLOCK_CHAIN = "ETHEREUM";
const DRIVE_PATH = "m/44'/60'/0'/0/";

class EthWallet extends HDWallet {
    constructor({ mnemonic, privateKey }) {
        super({ mnemonic, privateKey, DRIVE_PATH, BLOCK_CHAIN });
    }
    getAccount(_index) {
        let _node = this._root.derive(this.DRIVE_PATH + _index);
        return {
            blockChain:this.BLOCK_CHAIN,
            privateKeyHex: _node._privateKey.toString('hex'),
            publicKeyHex: _node._publicKey.toString('hex'),
            address: getAddress(_node._publicKey),
            index:_index
        }
    }
}

function getAddress(pubKey, sanitize = true) {
    if (sanitize && pubKey.length !== 64) {
        pubKey = secp256k1.publicKeyConvert(pubKey, false).slice(1);
    }
    assert(pubKey.length === 64);
    let addressHex = sha3.keccak256(pubKey).toString().substring(24);
    return ethUtil.toChecksumAddress(addressHex);
}

module.exports = EthWallet;