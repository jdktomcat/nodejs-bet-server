const TronWeb = require('tronweb');
const _ = require("lodash")._;
const BigNumber = require('bignumber.js');
const tronNodePool = require('./src/service/tronNodePool');
const utilCommon = require('./src/utils/utilCommon');
const injectPromise = utilCommon.injectPromise;
const getTronWeb = tronNodePool.getTronWeb;
const initTronWeb = tronNodePool.init

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
    let tronWeb = getTronWeb();
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
        initTronWeb()
    }

    tronWeb = getTronWeb(nodeName);
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
            // console.log("signData", signData);
            return tronWeb.trx.sendRawTransaction(signData);
        }).then((result) => {
            if (result != null) {
                return _callback(null, result);
            } else {
                return _callback(_fun + " using " + nodeName + " node -> result is empty !!!", null);
            }
        }).catch((e) => {
            return _callback(_fun + " using " + nodeName + " node -> exec error !!! WTF !!!" + e, null);
        });
}

function sleep(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}

async function confirmTxIn2Nodes3Times(tx_id, sleepTimes) {
    if (sleepTimes == null) sleepTimes = 500
    let tryTimes = 3
    let master = 'master'
    let slave = 'slave'
    try {
        for (let i = 0; i < tryTimes; i++){
            let result1 = await isTxSuccess(tx_id, master)
            let result2 = await isTxSuccess(tx_id, slave)
            console.log(result1.ret[0].contractRet, result1.ret[0].contractRet)
            if (result1 != null && result1.ret != null && result1.ret[0].contractRet != null && result1.ret[0].contractRet === "SUCCESS"){
                if (result2 != null && result2.ret != null && result2.ret[0].contractRet != null && result2.ret[0].contractRet === "SUCCESS"){
                    await sleep(sleepTimes)
                    continue
                }
            }
            return false
        }
    } catch (error) {
        return false
    }
    return true
}

//Tron 交易是否成功
function isTxSuccess(tx_id, nodeName) {
    return new Promise((resolve, reject) => {
        let tronWeb = getTronWeb(nodeName);
        if (tronWeb == null) {
            reject('tronweb null')
        }
        tronWeb.fullNode.request('wallet/gettransactionbyid', { "value": tx_id }, 'post').then((result) => {
            resolve(result)
        }).catch( err => {
            reject(err)
        })
    }).catch(error => {
        console.error(error)
    })
}

function getBlockInfoByNum(blockNum, nodeName) {
    return new Promise((resolve, reject) => {
        let tronWeb = getTronWeb(nodeName);
        if (tronWeb == null) {
            reject('tronweb null')
        }
        tronWeb.fullNode.request('wallet/getblockbynum', { "num": blockNum }, 'post').then((result) => {
            resolve(result)
        }).catch( err => {
            reject(err)
        })
    }).catch(error => {
        console.error(error)
    })
}

function gettransactioninfobyid(tx_id, nodeName) {
    return new Promise((resolve, reject) => {
        let tronWeb = getTronWeb(nodeName);
        if (tronWeb == null) {
            reject('tronweb null')
        }
        tronWeb.fullNode.request('wallet/gettransactioninfobyid', { "value": tx_id }, 'post').then((result) => {
            resolve(result)
        }).catch( err => {
            reject(err)
        })
    }).catch(error => {
        console.error(error)
    })
}

//十六进制字符串转Tron账号
function hexStringToTronAddress(_hexStr) {
    if (_hexStr == '0000000000000000000000000000000000000000') return ''
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

//十六进制字符串转地址数组
function getCompxArr(data, _startIndex) {
    let addressArr = new Array();
    let startIndex = _startIndex;
    let arrLen = hexStringToBigNumber(data.substr(startIndex, 64)).toNumber();
    console.log(arrLen)
    startIndex = startIndex + 64;
    for (let idx = 0; idx < arrLen; idx++) {
        addressArr.push(data.substr(startIndex + idx * 64 , 64));
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
module.exports.getCompxArr = getCompxArr;
module.exports.confirmTxIn2Nodes3Times = confirmTxIn2Nodes3Times;

module.exports.gettransactioninfobyid = gettransactioninfobyid;
module.exports.getBlockInfoByNum = getBlockInfoByNum;

//TODO:getnowblock
//TODO:getblocknum
//TODO:getaccount
//TODO:sendtrx