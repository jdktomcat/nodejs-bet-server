const bip39 = require('bip39');
const assert = require('assert');
const hdkey = require('hdkey');
const secp256k1 = require('secp256k1');
const Buffer = require('safe-buffer').Buffer;
const Jssha = require('jssha');

class HDWallet {
    static generateMnemonic() {
        return bip39.generateMnemonic();
    }

    static fromMnemonic(mnemonic, DRIVE_PATH) {
        if (mnemonic == null) {
            mnemonic = this.generateMnemonic();
            console.log("random mnemonic:", mnemonic);
        }
        return new this({ mnemonic, DRIVE_PATH });
    }

    static fromPrivateKey(privateKey, DRIVE_PATH) {
        return new this({ privateKey, DRIVE_PATH });
    }

    constructor({ mnemonic, privateKey, DRIVE_PATH, BLOCK_CHAIN }) {
        if (DRIVE_PATH == null) {
            assert(false, "HDWallet DRIVE_PATH is null");
        }
        if(BLOCK_CHAIN == null){
            assert(false, "HDWallet BLOCK_CHAIN is null");
        }
        if (mnemonic) {
            let seed = bip39.mnemonicToSeedHex(mnemonic);
            this._root = hdkey.fromMasterSeed(Buffer(seed, 'hex'));
        } else if (privateKey) {
            //assert.equal(privateKey.length, 32, 'Private key must be 32 bytes.');
            assert(secp256k1.privateKeyVerify(privateKey), 'Invalid private key');
            this._root = {
                publicKey: secp256k1.publicKeyCreate(privateKey, true),
                privateKey: privateKey
            }
        } else {
            assert(false, "HDWallet constructor error!");
        }
        this.DRIVE_PATH = DRIVE_PATH;
        this.BLOCK_CHAIN = BLOCK_CHAIN;
    }

    getAccount(_index) {
        assert(false, "no implement interface getAccount");
    }

    ////////////////////////////////////////////////////////

    static hexStr2byteArray(str) {
        let byteArray = [];
        let d = 0;
        let j = 0;
        let k = 0;

        for (let i = 0; i < str.length; i++) {
            let c = str.charAt(i);
            if (this.isHexChar(c)) {
                d <<= 4;
                d += this.hexChar2byte(c);
                j++;
                if ((j % 2) === 0) {
                    byteArray[k++] = d;
                    d = 0;
                }
            }
        }
        return byteArray;
    }


    static isHexChar(c) {
        if ((c >= 'A' && c <= 'F') ||
            (c >= 'a' && c <= 'f') ||
            (c >= '0' && c <= '9')) {
            return 1;
        }
        return 0;
    }


    static hexChar2byte(c) {
        let d = 0;
        if (c >= 'A' && c <= 'F') {
            d = c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
        } else if (c >= 'a' && c <= 'f') {
            d = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
        } else if (c >= '0' && c <= '9') {
            d = c.charCodeAt(0) - '0'.charCodeAt(0);
        }
        return d;
    }


    static SHA256(msgBytes) {
        let shaObj = new Jssha('SHA-256', 'HEX');
        let msgHex = this.byteArray2hexStr(msgBytes);
        shaObj.update(msgHex);
        let hashHex = shaObj.getHash('HEX');
        return this.hexStr2byteArray(hashHex);
    }


    static byteArray2hexStr(byteArray) {
        let str = '';
        for (let i = 0; i < (byteArray.length); i++) {
            str += this.byte2hexStr(byteArray[i]);
        }
        return str;
    }

    static byte2hexStr(byte) {
        let hexByteMap = '0123456789ABCDEF';
        let str = '';
        str += hexByteMap.charAt(byte >> 4);
        str += hexByteMap.charAt(byte & 0x0f);
        return str;
    }
    ////////////////////////////////////////////////////////
}

module.exports = HDWallet;

