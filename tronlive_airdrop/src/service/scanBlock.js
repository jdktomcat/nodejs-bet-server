const conf = require('../configs/config')
const moment = require('moment')
const _ = require('lodash')._
const logger = require('../configs/log4js.config')
const sha3 = require('js-sha3')
const evnets = require('events')
const fs = require("fs")
const tronUtil = require('../utils/tronUtil')
const redisUtil = require('../utils/redisUtil')
const appEvent = new evnets.EventEmitter()

const redisStakersKey = 'aridrop:stakers'

const EVENT_StakeAnte = sha3.keccak256("StakeWin(address,uint256,uint256)")
const EVENT_UnstakeAnte = sha3.keccak256("UnstakeWin(address,uint256,uint256,uint256,uint256)")
const EVENT_UnstakeCancel = sha3.keccak256("UnstakeCancel(address,uint256,uint256)")

const scanBlocknumFileName = 'scanBlock.blocknum';

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
        if (blockNum <=  conf.tronConfig.startBlockNum) return  conf.tronConfig.startBlockNum
        return blockNum
    } catch(e) {
        logger.info(e)
        return conf.tronConfig.startBlockNum
    }
}

async function alysisBlockData(blockData, blockNumber) {
    let ts = blockData.block_header.raw_data.timestamp;
    let startTs = new Date().getTime()
    let transactions = blockData.transactions;
    let result = true
    if (transactions && !_.isEmpty(transactions) && _.isArray(transactions) && transactions.length > 0) {
        let txCount = transactions ? transactions.length : 0;
        logger.info("-----------------------------------------------------------------------------------------------------------------", blockNumber);
        logger.info("TRX区块:" + blockNumber + "; 出块时间:" + moment(ts).format('YYYY-MM-DD HH:mm:ss') + "; transaction num:" + txCount +'; blockId:' + blockData.blockID);
        await Promise.all(transactions.map(async (txInfo) => {
            if (txInfo.ret[0].contractRet != 'SUCCESS') {
                return
            }
            let tmp = await alysisTxs(txInfo)
            if (!tmp) {
                logger.info('-------------------blockNumber----------failed---', blockNumber)
                result = false
            }
        }))
    }
    return result
}

async function alysisTxs(tx){
    let txID = tx.txID
    let raw_data = tx.raw_data
    let contract = raw_data.contract
    let timestamp = raw_data.timestamp
    for (let _contract of contract) {
        let type = _contract.type
        if (type != "TriggerSmartContract") continue
        let value = _contract.parameter.value
        let contract_address = value.contract_address //触发合约时有效
        // console.log('---------------conf.tronConfig.stakerAddr-------------', conf.tronConfig.stakerAddr)
        if (contract_address == null || contract_address !== conf.tronConfig.anteStkerAddr) continue
        let txInfo = await tronUtil.getTransactionInfo(txID)
        let logs = txInfo.log

        if (_.isEmpty(logs) || !_.isArray(logs)) continue

        for (let _log of logs) {
            let event_contract_address = "41" + _log.address;
            let hexTopics = _log.topics
            // console.log(_log)
            let hexData = _log.data;
            let eventCode = hexTopics[0];
            if (eventCode === EVENT_StakeAnte) {
                let _playerAddr = tronUtil.hexStringToTronAddress(hexTopics[1].substr(24, 40))
                let _cancelAmount = tronUtil.hexStringToBigNumber(hexData.substr(64, 64)).toNumber()
                let _anteTotal = tronUtil.hexStringToBigNumber(hexData.substr(128, 64)).toNumber()
                let resultInfo = {
                    _playerAddr,
                    _cancelAmount,
                    _anteTotal
                }
                logger.info(resultInfo)
                let result = await updateStakersInfo(_playerAddr)
                if (!result) {
                    return false
                }
            } else if(eventCode === EVENT_UnstakeAnte) {
                let _playerAddr = tronUtil.hexStringToTronAddress(hexTopics[1].substr(24, 40))
                let _oldUnfreezingAmount = tronUtil.hexStringToBigNumber(hexData.substr(0, 64)).toNumber()
                let _newUnfreezingAmount = tronUtil.hexStringToBigNumber(hexData.substr(64, 64)).toNumber()
                let _leftAmount = tronUtil.hexStringToBigNumber(hexData.substr(128, 64)).toNumber()
                let _tmFreeze = tronUtil.hexStringToBigNumber(hexData.substr(192, 64)).toNumber()
                let resultInfo = {
                    _playerAddr,
                    _oldUnfreezingAmount,
                    _newUnfreezingAmount,
                    _leftAmount,
                    _tmFreeze
                }
                logger.info(resultInfo)
                let result = await updateStakersInfo(_playerAddr)
                if (!result) {
                    return false
                }
            } else if(eventCode === EVENT_UnstakeCancel) {
                let _playerAddr = tronUtil.hexStringToTronAddress(hexTopics[1].substr(24, 40))
                let _cancelAmount = tronUtil.hexStringToBigNumber(hexData.substr(64, 64)).toNumber()
                let _anteTotal = tronUtil.hexStringToBigNumber(hexData.substr(128, 64)).toNumber()
                let resultInfo = {
                    _playerAddr,
                    _cancelAmount,
                    _anteTotal
                }
                logger.info(resultInfo)
                let result = await updateStakersInfo(_playerAddr)
                if (!result) {
                    return false
                }
            }
        }
    }
    return true
}


appEvent.on('do_scan_block', (blockNum, delay) => {
    delay = delay || 2000
    let timer = setTimeout(async () => {
        clearTimeout(timer)
        try {
            let startTs  = new Date().getTime()
            let blockData = await tronUtil.getConfirmedBlockInfoByNum(blockNum)
            // logger.info(blockData)
            if (_.isEmpty(blockData)) {
                appEvent.emit("do_scan_block", blockNum, 1500)
                return
            }
            let result = await alysisBlockData(blockData, blockNum)
            if (!result) {
                logger.error('try to restart block => ', blockNum)
                appEvent.emit("do_scan_block", blockNum, 20)
                return
            }
            logger.info("TRX区块:" + blockNum + "; 扫描用时 =>" + (new Date().getTime() - startTs) + 'ms')
            await RecordBlockNum(blockNum)
            blockNum += 1
            appEvent.emit("do_scan_block", blockNum, 20)
        } catch (error) {
            logger.error(error);
            appEvent.emit("do_scan_block", blockNum, 2000)
        }
    }, delay);
})


async function updateStakersInfo(addr) {
    let userInfo = await tronUtil.tronQuery(conf.tronConfig.anteStkerAddr,'getStateInfoByAddress(address)', 5e6, 0, [{type : 'address', value : addr}]).catch((err) => {
        console.log(err)
        return
    })
    console.log(userInfo)
    if (!_.isEmpty(userInfo)) {
        let addr = tronUtil.hexStringToTronAddress(userInfo.substr(24,40))
        let anteAmount  = tronUtil.hexStringToBigNumber(userInfo.substr(64,64)).toNumber() / 1e6
        let tmUnfreeze  = tronUtil.hexStringToBigNumber(userInfo.substr(128,64)).toNumber() / 1e6
        let unfreezingAmount  = tronUtil.hexStringToBigNumber(userInfo.substr(192,64)).toNumber() / 1e6
        console.log('------addr,anteAmount, tmUnfreeze, unfreezingAmount ===>', addr,anteAmount,tmUnfreeze,unfreezingAmount)
        await redisUtil.hset(redisStakersKey, addr, anteAmount)
    }
    return true
}

async function doStartScan() {
    let blockNum = await getMaxBlockNum()
    appEvent.emit('do_scan_block', blockNum, 0)
}


doStartScan()