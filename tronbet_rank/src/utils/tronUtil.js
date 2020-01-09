const TronWeb = require('tronweb');
const HttpProvider = TronWeb.providers.HttpProvider;
const _ = require("lodash")._;
const BigNumber = require('bignumber.js');
const utilCommon = require('./utilCommon');
const injectPromise = utilCommon.injectPromise;
const config = require('../configs/config');
const tronWeb = new TronWeb(
    fullNode = new HttpProvider(config.tronConfig.url_full, config.tronConfig.http_timeout),
    solidityNode = new HttpProvider(config.tronConfig.url_solidity, config.tronConfig.http_timeout),
    eventServer = config.tronConfig.url_event,
    privateKey = config.tronConfig.defaultPk
);

//Tron full node 查询
function tronQuery(contractAddr, fun_code, params = [], privateKey = "", _callback) {
    const _fun = "tronQuery";
    //参数修正
    if (_.isFunction(privateKey)) {
        _callback = privateKey;
        privateKey = "";
    }

    //callback 或 promise
    if (!_callback) return injectPromise(tronQuery, contractAddr, fun_code, params, privateKey);

    //参数校验
    if (!_.isString(contractAddr) || !TronWeb.isAddress(contractAddr)) {
        return _callback(_fun + " -> " + fun_code + " -> Invalid contract address provided !!!", null);
    }
    if (!_.isString(fun_code) || _.isEmpty(fun_code)) {
        return _callback(_fun + " -> " + fun_code + " -> Invalid function code provided !!!", null);
    }
    if (!_.isArray(params)) {
        return _callback(_fun + " -> " + fun_code + " -> Invalid function param provided !!!", null);
    }

    if (tronWeb == null) {
        return _callback(_fun + " -> " + fun_code + " -> tronweb is empty !!!", null);
    }

    //执行业务流程
    tronWeb.transactionBuilder.triggerSmartContract(contractAddr, fun_code, 1, 0, params)
        .then((result) => {
            if (result && result.result.result === true) {
                // console.log("bbb",result.constant_result);
                let hexStr = result.constant_result[0];
                if (_.isEmpty(hexStr)) {
                    return _callback(_fun + " -> " + fun_code + " -> result is empty !!!", null);
                }
                return _callback(null, hexStr);
            } else {
                return _callback(_fun + " -> " + fun_code + " -> get result fail !!!", null);
            }
        }).catch((e) => {
            return _callback(_fun + " -> " + fun_code + " -> exec error !!! WTF !!!" + e, null);
        });
}

//Tron full node 执行
function tronExec(contractAddr, fun_code, fee = 1, callVal = 0, params = [], privateKey, _callback) {
    const _fun = "tronExec";
    //参数修正
    if (_.isFunction(privateKey)) {
        _callback = privateKey;
        privateKey = "";
    }

    //callback 或 promise
    if (!_callback) return injectPromise(tronExec, contractAddr, fun_code, fee, callVal, params, privateKey);

    //参数校验
    if (!_.isString(contractAddr) || !TronWeb.isAddress(contractAddr)) {
        return _callback(_fun + " -> Invalid contract address provided !!!", null);
    }
    if (!_.isString(fun_code) || _.isEmpty(fun_code)) {
        return _callback(_fun + " -> Invalid function code provided !!!", null);
    }
    if (!_.isArray(params)) {
        return _callback(_fun + " -> Invalid function param provided !!!", null);
    }

    if (tronWeb == null) {
        return _callback(_fun + " -> tronweb is empty !!!", null);
    }

    //设置私钥
    if (!_.isEmpty(privateKey)) tronWeb.setPrivateKey(privateKey);
    //执行业务流程
    tronWeb.transactionBuilder.triggerSmartContract(contractAddr, fun_code, fee, callVal, params)
        .then((transaction) => {
            return tronWeb.trx.sign(transaction.transaction);
        }).then((signData) => {
            // console.log("signData", signData);
            return tronWeb.trx.sendRawTransaction(signData);
        }).then((result) => {
            // console.log(result);
            if (result != null) {
                return _callback(null, result);
            } else {
                return _callback(_fun + " -> result is empty !!!", null);
            }
        }).catch((e) => {
            return _callback(_fun + " -> exec error !!! WTF !!!" + e, null);
        });
}

//签名交易
function signTransaction(_transaction, _privateKey) {
    return tronWeb.fullNode.request('/wallet/gettransactionsign', {
        transaction: _transaction,
        privateKey: _privateKey
    }, 'post')
}

//Tron 交易是否成功
function isTxSuccess(tx_id, privateKey, _callback) {
    const _fun = "isTxSuccess";
    //参数修正
    if (_.isFunction(privateKey)) {
        _callback = privateKey;
    }

    //callback 或 promise
    if (!_callback) return injectPromise(isTxSuccess, tx_id, privateKey);

    //参数校验
    if (_.isEmpty(tx_id)) {
        return _callback(_fun + " -> Invalid tx_id provided !!!", null);
    };

    if (tronWeb == null) {
        return _callback(_fun + " -> tronweb is empty !!!", null);
    }

    //执行业务流程
    tronWeb.fullNode.request('wallet/gettransactionbyid', { "value": tx_id }, 'post').then((result) => {
        // console.log("wallet/gettransactionbyid -> result",result);
        if (result != null && result.ret != null && result.ret[0].contractRet != null) {
            if (result.ret[0].contractRet === "SUCCESS") {
                return _callback(null, true);
            } else {
                return _callback(null, false);
            }
        } else {
            // return _callback(_fun +" -> result is empty !!!", null);
            return _callback(null, null);
        }
    }).catch((e) => {
        return _callback(_fun + " -> exec error !!! WTF !!!" + e, null);
    });
}

//Tron 从 SolidityNode 查询交易是否成功
function isTxSuccessBySolidityNode(tx_id, privateKey, _callback) {
    const _fun = "isTxSuccessBySolidityNode";
    //参数修正
    if (_.isFunction(privateKey)) {
        _callback = privateKey;
    }

    //callback 或 promise
    if (!_callback) return injectPromise(isTxSuccess, tx_id, privateKey);

    //参数校验
    if (_.isEmpty(tx_id)) {
        return _callback(_fun + " -> Invalid tx_id provided !!!", null);
    };

    if (tronWeb == null) {
        return _callback(_fun + " -> tronweb is empty !!!", null);
    }

    //执行业务流程
    tronWeb.solidity.request('walletsolidity/gettransactionbyid', { "value": tx_id }, 'post').then((result) => {
        // console.log("wallet/gettransactionbyid -> result",result);
        if (result != null && result.ret != null && result.ret[0].contractRet != null) {
            if (result.ret[0].contractRet === "SUCCESS") {
                return _callback(null, true);
            } else {
                return _callback(null, false);
            }
        } else {
            // return _callback(_fun +" -> result is empty !!!", null);
            return _callback(null, false);
        }
    }).catch((e) => {
        return _callback(_fun + " -> exec error !!! WTF !!!" + e, null);
    });
}

//Tron 查询账号
function getAccount(addr, privateKey, _callback) {
    const _fun = "getAccount";
    //参数修正
    if (_.isFunction(privateKey)) {
        _callback = privateKey;
    }

    //callback 或 promise
    if (!_callback) return injectPromise(getAccount, addr, privateKey);

    //参数校验
    if (_.isEmpty(addr)) {
        return _callback(_fun + " -> Invalid address provided !!!", null);
    };

    if (tronWeb == null) {
        return _callback(_fun + " -> tronweb is empty !!!", null);
    }

    //执行业务流程
    let hexAddr = TronWeb.address.toHex(addr);
    tronWeb.fullNode.request('wallet/getaccount', { "address": hexAddr }, 'post').then((result) => {
        if (result != null && result.account_name != null) {
            result.account_name = hextoString(result.account_name);
        }
        return _callback(null, result);
    }).catch((e) => {
        return _callback(_fun + " -> exec error !!! WTF !!!" + e, null);
    });
}

//发送TRX
function sendTrx(addr, amount, privateKey, _callback) {
    const _fun = "getAccount";
    //参数修正
    if (_.isFunction(privateKey)) {
        _callback = privateKey;
    }

    //callback 或 promise
    if (!_callback) return injectPromise(sendTrx, addr, amount, privateKey);

    //参数校验
    if (_.isEmpty(addr)) {
        return _callback(_fun + " -> Invalid address provided !!!", null);
    };

    if (tronWeb == null) {
        return _callback(_fun + " -> tronweb is empty !!!", null);
    }

    //执行业务流程
    tronWeb.transactionBuilder.sendTrx(addr, amount)
        .then((transaction) => {
            if (privateKey) {
                let _t = transaction.raw_data.contract[0];
                let _addressHex = TronWeb.address.toHex(TronWeb.address.fromPrivateKey(privateKey));
                _t.parameter.value.owner_address = _addressHex;
                return signTransaction(transaction, privateKey);
            } else {
                return signTransaction(transaction, tronWeb.defaultPrivateKey);
            }
        }).then((signData) => {
            return tronWeb.trx.sendRawTransaction(signData);
        }).then((result) => {
            if (result != null) {
                return _callback(null, result);
            } else {
                return _callback(_fun + " -> result is empty !!!", null);
            }
        }).catch((e) => {
            return _callback(_fun + " -> exec error !!! WTFFFF !!!" + e, null);
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

module.exports.tronQuery = tronQuery;
module.exports.tronExec = tronExec;
module.exports.isTxSuccess = isTxSuccess;
module.exports.hexStringToTronAddress = hexStringToTronAddress;
module.exports.hexStringToBigNumber = hexStringToBigNumber;
module.exports.getAddressArr = getAddressArr;
module.exports.getUint256Arr = getUint256Arr;
module.exports.hextoString = hextoString;
module.exports.getAccount = getAccount;
module.exports.sendTrx = sendTrx;
module.exports.isTxSuccessBySolidityNode = isTxSuccessBySolidityNode;