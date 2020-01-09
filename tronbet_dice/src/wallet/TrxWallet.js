const HDWallet = require('./HDWallet');
const EC = require('elliptic').ec
const sha3 = require('js-sha3');
const bs58 = require('bs58');
const secp256k1 = require('secp256k1');
const ethUtil = require('ethereumjs-util');

const BLOCK_CHAIN = "TRON";
const DRIVE_PATH = "m/44'/194'/0'/0/";

class TrxWallet extends HDWallet {
    constructor({ mnemonic, privateKey }) {
        super({ mnemonic, privateKey, DRIVE_PATH, BLOCK_CHAIN });
    }
    getAccount(_index) {
        // console.log(this);
        let _node = this._root.derive(this.DRIVE_PATH + _index);
        let _publicKeyBytes = getTronPubKey(_node._publicKey);
        let _address = getTrxAddress(_publicKeyBytes);
        // console.log("getAccount",_node._privateKey.toString('hex'));
        return {
            blockChain: this.BLOCK_CHAIN,
            privateKeyHex: _node._privateKey.toString('hex'),
            publicKeyHex: _node._publicKey.toString('hex'),
            address: _address,
            hex: getAddress(_node._publicKey),
            index: _index
        }
    }
}

function getTronPubKey(publicKeyBuffer) {
    let ec = new EC('secp256k1');
    let key = ec.keyFromPublic(publicKeyBuffer, 'bytes');
    let pubkey = key.getPublic();
    let x = pubkey.x;
    let y = pubkey.y;
    let xHex = x.toString('hex');
    while (xHex.length < 64) {
        xHex = '0' + xHex;
    }
    let yHex = y.toString('hex');
    while (yHex.length < 64) {
        yHex = '0' + yHex;
    }
    let pubkeyHex = '04' + xHex + yHex;
    let pubkeyBytes = HDWallet.hexStr2byteArray(pubkeyHex);
    return pubkeyBytes;
}

function getAddress(pubKey, sanitize = true) {
    if (sanitize && pubKey.length !== 64) {
        pubKey = secp256k1.publicKeyConvert(pubKey, false).slice(1);
    }
    // assert(pubKey.length === 64);
    let addressHex = sha3.keccak256(pubKey).toString().substring(24);
    return ethUtil.toChecksumAddress(addressHex);
}

function getTrxAddress(pubBytes) {
    if (pubBytes.length === 65) {
        pubBytes = pubBytes.slice(1);
    }
    let hash = sha3.keccak256(pubBytes).toString();
    let addressHex = hash.substring(24);
    addressHex = '41' + addressHex;
    let addressBytes = HDWallet.hexStr2byteArray(addressHex);
    let hash0 = HDWallet.SHA256(addressBytes);
    let hash1 = HDWallet.SHA256(hash0);
    let checkSum = hash1.slice(0, 4);
    checkSum = addressBytes.concat(checkSum);
    let base58Check = bs58.encode(checkSum);
    return base58Check;
}

module.exports = TrxWallet;

let mnemonic = "model mail mansion dice erode swallow tobacco edit copper real deny ritual donkey crowd churn nut until steel honey spot fitness fiction scorpion east";

let wallet = new TrxWallet({ mnemonic: mnemonic, privateKey: null });
let trxAccount = wallet.getAccount(0);
masterPrivateKey = trxAccount.privateKeyHex;
console.log("\r\nmnemonic:",mnemonic);
console.log("masterPublicKey:", trxAccount.publicKeyHex);
console.log("TronAddress:", trxAccount.address);
console.log("masterPrivateKey:", masterPrivateKey);


// for (let i = 1; i <= 3; i++) {
//     let trxAccount = wallet.getAccount(i);
//     // let _privateKey = trxAccount.privateKeyHex;
//     // let _address = TronWeb.address.fromPrivateKey(_privateKey);
//     console.log(trxAccount);
// }
