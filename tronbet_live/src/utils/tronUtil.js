const TronWeb = require('tronweb');
const _ = require("lodash")._;
const BigNumber = require('bignumber.js');
const tronConfig = require('../configs/config').tronConfig
const sha3 = require('js-sha3')

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

async function sendTRX(toAddr, amount) {
    let tronWeb = getTronWeb('master')
    let unsignedTransaction = await tronWeb.transactionBuilder.sendToken(toAddr, Math.floor(amount * 1e6));
    let signdata = await tronWeb.trx.sign(result, tronConfig.privateKey);
    let result = await tronWeb.trx.sendRawTransaction(signdata)
    return result
}

async function verifySignature(signature, address) {
    let msg = TronWeb.toHex('tronbet').substring(2);
    let tronWeb =  getTronWeb('master')
    try {
        let result = await tronWeb.trx.verifyMessage(msg, signature, address).catch((err) => {
            console.log(err)
            return false
        })
        return result
    } catch (error) {
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
    console.log(contractAddr, fun_code, fee, callVal, params)
    let result = await tronWeb.transactionBuilder.triggerSmartContract(contractAddr, fun_code, fee, callVal, params)
    return result
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

async function getAccountName(address) {
    try {
        let tronWeb =  getTronWeb('master')
        let res = await tronWeb.trx.getAccount(address).catch((err) => {
            return address
        })
        let name = res.account_name
        if (name == null || name.length < 2) {
            return address
        } else {
            return TronWeb.toUtf8(name)
        }
    } catch (error) {
        console.log(error)
        return address
    }
}

async function sendRankWard(types, round, addr, amount_sun, index) {
    console.log('=======types, round, addr, amount_sun=======>', types, round, addr, amount_sun)
    let result = await tronExec(tronConfig.rankwardAddr, 'sendSlotReward(address,uint256,uint256)', 5e6, 0,[
        {type : 'address', value : addr},
        {type : 'uint256', value : amount_sun},
        {type : 'uint256', value : types * 10000000  +  round * 100 + index},
    ])
    return result
}

function hexStringToBigNumber(_hexStr) {
    return new BigNumber(_hexStr, 16);
}

const utils = {
    sendTRX, 
    verifySignature, 
    tronExec, 
    isTxSuccesssed,
    getAccountName,
    getTronWeb,
    sendRankWard,
    tronQuery,
    hexStringToBigNumber
}

module.exports = utils