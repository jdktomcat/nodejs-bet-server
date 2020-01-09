var xhr = require('axios')
var fs = require("fs")
const _ = require('loadsh')._
const TronWeb = require('tronweb')
const moment = require('moment')
const sha3 = require('js-sha3')
const BigNumber = require('bignumber.js')
const utils = require('./utils')
const log4js = require('../configs/log4js.config')
const logger = log4js.getLogger('trx')
const conf = require('../configs/config')
const db = require('../utils/dbUtil')
const redisUtils = require('../utils/redisUtil')


const JACKPOT_ADDR = conf.tronConfig.jackpotAddr
const hosts = conf.tronConfig.masterSolidityNode
const ReachJackPort_EVENT = sha3.keccak256("ReachJackpot(uint256,address,uint256,uint256,uint256,uint256,uint256,uint256)")
const GetJackPort_EVENT = sha3.keccak256("GetJackpot(uint256,address,uint256,uint256)")
const rediskey = 'jackpot:list'

const scanBlocknumFileName = 'scanSolidity.blocknum';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function RecordBlockNum(block_num) {
    try {
        fs.writeFile(scanBlocknumFileName, block_num, (err, data) =>{
        })
    } catch(e) {
        logger.info('Failed....')
    }
    return true
}

async function getMaxBlockNum() {
    try {
        var data = fs.readFileSync(scanBlocknumFileName);
        let blockNum = Number(data.toString())
        if (blockNum <= conf.tronConfig.startBlockNum) return conf.tronConfig.startBlockNum;
        return blockNum;
    } catch (e) {
        return conf.tronConfig.startBlockNum;
    }
}

async function getnowblock() {
    let {data} =  await xhr({
        url : hosts + '/walletsolidity/getnowblock',
        method : 'post',
        data : {}
    })
    return data
}

async function getBlockData(blockNum) {
    let {data} =  await xhr({
        url : hosts + '/walletsolidity/getblockbynum',
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
        logger.info("-----------------------------------------------------------------------------------------------------------------");
        logger.info("SOLITITY区块:" + blockNumber + "; 出块时间:" + moment(ts).format('YYYY-MM-DD HH:mm:ss') + "; transactionnum:" + txCount +'; blockId:' + blockData.blockID);
        await Promise.all(transactions.map(async (txInfo) => {
            if (txInfo.ret[0].contractRet != 'SUCCESS') {
                return
            }
            let tmp = await alysisTxs(txInfo)
            if (!tmp) {
                logger.info('-------------------solidity-----blockNumber----------failed---', blockNumber)
                result = false
            }
        }))
    }
    return result
}

async function gettransactioninfobyid(txID){
    let {data} = await xhr({
        url : hosts + '/walletsolidity/gettransactioninfobyid',
        method : 'post',
        data : {
            value : txID
        }
    })
    return data
}

async function alysisTxs(tx){
    let txID = tx.txID
    let raw_data = tx.raw_data
    let contract = raw_data.contract
    let timestamp = raw_data.timestamp
    for (let _contract of contract) {
        let type = _contract.type;
        if (type != "TriggerSmartContract") continue
        let value = _contract.parameter.value;
        let contract_address = value.contract_address; //触发合约时有效
        if (contract_address == null) continue

        if (contract_address === JACKPOT_ADDR) { //
            let txInfo = await gettransactioninfobyid(txID)
            let logs = txInfo.log
            if (!(logs && _.isArray(logs) && !_.isEmpty(logs))) continue
            for (let _log of logs) {
                let hexTopics = _log.topics
                let hexData = _log.data;
                let eventCode = hexTopics[0];
                if (eventCode === ReachJackPort_EVENT) {
                    console.log(_log)
                    let log = {
                        _jackportId: hexStringToBigNumber(hexTopics[1].substr(0, 64)).toNumber(),
                        _winner: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                        _tableId: hexStringToBigNumber(hexData.substr(0, 64)).toNumber() % 1000000,
                        _round: Math.floor(hexStringToBigNumber(hexData.substr(0, 64)).toNumber() / 1000000),
                        _cardShow: hexData.substr(118, 10),
                        _jackpotType: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                        _trxAmount: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                        _pollAmount: hexStringToBigNumber(hexData.substr(256, 64)).toNumber(),
                        _ts: timestamp,
                        _txId: txID,
                    }
                    console.log(log)
                    let result = await SaveReachJackpotAction(log)
                    if (!result) {
                        return false
                    }
                } else if (eventCode === GetJackPort_EVENT) {
                    console.log(_log)
                    let log = {
                        _jackportId: hexStringToBigNumber(hexTopics[1].substr(0, 64)).toNumber(),
                        _winner: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                        _cardShow: hexStringToBigNumber(hexData.substr(54, 10)),
                        _trxAmount: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                        _txId: txID,
                        _ts: timestamp
                    }
                    console.log(log)
                    let result = await SaveGetJackpotAction(log)
                    if (!result) {
                        return false
                    }
                }
            }
        }
    }
    return true
}

async function SaveReachJackpotAction(info) {
    let sql = "insert into poker_jackpot_log(jackpotId, winner, tableId, round, cardType, jackpotType, trx, pool, reachTs, reachTx) values(?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY update reachTs = ?;"
    let res = await db.exec(sql, [info._jackportId, info._winner, info._tableId, info._round, info._cardShow, info._jackpotType, info._trxAmount, info._pollAmount, info._ts, info._txId, info._ts])
    await updateRedisData(info._winner)
    return true
}

async function SaveGetJackpotAction(info) {
    let sql = "update poker_jackpot_log set getTs = ?, getTx = ?, status = 2 where jackpotId = ?"
    let res = await db.exec(sql, [info._ts, info._txId, info._jackportId])
    await updateRedisData(info._winner)
    return true
}

async function updateRedisData(addr) {
    let sql = "select * from poker_jackpot_log where winner = ? order by jackpotId desc limit 20"
    let res = await db.exec(sql, [addr])
    await redisUtils.hset(rediskey, addr, JSON.stringify(res))
    return true
}

async function scanNext(blockNum) {
    try {
        let blockData = await getBlockData(blockNum)
        // logger.info(JSON.stringify(blockData))
        // process.exit(0)
        if (_.isEmpty(blockData)) {
            return false
        }
        let result = await alysisBlockData(blockData, blockNum)
        return result
    } catch(e) {
        logger.info(e)
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
            logger.info('-----finish solidity block num ', blockNum, ' in ', new Date().getTime() - stime, 'ms')
            blockNum += 1
        } else {
            logger.info('-----------restart solidity blockNum : ', blockNum)
            await sleep(3100)
        }
    }
}

main()