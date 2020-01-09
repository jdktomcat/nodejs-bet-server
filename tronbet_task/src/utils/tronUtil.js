const _ = require("lodash")._;
const BigNumber = require('bignumber.js');
const utilCommon = require('./utilCommon');
const injectPromise = utilCommon.injectPromise;
const TronWeb = require('tronweb');
const HttpProvider = TronWeb.providers.HttpProvider;;
const config = require('../configs/config');
let tronWeb = null;

async function init() {
    if (tronWeb != null) return;
    tronWeb = new TronWeb(
        fullNode = new HttpProvider(config.tronConfig.url_full, config.tronConfig.http_timeout),
        solidityNode = new HttpProvider(config.tronConfig.url_solidity, config.tronConfig.http_timeout),
        eventServer = config.tronConfig.url_event,
        privateKey = config.tronConfig.defaultPk
    );

    tronWeb.setDefaultBlock('latest');

    // const nodes = await tronWeb.isConnected();
    // console.log(nodes);
    // const connected = !Object.entries(nodes).map(([name, connected]) => {
    //     if (!connected)
    //         console.error(`Error: ${name} is not connected`);

    //     return connected;
    // }).includes(false);

    // if (!connected) {
    //     throw new Error("TronWeb init fail !!!");
    // }

    let connected = await tronWeb.fullNode.isConnected();
    if (connected === true) {
        console.log("TronWeb init success !!!");
    } else {
        console.log("TronWeb init fail !!!");
    }
}

//Tron full node 查询
const _fun_tronQuery = "tronQuery";
async function tronQuery(contractAddr, fun_code, params = [], _callback) {
    //callback 或 promise
    if (!_callback) return injectPromise(tronQuery, contractAddr, fun_code, params);

    //参数校验
    if (!_.isString(contractAddr) || !TronWeb.isAddress(contractAddr)) {
        return _callback(_fun_tronQuery + " -> " + fun_code + " -> Invalid contract address provided !!!", null);
    }
    if (!_.isString(fun_code) || _.isEmpty(fun_code)) {
        return _callback(_fun_tronQuery + " -> " + fun_code + " -> Invalid function code provided !!!", null);
    }
    if (!_.isArray(params)) {
        return _callback(_fun_tronQuery + " -> " + fun_code + " -> Invalid function param provided !!!", null);
    }

    //执行业务流程
    tronWeb.transactionBuilder.triggerSmartContract(contractAddr, fun_code, 1, 0, params)
        .then((result) => {
            if (result && result.result.result === true) {
                // console.log("bbb",result.constant_result);
                let hexStr = result.constant_result[0];
                if (_.isEmpty(hexStr)) {
                    return _callback(_fun_tronQuery + " -> " + fun_code + " -> result is empty !!!", null);
                }
                return _callback(null, hexStr);
            } else {
                return _callback(_fun_tronQuery + " -> " + fun_code + " -> get result fail !!!", null);
            }
        }).catch((e) => {
            return _callback(_fun_tronQuery + " -> " + fun_code + " -> exec error !!!" + e, null);
        });
}

//Tron full node 执行
const _fun_tronExec = "tronExec";
async function tronExec(contractAddr, fun_code, fee = 1, callVal = 0, params = [], privateKey, _callback) {
    //参数修正
    if (_.isFunction(privateKey)) {
        _callback = privateKey;
    }

    //callback 或 promise
    if (!_callback) return injectPromise(tronExec, contractAddr, fun_code, fee, callVal, params, privateKey);

    //参数校验
    if (!_.isString(contractAddr) || !TronWeb.isAddress(contractAddr)) {
        return _callback(_fun_tronExec + " -> " + fun_code + " -> Invalid contract address provided !!!", null);
    }
    if (!_.isString(fun_code) || _.isEmpty(fun_code)) {
        return _callback(_fun_tronExec + " -> " + fun_code + " -> Invalid function code provided !!!", null);
    }
    if (!_.isArray(params)) {
        return _callback(_fun_tronExec + " -> " + fun_code + " -> Invalid function param provided !!!", null);
    }

    //设置私钥
    if (!_.isEmpty(privateKey)) tronWeb.setPrivateKey(privateKey);

    //执行业务流程
    tronWeb.transactionBuilder.triggerSmartContract(contractAddr, fun_code, fee, callVal, params)
        .then((transaction) => {
            let tx = transaction.transaction;
            return tronWeb.trx.sign(tx, privateKey);
        }).then((signData) => {
            return tronWeb.trx.sendRawTransaction(signData);
        }).then((result) => {
            if (result != null) {
                return _callback(null, result);
            } else {
                return _callback(_fun_tronExec + " -> " + fun_code + " -> result is empty !!!", null);
            }
        }).catch((e) => {
            return _callback(_fun_tronExec + " -> " + fun_code + " -> exec error !!! WTF !!!" + e, null);
        });
}

//Tron 交易是否成功
const _fun_isTxSuccess = "isTxSuccess";
async function isTxSuccess(tx_id, _callback) {
    //callback 或 promise
    if (!_callback) return injectPromise(isTxSuccess, tx_id);

    //参数校验
    if (_.isEmpty(tx_id)) {
        return _callback(_fun_isTxSuccess + " -> Invalid tx_id provided !!!", null);
    };

    //执行业务流程
    tronWeb.fullNode.request('wallet/gettransactionbyid', { "value": tx_id }, 'post').then((result) => {
        if (result != null && result.ret != null && result.ret[0].contractRet != null) {
            if (result.ret[0].contractRet === "SUCCESS") {
                return _callback(null, true);
            } else {
                // console.log("TX -> FAIL", result.ret[0].contractRet);
                // console.log(result);
                return _callback(null, false);
            }
        } else {
            // return _callback(_fun_isTxSuccess + " -> cant not found the tx !!!'", null);
            _callback(null, null);
        }
    }).catch((e) => {
        return _callback(_fun_isTxSuccess + " -> exec error !!!" + e, null);
    });
}

//Tron 查询账号
const _fun_getAccount = "getAccount";
async function getAccount(addr, _callback) {
    //callback 或 promise
    if (!_callback) return injectPromise(getAccount, addr);

    //参数校验
    if (_.isEmpty(addr)) {
        return _callback(_fun_getAccount + " -> Invalid address provided !!!", null);
    };

    //执行业务流程
    let hexAddr = TronWeb.address.toHex(addr);
    tronWeb.fullNode.request('wallet/getaccount', { "address": hexAddr }, 'post').then((result) => {
        if (result != null && result.account_name != null) {
            result.account_name = hextoString(result.account_name);
        }
        return _callback(null, result);
    }).catch((e) => {
        return _callback(_fun_getAccount + " -> exec error !!! WTF !!!" + e, null);
    });
}

//发送TRX
const _fun_sendTrx = "sendTrx";
async function sendTrx(addr, amount_sun, privateKey, _callback) {
    //参数修正
    if (_.isFunction(privateKey)) {
        _callback = privateKey;
    }

    //callback 或 promise
    if (!_callback) return injectPromise(sendTrx, addr, amount_sun, privateKey);

    //参数校验
    if (_.isEmpty(addr)) {
        return _callback(_fun_sendTrx + " -> Invalid address provided !!!", null);
    };

    if (amount_sun < 0.000001) {
        return _callback(_fun_sendTrx + " -> Invalid amount provided !!!", null);
    };

    //执行业务流程
    let from_addr = TronWeb.address.fromPrivateKey(privateKey);
    tronWeb.transactionBuilder.sendTrx(addr, amount_sun,from_addr)
        .then((transaction) => {
            return tronWeb.trx.sign(transaction, privateKey);
        }).then((signData) => {
            return tronWeb.trx.sendRawTransaction(signData);
        }).then((result) => {
            if (result != null) {
                return _callback(null, result);
            } else {
                return _callback(_fun_sendTrx + " -> result is empty !!!", null);
            }
        }).catch((e) => {
            return _callback(_fun_sendTrx + " -> exec error !!! WTFFFF !!!" + e, null);
        });
}

//获取当前区块数据
const _fun_getNowBlock = "getNowBlock";
async function getNowBlock(_callback) {
    //callback 或 promise
    if (!_callback) return injectPromise(getNowBlock);

    //执行业务流程
    tronWeb.fullNode.request("wallet/getnowblock", {}, 'post').then((result) => {
        return _callback(null, result);
    }).catch((e) => {
        return _callback(_fun_getNowBlock + " -> exec error !!! WTF !!!" + e, null);
    });
}

//获取指定区块数据
const _fun_getBlockByNum = "getBlockByNum";
async function getBlockByNum(block_number, _callback) {
    //参数修正
    if (_.isFunction(block_number)) {
        _callback = block_number;
    }

    //callback 或 promise
    if (!_callback) return injectPromise(getBlockByNum, block_number);

    //参数校验
    if (!_.isNumber(block_number) || _.isNaN(block_number)) {
        return _callback(_fun_getAccount + " -> Invalid block_number provided !!!", null);
    };

    //执行业务流程
    tronWeb.fullNode.request("wallet/getblockbynum", { "num": block_number }, 'post').then((result) => {
        return _callback(null, result);
    }).catch((e) => {
        return _callback(_fun_getBlockByNum + " -> url:" + url + " -> exec error !!! WTF !!!" + e, null);
    });
}

//十六进制字符串转Tron账号
function hexStringToTronAddress(_hexStr) {
    return TronWeb.address.fromHex('41' + _hexStr);
}

//十六进制字符串转BigNumber
function hexStringToBigNumber(_hexStr) {
    return new BigNumber(_hexStr, 16);
}

//十六进制字符串转地址数组
function getAddressArr(data, _startIndex) {
    let addressArr = new Array();
    let startIndex = _startIndex;
    let arrLen = hexStringToBigNumber(data.substr(startIndex, 64)).toNumber();
    startIndex = startIndex + 64;
    for (let idx = 0; idx < arrLen; idx++) {
        addressArr.push(hexStringToTronAddress(data.substr(startIndex + idx * 64 + 24, 40)));
    }
    let _endIndex = _startIndex + (arrLen + 1) * 64;
    return [addressArr, _endIndex]
}

//十六进制字符串转uint256数组
function getUint256Arr(data, _startIndex) {
    let uint256Arr = new Array();
    let startIndex = _startIndex;
    let arrLen = hexStringToBigNumber(data.substr(startIndex, 64)).toNumber();
    startIndex = startIndex + 64;
    for (let idx = 0; idx < arrLen; idx++) {
        uint256Arr.push(hexStringToBigNumber(data.substr(startIndex + idx * 64, 64)).toNumber());
    }
    let _endIndex = _startIndex + (arrLen + 1) * 64;
    return [uint256Arr, _endIndex]
}

//十六进制转明文字符串
function hextoString(hex) {
    const arr = hex.split('');
    let out = '';
    for (let i = 0; i < arr.length / 2; i++) {
        let tmp = `0x${arr[i * 2]}${arr[i * 2 + 1]}`;
        out += String.fromCharCode(tmp);
    }
    return out;
}

module.exports.init = init;
module.exports.tronQuery = tronQuery;
module.exports.tronExec = tronExec;
module.exports.isTxSuccess = isTxSuccess;
module.exports.getNowBlock = getNowBlock;
module.exports.getBlockByNum = getBlockByNum;
module.exports.getAccount = getAccount;
module.exports.sendTrx = sendTrx;
module.exports.hexStringToTronAddress = hexStringToTronAddress;
module.exports.hexStringToBigNumber = hexStringToBigNumber;
module.exports.hextoString = hextoString;
module.exports.getAddressArr = getAddressArr;
module.exports.getUint256Arr = getUint256Arr;
module.exports.isAddress = TronWeb.isAddress;
module.exports.fromHex = TronWeb.address.fromHex;
module.exports.toHex = TronWeb.address.toHex;
module.exports.fromPrivateKey = TronWeb.address.fromPrivateKey;