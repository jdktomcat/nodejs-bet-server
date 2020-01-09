const TronWeb = require('tronweb');
const HttpProvider = TronWeb.providers.HttpProvider;
const BigNumber = require('bignumber.js');
let tron_url_full_main = 'https://super.guildchat.io';
let tron_url_solidity_main = 'https://api.trongrid.io';
let tron_url_event_main = 'https://api.trongrid.io/';
let tron_url_full_test = 'https://testapi.trondapps.org:8090';
let tron_url_solidity_test = 'https://testapi.trondapps.org:8091';
let tron_url_event_test = 'https://testapi.trondapps.org/';

const randomMain = "41d8f55f2d6d3ee15785069337efa604c9f5e7cc38";
const randomTest = "41f821e2d66cba976161b0bf59b59cc1e1723a05dd";
const tronBetMain = "41b8d1e2ee0e2db184a5096865751f75319b840956";
const tronBetTest = "41d60aa6683eb2ed03c66463df7452e3163ca87b77";
const defaultPK = '';
console.log("bbbbbbbbbbbbb",TronWeb.address.toHex("TGKpnHx8RrnmFdJ27Cc4aqV7CH329RqFs5"));
const tronWeb = new TronWeb(
    fullNode = new HttpProvider(tron_url_full_main),
    solidityNode = new HttpProvider(tron_url_solidity_main),
    eventServer = tron_url_event_main,
    privateKey = defaultPK
);

const tronWebTest = new TronWeb(
    fullNode = new HttpProvider(tron_url_full_test),
    solidityNode = new HttpProvider(tron_url_solidity_test),
    eventServer = tron_url_event_test,
    privateKey = false
);


function hextoString(hex) {
    const arr = hex.split('');
    let out = '';
    for (let i = 0; i < arr.length / 2; i++) {
        let tmp = `0x${arr[i * 2]}${arr[i * 2 + 1]}`;
        out += String.fromCharCode(tmp);
    }
    return out;
}
let x  = "4e6f7420656e6f75676820656e6572677920666f722027505553483127206f7065726174696f6e20657865637574696e673a20637572496e766f6b65456e657267794c696d69745b305d2c206375724f70456e657267795b335d2c2075736564456e657267795b305d"

console.log(hextoString(x));
// getaccountresource();

function getaccountresource(txID) {
    let defaultPK = '';
    let address = TronWeb.address.fromPrivateKey(defaultPK);
    let addr = TronWeb.address.fromHex(address)
    console.log(address);
    tronWeb.fullNode.request('wallet/getaccountresource', { "address": address }, 'post').then((result) => {
        console.log(result);
        // let ret = result.ret[0].contractRet;
        // let txID = result.txID;
        // let raw_data = result.raw_data;
        // let contract = raw_data.contract[0];
        // let value = contract.parameter.value;
        // console.log("执行结果", ret)
        // console.log("交易ID:", result.txID);
        // console.log("打包时间", raw_data.expiration);
        // console.log("提交时间", raw_data.timestamp);
        // console.log("调用者", value.owner_address);
        // console.log("调用合约", value.contract_address);
        // console.log("交易类型", contract.type);
        // console.log("data", value.data);
        // return {
        //     txID: txID,
        //     expiration: raw_data.expiration,
        //     timestamp: raw_data.timestamp,
        //     owner_address: contract.parameter.value.owner_address,
        //     contract_address: contract.parameter.value.contract_address,
        //     type: contract.type,
        //     data: txID,
        // }
    }).catch((err) => {

    });
}

function getTransactionByIdFromTestNet(txID) {
    tronWebTest.fullNode.request('wallet/gettransactionbyid', { "value": txID }, 'post').then((result) => {
        console.log(result);

        console.log("\n\n\n")

        let ret = result.ret;
        let txID = result.txID;
        let raw_data = result.raw_data;
        let contract = raw_data.contract[0];
        console.log(contract)
        let value = contract.parameter.value;
        console.log("txID:", result.txID);
        console.log("打包时间", raw_data.expiration);
        console.log("提交时间", raw_data.timestamp);
        console.log("调用者", value.owner_address);
        console.log("调用合约", value.contract_address);
        console.log("交易类型", contract.type);
        console.log("data", value.data);

        return {
            txID: txID,
            expiration: raw_data.expiration,
            timestamp: raw_data.timestamp,
            owner_address: contract.parameter.value.owner_address,
            contract_address: contract.parameter.value.contract_address,
            type: contract.type,
            data: txID,
        }
    }).catch((err) => {

    });
}

function getTransactionInfoByIdFromMainNet(txID) {
    return tronWeb.solidityNode.request('walletsolidity/gettransactioninfobyid', { "value": txID }, 'post').then((res) => {
        return res;
    }).catch((err) => {

    });
}

function getTransactionInfoByIdFromTestNet(txID) {
    tronWebTest.solidityNode.request('walletsolidity/gettransactioninfobyid', { "value": txID }, 'post').then((res) => {
        return res;
    }).catch((err) => {

    });
}

// getTransactionInfoByIdFromMainNet("3f9876ac892cc3f6410f73b9579b1001c2e4911e9a95c0e99c89cfc58363a897").then((res => {
//     return getEventDiceResult(res);
// }));

//十六进制字符串转Tron账号
function hexStringToTronAddress(_hexStr) {
    return TronWeb.address.fromHex('41' + _hexStr);
}

//十六进制字符串转BigNumber
function hexStringToBigNumber(_hexStr) {
    return new BigNumber(_hexStr, 16);
}


function getEventDiceResult(res) {
    let data = {
        txID: res.id,
        blockNumber: res.blockNumber,
        blockTimeStamp: res.blockTimeStamp,
        contract_address: res.contract_address,
        result: res.receipt.result,
        energy_usage_total: res.receipt.energy_usage_total,
        net_fee: res.receipt.net_fee
    }
    let hexTopics = res.log[0].topics
    let hexData = res.log[0].data;
    data.log = {
        _orderId: hexStringToBigNumber(hexTopics[1]).toNumber(),//0+64 = 64
        _bettor: hexStringToTronAddress(hexTopics[2].substr(24, 40)), //64+24+40 = 128
        _mentor: hexStringToTronAddress(hexTopics[3].substr(24, 40)), //128+24+40 = 192
        _number: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(), //192 + 16 = 208
        _direction: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(), //208+16 = 224
        _amount: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(), //208+64 = 272
        _roll: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(), //272+16 = 288
        _winAmount: hexStringToBigNumber(hexData.substr(256, 64)).toNumber(), //288+64 = 352
        _referralAmount: hexStringToBigNumber(hexData.substr(322, 64)).toNumber(), //352+64 = 416
    }
    console.log(data);
    return data;
}

// getTransactionByIdFromTestNet("d9e4e9f3bf8c5c29be589112ee23fe66a6535d1a2dde0058c423d5d7f1987252");
// getTransactionInfoByIdFromTestNet("3f9876ac892cc3f6410f73b9579b1001c2e4911e9a95c0e99c89cfc58363a897");

let addrHex = TronWeb.address.toHex("TKhr6h3qkUbcPDTRcNgpWV5VhVfLjHDoBC");
console.log(addrHex);
// tronWeb.transactionBuilder.triggerSmartContract('415e3c008d361c63940cbffbf22c04306d42eb1faf', "getOrder(address)", 1, 0, [{ type: "address", value:addrHex }], (err, result) => {
//     if (err) {
//         console.error("WTF!!!!!!!!!!!!!!!!!!!!!!!triggerSmartContract", err);
//         return;
//     };
//     let hexStr = result.constant_result[0];
//     if (_.isEmpty(hexStr)) {
//         console.error("Nothing return");
//         return;
//     }

//     let data = {
//         address: hexStringToTronAddress(hexStr.substr(24, 40)),
//         sunAmount: hexStringToBigNumber(hexStr.substr(64, 64)).toNumber(),
//         orderId: hexStringToBigNumber(hexStr.substr(128, 64)).toNumber(),
//         direction: hexStringToBigNumber(hexStr.substr(192, 64)).toNumber(),
//         number: hexStringToBigNumber(hexStr.substr(256, 64)).toNumber(),
//         roll: hexStringToBigNumber(hexStr.substr(320, 64)).toNumber()
//     }
//     console.log(data);
// });

tronWeb.trx.getCon


async function viewTransaction(contractAddr, functionSelector, callVal, pamarmArray, callback) {
    tronWeb.transactionBuilder.triggerSmartContract(contractAddr, functionSelector, 100000000, callVal,
        pamarmArray,  async (err, transaction) => {
        if(err) { return console.error(err); }
        console.log("-------------viewTransaction: %s--------------", functionSelector)
        console.log(transaction.constant_result);
        if (callback) {
            callback(transaction.constant_result[0]);
        }
    });
}

//viewTransaction('4174e0fdf30d55730765512a052b7ff767f601c84c',"getMaxRainIndex()",0,[]);