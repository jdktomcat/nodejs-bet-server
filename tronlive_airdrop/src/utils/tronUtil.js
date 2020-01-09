const TronWeb = require('tronweb');
const _ = require("lodash")._;
const BigNumber = require('bignumber.js');
const tronConfig = require('../configs/config').tronConfig

let tronNodes = {
    master : new TronWeb(
        tronConfig.masterFullNode,
        tronConfig.masterSolidityNode,
        tronConfig.masterEventNode,
        tronConfig.privateKey,
    ),
    slave : new TronWeb(
        tronConfig.slaveFullNode,
        tronConfig.slaveSolidityNode,
        tronConfig.slaveEventNode,
        tronConfig.privateKey,
    )
}

function getTronWeb(node) {

    node = node || 'master'
    let result = tronNodes[node]

    if (_.isEmpty(result)) return null

    if (result.isConnected()) return result
    
    console.log('check tronweb connected failed, need to reload')
    return result
}

async function sendToken(toAddr, amount, tokenId) {
    let tronWeb = getTronWeb('master')
    let unsignedTransaction = await tronWeb.transactionBuilder.sendToken(toAddr, amount, tokenId);
    let signdata = await tronWeb.trx.sign(unsignedTransaction, tronConfig.privateKey);
    let result = await tronWeb.trx.sendRawTransaction(signdata)
    return result
}

async function verifySignature(signature, address) {
    let msg = TronWeb.toHex('tronbet').substring(2);
    let tronWeb =  getTronWeb('master')
    try {
        let result = await tronWeb.trx.verifyMessage(msg, signature, address)
        return result
    } catch (error) {
        console.log(error)
        return false
    }
}

async function tronExec(contractAddr, fun_code, fee, callVal, params) {
    let tronWeb = getTronWeb('master')
    console.log(contractAddr, fun_code, fee, callVal, params)
    let unsignedTransaction = await tronWeb.transactionBuilder.triggerSmartContract(contractAddr, fun_code, fee, callVal, params)
    // console.log(unsignedTransaction)
    let signdata = await tronWeb.trx.sign(unsignedTransaction.transaction, tronConfig.privateKey);
    let result = await tronWeb.trx.sendRawTransaction(signdata)
    return result
}

async function tronQuery(contractAddr, fun_code, fee, callVal, params) {
    let tronWeb = getTronWeb('master')
    // console.log(contractAddr, fun_code, fee, callVal, params)
    let result = await tronWeb.transactionBuilder.triggerSmartContract(contractAddr, fun_code, fee, callVal, params)
    // console.log(result)
    if (result.result.result == true && result.constant_result) {
        return result.constant_result[0]
    }
    return null
}

async function isTxSuccesssed(txId) {
    let tronWeb =  getTronWeb('master')
    let result = await tronWeb.trx.getTransaction(txId)

    console.log('result.ret[0].contractRet------>', result.ret)
    if (result != null && result.ret != null && result.ret[0].contractRet != null && result.ret[0].contractRet === "SUCCESS"){
        return true
    }
    return false
}


async function isTxConfirmed(txId) {
    let tronWeb =  getTronWeb('master')
    let result = await tronWeb.trx.getConfirmedTransaction(txId).catch((err) => {
        return false
    })
    console.log('result.ret[0].contractRet------>', result.ret)
    if (result != null && result.ret != null && result.ret[0].contractRet != null && result.ret[0].contractRet === "SUCCESS"){
        return true
    }
    return false
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

//十六进制字符串转数组
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


function getConfirmedBlockInfoByNum(blockNum, nodeName) {
    return new Promise((resolve, reject) => {
        let tronWeb = getTronWeb(nodeName);
        if (tronWeb == null) {
            reject('tronweb null')
        }
        tronWeb.solidityNode.request('walletsolidity/getblockbynum', { "num": blockNum }, 'post').then((result) => {
            resolve(result)
        }).catch( err => {
            reject(err)
        })
    }).catch(error => {
        console.error(error)
    })
}

async function getTransactionInfo(txId) {
    let tronWeb =  getTronWeb('master')
    return await tronWeb.trx.getTransactionInfo(txId)
}

async function getPlayerLiveCache(address) {
    let result = await tronQuery(tronConf.livePoolAddr,'getPlayerLiveCache(address)', 5e6, 0, [{type : 'address', value : address}]).catch((err) => {
        console.log(err)
        return
    })
    if (!result) {
        return 0
    }
    return hexStringToBigNumber(result.substr(96, 32)).toNumber()
}

const utils = {
    sendToken, 
    verifySignature, 
    tronExec,
    tronQuery,
    isTxSuccesssed,
    hexStringToTronAddress,
    hexStringToBigNumber,
    getCompxArr,
    getConfirmedBlockInfoByNum,
    getTransactionInfo,
    getPlayerLiveCache,
    isTxConfirmed,
}

module.exports = utils