import { think } from 'thinkjs';
var TronWeb = require('tronweb')
var xhr = require('axios')
var _ = require('underscore')._;
var util = require('util')
var BigNumber = require('bignumber.js');
const HttpProvider = TronWeb.providers.HttpProvider;

var fullNode = new HttpProvider(think.config('fullNode'))
var solidityNode = new HttpProvider(think.config('solidityNode'))
var eventServer = think.config('eventServer')
var privateKey = think.config('privateKey')

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey)

export default class extends think.Service {
    tronQuery(contractAddr, fun_code, params, privateKey, _callback) {
        if (_.isEmpty(contractAddr) || _.isEmpty(fun_code)) return;
        params = params || [];
        return new Promise((resolve, reject) => {
            let errMsg = null;
                // console.log("tronWeb ==>", tronWeb);
            if(tronWeb == null) return null;
            if (privateKey != null) tronWeb.setPrivateKey(privateKey);
            tronWeb.transactionBuilder.triggerSmartContract(contractAddr, fun_code, 10, 0, params, (err, result) => {
                if (err) {
                    errMsg = "tronQuery -> result -> error" + err;
                    if (_callback) _callback(errMsg, null);
                    reject(errMsg);
                };
                if (result && result.result.result === true) {
                    let hexStr = result.constant_result[0];
                    if (_.isEmpty(hexStr)) {
                        errMsg = "tronQuery -> result -> empty";
                        if (_callback) _callback(errMsg, null);
                        reject(errMsg);
                    }
                    if (_callback) _callback(null, hexStr);
                    resolve(hexStr);
                } else {
                    errMsg = "tronQuery -> result -> fail";
                    if (_callback) _callback(errMsg, null);
                    reject(errMsg);
                }
            });
        });
    }
    
    async getMaxOrder() {
        let data = await this.tronQuery(think.config('tronChristmasActAddress'), "getMaxOrderId()", [], null, null);
        console.log(data)
        let orderId = new BigNumber(data, 16).toNumber()
        console.log(orderId)
        return orderId
    }

    async getOrders(from, to) {
        let startTs = Date.now();
        let data = await this.tronQuery(think.config('tronChristmasActAddress'), "getOrders(uint256,uint256)", [{ type: "uint256", value: from}, { type: "uint256", value: to}], null, null);
        console.log(data)

        let orderIdArray = await this.getUint256Arr(data, 256);
        console.log(orderIdArray)


        let _playerArrayStartIndex = orderIdArray[1]
        let playerArray =  await this.getAddressArr(data, _playerArrayStartIndex);
        console.log(playerArray)

        let _txtArrayStartIndex = playerArray[1]
        let txtArray =  await this.getUint256Arr(data, _txtArrayStartIndex);
        console.log(txtArray)

        let _giftIdArrayStartIndex = txtArray[1]
        let giftIdArray =  await this.getUint256Arr(data, _giftIdArrayStartIndex);
        console.log(giftIdArray)

        
        let result = []
        for(let i=0; i<orderIdArray[0].length; i++){
            let tmp ={
                order_id : orderIdArray[0][i],
                addr : playerArray[0][i],
                amount : txtArray[0][i] / 1e6,
                num : giftIdArray[0][i] == 2 ? 100 : 10
            }
            result.push(tmp)
        }
        
        console.log(result)
        return result
    }

    async hexStringToBigNumber(_hexStr) {
        return new BigNumber(_hexStr, 16).toNumber();
    }

    async hexStringToTronAddress(_hexStr) {
        return TronWeb.address.fromHex('41' + _hexStr);
    }

    async getAddressArr(data, _startIndex) {
        let addressArr = new Array();
        let startIndex = _startIndex;
        let arrLen = await this.hexStringToBigNumber(data.substr(startIndex, 64));
        console.log('----------arrLen---------', arrLen)
        startIndex = startIndex + 64;
        for (let idx = 0; idx < arrLen; idx++) {
            addressArr.push(await this.hexStringToTronAddress(data.substr(startIndex + idx * 64 + 24, 40)));
        }
        let _endIndex = _startIndex + (arrLen + 1) * 64;
        return [addressArr, _endIndex]
    }
    
    //十六进制字符串转uint256数组
    async getUint256Arr(data, _startIndex) {
        let uint256Arr = new Array();
        let startIndex = _startIndex;
        let arrLen = await this.hexStringToBigNumber(data.substr(startIndex, 64));
        startIndex = startIndex + 64;
        for (let idx = 0; idx < arrLen; idx++) {
            uint256Arr.push(await this.hexStringToBigNumber(data.substr(startIndex + idx * 64, 64)));
        }
        let _endIndex = _startIndex + (arrLen + 1) * 64;
        return [uint256Arr, _endIndex]
    }

    async openBox(num) {
        if (num > 1) {
            return await this.openMultiBox(num)
        } else {
            return [await this.open1Box()]
        }
    }

    async open1Box() {
        let luckyNum = await this.getRandomInt(1, 38628)
        let sum = 0
        let rate = think.config('goodsRate')
        for (let i =0; i< rate.length; i++) {
            sum = rate[i]
            if (sum >= luckyNum) return i + 1
        }
        return 1
    }

    async openMultiBox(num) {
        let result = []
        for (let i = 0; i < num; i++){
            result.push(await this.open1Box())
        }
        return result
    }

    async getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    async pay2User(address, amount) {
        console.log(address, amount)
        try {
            let newAddress = await tronWeb.address.toHex(address)
            console.log(newAddress)
            let {data} = await xhr({
                url : think.config('nodepay') + '/wallet/easytransferbyprivate',
                method: 'post', 
                data: {
                    privateKey: think.config('payPrivateKey'),
                    toAddress: newAddress,
                    amount: Math.floor(amount * 1000000),
                },
                headers : {
                    'Content-type': 'application/json', 'Accept': 'text/plain'
                }
            });
            let txID = data.transaction.txID
            console.log(util.format('k:%s,%s TRX,交易hash:%s---已经入库', address,amount.toString(),txID))
            return txID
        } catch (error) {
            console.log(error)
            return null
        }
    }

    async getMainAccBalance() {
        let {data} = await xhr({
            url : think.config('nodepay') + "/wallet/getaccount",
            method: 'post', 
            data: {
                address: think.config('publicKeyHex'),
            },
            headers : {
                'Content-type': 'application/json', 'Accept': 'text/plain'
            }
        })
        console.log(think.config('publicKeyHex'))
        let balance = data.balance / 1e6
        return balance
    }


}