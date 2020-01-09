const conf = require('./src/configs/config')
const xhr = require('axios')
const fs = require("fs")
const {query, pool,execTrans, getConnection} = require('./src/utils/utilMysql')
const _ = require('underscore')._;
const TronWeb = require('tronweb');
const moment = require('moment');
const sha3 = require('js-sha3');
const BigNumber = require('bignumber.js');


const EVENT_DiceCreate20 = sha3.keccak256("DiceCreate20(uint256,address,address,uint16,uint16,uint256)");
const EVENT_DiceResult20 = sha3.keccak256("DiceResult20(uint32,address,address,uint16,uint16,uint160,uint16,uint256)");

const ANTE_DICE_ADDR = conf.tronConfig.trc20_bet_addr;
const ANTE_DICE_BET_RESULT_ADDR = conf.tronConfig.trc20_oracle_addr;

console.log("EVENT_DiceCreate20", EVENT_DiceCreate20);
console.log("EVENT_DiceResult20", EVENT_DiceResult20);

const scanBlocknumFileName = 'scanTrc20Dice.blocknum';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function RecordBlockNum(block_num) {
    try {
        fs.writeFile(scanBlocknumFileName, block_num, (err, data) => {
        })
    } catch(e) {
        console.log('Failed....')
    }
    return true
}

async function getMaxBlockNum() {
    try {
        var data = fs.readFileSync(scanBlocknumFileName);
        let blockNum = Number(data.toString())
        if (blockNum <= conf.startBlockNum) return conf.startBlockNum
        return blockNum
    } catch(e) {
        return conf.startBlockNum
    }
}

async function getnowblock() {
    let {data} =  await xhr({
        url : conf.tronConfig.tron_url_solidity + '/walletsolidity/getnowblock',
        method : 'post',
        data : {}
    })
    return data
}

async function getBlockData(blockNum) {
    let {data} =  await xhr({
        url : conf.tronConfig.tron_url_solidity + '/walletsolidity/getblockbynum',
        method : 'post',
        data : {
            num: blockNum
        }
    })
    return data
}

async function alysisBlockData(blockData, blockNumber) {
    let ts = blockData.block_header.raw_data.timestamp;
    let transactions = blockData.transactions;
    let result = true
    if (transactions && !_.isEmpty(transactions) && _.isArray(transactions) && transactions.length > 0) {
        let txCount = transactions ? transactions.length : 0;
        console.log("-----------------------------------------------------------------------------------------------------------------");
        console.log("TRX区块:" + blockNumber + "; 出块时间:" + moment(ts).format('YYYY-MM-DD HH:mm:ss') + "; transactionnum:" + txCount +'; blockId:' + blockData.blockID);
        await Promise.all(transactions.map(async (txInfo) => {
            if (txInfo.ret[0].contractRet != 'SUCCESS') {
                return
            }
            let tmp = await alysisTxs(txInfo)
            if (!tmp) {
                console.log('-------------------blockNumber----------failed---', blockNumber)
                result = false
            }
        }))
    }
    return result
}

async function gettransactioninfobyid(txID){
    let {data} = await xhr({
        url : conf.tronConfig.tron_url_solidity + '/walletsolidity/gettransactioninfobyid',
        method : 'post',
        data : {
            value : txID
        }
    })
    return data
}

async function alysisTxs(tx){
    let txID = tx.txID;
    let raw_data = tx.raw_data;
    let contract = raw_data.contract;
    let fee_limit = raw_data.fee_limit;
    let timestamp = raw_data.timestamp;
    let sign = tx.signature ? tx.signature[0] : '';
    let res = null;
    for (let _contract of contract) {
        let type = _contract.type;
        if (type != "TriggerSmartContract") continue

        let value = _contract.parameter.value;
        let owner_address = value.owner_address; //发起人地址
        let to_address = value.to_address; //转账合约时有效
        let contract_address = value.contract_address; //触发合约时有效

        let call_value = value.call_value || 0; //涉及金额 (单位:sun)
        let data = value.data; //触发合约时有效
        if (contract_address == null) continue

        if (contract_address === ANTE_DICE_ADDR || contract_address == ANTE_DICE_BET_RESULT_ADDR) { //玩家下单之后事件通知
            let txInfo = await gettransactioninfobyid(txID)
            let logs = txInfo.log;
            if (txInfo.resMessage) {
                res.resMessage = hextoString(txInfo.resMessage);
            }
            // console.log(logs)
            if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
                for (let _log of logs) {
                    // loggerDefault.info("_log",_log);
                    // console.log(_log)
                    let event_contract_address = "41" + _log.address;
                    console.log('-')
                    let hexTopics = _log.topics
                    let hexData = _log.data;
                    let eventCode = hexTopics[0];
                    if (eventCode === EVENT_DiceCreate20) {
                        console.log(_log)
                        let log = {
                            _orderId: hexStringToBigNumber(hexTopics[1].substr(0, 64)).toNumber(),
                            _fromAddr: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                            _tokenAddr : hexStringToTronAddress(hexData.substr(24, 40)),
                            _number: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                            _direction: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                            _amount: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                            _sign : sign,
                            _tx_id : txID,
                            _ts : timestamp
                        }
                        console.log(log)
                        let result = await saveAnteDiceOrder(log)
                        if (!result) {
                            return false
                        }
                    } else if (eventCode === EVENT_DiceResult20) {
                        console.log(_log)
                        let log = {
                            _orderId: hexStringToBigNumber(hexTopics[1].substr(0, 64)).toNumber(),
                            _fromAddr: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                            _tokenAddr : hexStringToTronAddress(hexData.substr(24, 40)),
                            _number: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                            _direction: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                            _amount: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                            _roll: hexStringToBigNumber(hexData.substr(256, 64)).toNumber(),
                            _winAmount : hexStringToBigNumber(hexData.substr(320, 64)).toNumber(),
                            _tx_id : txID,
                            _ts : timestamp
                        }
                        console.log(log)
                        let result = await saveAnteDiceResult(log)
                        if (!result) {
                            return false
                        }
                    }
                }
            }
        }
    }
    return true
}

async function saveAnteDiceOrder(info) {
    let num = info._giftId == 2 ? 100 : 10

    // let sql = "insert into tron_plat_event.chris_block_order(addr, block_id, num, ts) values (?, ?, ?, ?)"
    // let sql2 = "insert into tron_plat_event.chris_box(addr, num) values (?,?) ON DUPLICATE KEY update num = num + ?;"
    let sql = "insert into tron_bet_wzc.trc20_dice_order(addr, order_id, token, amount, direction, number, ts, order_tx, sign) values (?, ?, ?, ?, ?, ?, ?, ?,?) ON DUPLICATE KEY update ts = ?, order_tx = ?, sign = ?"
    let conn = null;
    try{
        conn = await getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();
        await execTrans(sql, [info._fromAddr, info._orderId, info._tokenAddr, info._amount, info._direction, info._number, info._ts, info._tx_id, info._sign, info._ts, info._tx_id, info._sign], conn)
        conn.commit()
        conn.release()
    } catch(e) {
        console.log(e)
        if(conn) {
            conn.rollback();
            conn.release()
        }
        return false
    }
    return true
}


async function saveAnteDiceResult(info) {

    let sql = "update tron_bet_wzc.trc20_dice_order set roll = ?, win = ?, result_tx = ? where addr = ? and order_id = ?"
    let conn = null;
    try{
        conn = await getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();
        await execTrans(sql, [info._roll, info._winAmount, info._tx_id, info._fromAddr, info._orderId], conn)
        conn.commit()
        conn.release()
    } catch(e) {
        console.log(e)
        if(conn) {
            conn.rollback();
            conn.release()
        }
        return false
    }
    return true
}

function hexStringToTronAddress1(_hexStr) {
    return TronWeb.address.fromHex(_hexStr);
}

async function scanNext(blockNum) {
    try {
        let blockData = await getBlockData(blockNum)
        if (_.isEmpty(blockData)) {
            return false
        }
        let result = await alysisBlockData(blockData, blockNum)
        return result
    } catch(e) {
        console.log(e)
        return false
    }
}

function hexStringToBigNumber(_hexStr) {
    return new BigNumber(_hexStr, 16);
}

EMPTY_ADDRESS = "0000000000000000000000000000000000000000";
function hexStringToTronAddress(_hexStr) {
    if (_hexStr === EMPTY_ADDRESS) {
        return "";
    }
    return TronWeb.address.fromHex('41' + _hexStr);
}

async function main() {
    let blockNum = await getMaxBlockNum() + 1
    while (true) {
        let stime = new Date().getTime()
        let result = await scanNext(blockNum)
        if (result) {
            await RecordBlockNum(blockNum)
            console.log('-----finish scan trc20 block num ', blockNum, ' in ', new Date().getTime() - stime, 'ms')
            blockNum += 1
        } else {
            console.log('-----------restart trc20 blockNum : ', blockNum)
            await sleep(3000)
        }

    }

}

module.exports = {
    main
};