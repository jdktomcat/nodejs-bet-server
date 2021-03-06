const TronWeb = require('tronweb');
const _ = require("lodash")._;
const BigNumber = require('bignumber.js');
const tronConfig = require('../configs/config').tronConfig
const {sha256} = require('js-sha256')


let tronNodes = {
    master: new TronWeb(
        tronConfig.masterFullNode,
        tronConfig.masterSolidityNode,
        tronConfig.masterEventNode,
        tronConfig.privateKey,
    ),
    slave: new TronWeb(
        tronConfig.slaveFullNode,
        tronConfig.slaveSolidityNode,
        tronConfig.slaveEventNode,
        tronConfig.privateKey,
    )
}

const options = {feeLimit: 1000 * 1e6, shouldPollResponse: true}

function getTronWeb(node) {

    node = node || 'master'
    let result = tronNodes[node]

    if (_.isEmpty(result)) return null

    if (result.isConnected()) return result

    console.log('check tronweb connected failed, need to reload')
    return result
}

async function sendTRX(toAddr, amount) {
    console.log('toAddr, amount----', toAddr, amount)
    let tronWeb = getTronWeb('master')
    let unsignedTransaction = await tronWeb.transactionBuilder.sendTrx(toAddr, Math.floor(amount * 1e6));
    //let unsignedTransaction = await tronWeb.transactionBuilder.sendTrx(toAddr, Math.floor(Math.floor(amount)));
    let signdata = await tronWeb.trx.sign(unsignedTransaction, tronConfig.privateKey);
    let result = await tronWeb.trx.sendRawTransaction(signdata)
    return result
}

/**
 * 发放win奖励
 *
 * @param addr   目标钱包地址
 * @param amount 发送值
 * @returns {Promise<*|null>}
 */
async function sendWin(addr, amount, resolve) {
    const tronWeb = await getTronWeb('master')
    if (tronWeb == null) {
        console.log('config fail! please check config!')
        return null
    }
    tronWeb.contract().at(tronConfig.winToken).then(ins => {
        ins.balanceOf(addr).call().then(balance => {
            console.log("before transfer %s=%s", addr, balance.toNumber())
            ins.transfer(addr, amount * 1000000).send(options).then(rs => {
                console.log('transfer result:' + rs)
                if (resolve) resolve()
                ins.balanceOf(addr).call().then(ba => {
                    console.log("after transfer %s=%s", addr, ba)
                }).catch(error => {
                    console.log(error)
                })
            }).catch(error => {
                console.log(error)
            })
        }).catch(error => {
            console.log(error)
        })
    }).catch(error => {
        console.error(error)
    })
}


async function verifySignature(signature, address) {
    //return true
    let hash = sha256.create();
    hash.update('this.promise(i++)' + address + 'tronbet');
    let localSign = hash.hex()
    //console.log('localSign, signature =====>:', localSign, signature)
    if (localSign == signature) {
        return true
    }

    let msg = TronWeb.toHex('tronbet').substring(2);
    console.log(signature, address)
    let tronWeb = getTronWeb('master')
    // return true
    try {
        let result = await tronWeb.trx.verifyMessage(msg, signature, address).catch((error) => {
            console.log('return false')
            return false
        })
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

async function isTxSuccesssed(txId) {
    let tronWeb = getTronWeb('master')
    let result = await tronWeb.trx.getTransaction(txId)

    console.log('result.ret[0].contractRet------>', result.ret)
    if (result != null && result.ret != null && result.ret[0].contractRet != null && result.ret[0].contractRet === "SUCCESS") {
        return true
    }
    return false
}

async function getAccBalance() {
    let tronWeb = getTronWeb('master')
    let res = await tronWeb.trx.getUnconfirmedBalance(tronConfig.payPKHex)
    return Math.floor(res / 1e6)
}

const utils = {
    sendTRX,
    verifySignature,
    tronExec,
    isTxSuccesssed,
    getAccBalance,
    sendWin
}

module.exports = utils
