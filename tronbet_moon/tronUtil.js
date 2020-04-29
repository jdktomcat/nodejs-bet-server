const TronWeb = require('tronweb');
const _ = require("lodash")._;
const BigNumber = require('bignumber.js');
const tronNodePool = require('./src/service/tronNodePool');
const utilCommon = require('./src/utils/utilCommon');
const injectPromise = utilCommon.injectPromise;
const getTronWeb = tronNodePool.getTronWeb;

//Tron full node 查询
function tronQuery(contractAddr, fun_code, params = [], nodeName = "default", privateKey = "", _callback) {
    const _fun = "tronQuery";
    //参数修正
    if (_.isFunction(privateKey)) {
        _callback = privateKey;
        privateKey = "";
    }
    if (_.isFunction(nodeName)) {
        _callback = nodeName;
        nodeName = "default";
        privateKey = "";
    }

    //callback 或 promise
    if (!_callback) return injectPromise(tronQuery, contractAddr, fun_code, params, nodeName, privateKey);

    //参数校验
    if (!_.isString(contractAddr) || !TronWeb.isAddress(contractAddr)) {
        return _callback(_fun + " using " + nodeName + " node -> Invalid contract address provided !!!", null);
    }
    if (!_.isString(fun_code) || _.isEmpty(fun_code)) {
        return _callback(_fun + " using " + nodeName + " node -> Invalid function code provided !!!", null);
    }
    if (!_.isArray(params)) {
        return _callback(_fun + " using " + nodeName + " node -> Invalid function param provided !!!", null);
    }

    //获取tronweb
    let tronWeb = getTronWeb(nodeName);
    if (tronWeb == null) {
        return _callback(_fun + " using " + nodeName + " node -> tronweb is empty !!!", null);
    }
    nodeName = tronWeb.name;

    //设置私钥
    if (!_.isEmpty(privateKey)) tronWeb.setPrivateKey(privateKey);

    //执行业务流程
    tronWeb.transactionBuilder.triggerSmartContract(contractAddr, fun_code, 1, 0, params)
        .then((result) => {
            if (result && result.result.result === true) {
                let hexStr = result.constant_result[0];
                if (_.isEmpty(hexStr)) {
                    return _callback(_fun + " using " + nodeName + " node -> result is empty !!!", null);
                }
                return _callback(null, hexStr);
            } else {
                return _callback(_fun + " using " + nodeName + " node -> get result fail !!!", null);
            }
        }).catch((e) => {
            return _callback(_fun + " using " + nodeName + " node -> exec error !!! WTF !!!" + e, null);
        });
}

//Tron full node 执行
function tronExec(contractAddr, fun_code, fee = 1, callVal = 0, params = [], nodeName, privateKey, _callback) {
    const _fun = "tronExec";
    //参数修正
    if (_.isFunction(privateKey)) {
        _callback = privateKey;
        privateKey = "";
    }
    if (_.isFunction(nodeName)) {
        _callback = nodeName;
        nodeName = "default";
        privateKey = "";
    }
    //callback 或 promise
    if (!_callback) return injectPromise(tronExec, contractAddr, fun_code, fee, callVal, params, nodeName, privateKey);

    //参数校验
    if (!_.isString(contractAddr) || !TronWeb.isAddress(contractAddr)) {
        return _callback(_fun + " using " + nodeName + " node -> Invalid contract address provided !!!", null);
    }
    if (!_.isString(fun_code) || _.isEmpty(fun_code)) {
        return _callback(_fun + " using " + nodeName + " node -> Invalid function code provided !!!", null);
    }
    if (!_.isArray(params)) {
        return _callback(_fun + " using " + nodeName + " node -> Invalid function param provided !!!", null);
    }

    //获取tronweb
    let tronWeb = getTronWeb(nodeName);
    if (tronWeb == null) {
        return _callback(_fun + " using " + nodeName + " node -> tronweb is empty !!!", null);
    }
    nodeName = tronWeb.name;

    //设置私钥
    if (!_.isEmpty(privateKey)) tronWeb.setPrivateKey(privateKey);

    //执行业务流程
    tronWeb.transactionBuilder.triggerSmartContract(contractAddr, fun_code, fee, callVal, params)
        .then((transaction) => {
            return tronWeb.trx.sign(transaction.transaction);
        }).then((signData) => {
            console.log("signData is: ", signData);
            return tronWeb.trx.sendRawTransaction(signData);
        }).then((result) => {
            console.log("broadcast data is: ",result);
            if (result != null) {
                return _callback(null, result);
            } else {
                return _callback(_fun + " using " + nodeName + " node -> result is empty !!!", null);
            }
        }).catch((e) => {
            return _callback(_fun + " using " + nodeName + " node -> exec error !!! WTF !!!" + e, null);
        });
}

//Tron 交易是否成功
function isTxSuccess(tx_id, nodeName = "", _callback) {
    const _fun = "isTxSuccess";
    if (_.isFunction(nodeName)) {
        _callback = nodeName;
        nodeName = "default";
    }

    //callback 或 promise
    if (!_callback) return injectPromise(isTxSuccess, tx_id, nodeName);

    //参数校验
    if (_.isEmpty(tx_id)) {
        return _callback(_fun + " -> Invalid tx_id provided !!!", null);
    };

    //获取tronweb
    let tronWeb = getTronWeb(nodeName);
    if (tronWeb == null) {
        return _callback(_fun + " using " + nodeName + " node -> tronweb is empty !!!", null);
    }
    nodeName = tronWeb.name;

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
            // return _callback(_fun + " -> cant not found the tx !!!'", null);
            _callback(null, null);
        }
    }).catch((e) => {
        return _callback(_fun + " -> exec error !!!" + e, null);
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

//TODO:getnowblock
//TODO:getblocknum
//TODO:getaccount
//TODO:sendtrx