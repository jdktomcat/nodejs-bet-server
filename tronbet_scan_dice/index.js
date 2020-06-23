//TransferAssetContract
const TronWeb = require('tronweb');
const BigNumber = require('bignumber.js');
const moment = require('moment');
const dbService = require('./src/service/dbService');
const _ = require('underscore')._;
const events = require('events');
const tronSrvEvent = new events.EventEmitter();
const sha3 = require('js-sha3');

const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');

const config = require('./src/configs/config');
const BEGIN_BLOCK_NUMBER = config.tronConfig.beginBlockNumber;
const RANDOM_CONTRACT_ADDRESS = config.tronConfig.RANDOM_CONTRACT_ADDRESS;
// 扫雷游戏下注合约地址
const MINE_CONTRACT_ADDRESS = config.tronConfig.MINE_CONTRACT_ADDRESS;
const ZEROS = '0000000000000000000000000000000000000000000000000000000000000000';

const TRON_BET_CONTRACT_ADDRESS = config.tronConfig.TRON_BET_CONTRACT_ADDRESS;
const DICE_DIVIDENDS_CONTRACT_ADDRESS = config.tronConfig.DICE_DIVIDENDS_CONTRACT_ADDRESS;
const WIN_DIVIDENDS_CONTRACT_ADDRESS = config.tronConfig.WIN_DIVIDENDS_CONTRACT_ADDRESS;

const tronNodePool = require('./src/service/tronNodePool');
const getTronWeb = tronNodePool.getTronWeb;

const EVENT_CODE_DiceResult = sha3.keccak256("DiceResult(uint256,address,address,uint64,uint64,uint256,uint64,uint256,uint256)");

// 新增扫雷游戏下注结果
const EVENT_CODE_MineResult = sha3.keccak256("MineResult(uint256,address,address,uint256,uint64,uint256,uint256,uint256)");

const EVENT_CODE_SEED = sha3.keccak256("importSeedFromThird(address,uint256)");
const EVENT_CODE_SALT = sha3.keccak256("importSeedFromThirdSalt(address,uint256,uint256)");
const EVENT_CODE_SUGAR = sha3.keccak256("importSeedFromThirdSugar(address,uint256,uint256,uint256)");
//dice币分红事件
const EVENT_CODE_DiceDivideCreate = sha3.keccak256("DiceDivideCreate(uint64,uint64,uint64,uint64,uint64)");
const EVENT_CODE_DiceDivideComplete = sha3.keccak256("DiceDivideComplete(uint64,uint64,uint64,uint64,uint64)");
const EVENT_CODE_DiceDivideStep = sha3.keccak256("DiceDivideStep(uint256,address,uint64,uint64,uint64,uint64,uint256,uint256)");
//win币分红事件
const EVENT_CODE_DividePlusCreate = sha3.keccak256("DividePlusCreate(uint64,uint64,uint64,uint64,uint64)");
const EVENT_CODE_DividePlusComplete = sha3.keccak256("DividePlusComplete(uint64,uint64,uint64,uint64,uint64)");
const EVENT_CODE_DividePlusStep = sha3.keccak256("DividePlusStep(uint256,address,uint64,uint64,uint64,uint64,uint256,uint256)");

console.log("EVENT_CODE_DiceResult", EVENT_CODE_DiceResult);

console.log('RANDOM_CONTRACT_ADDRESS', RANDOM_CONTRACT_ADDRESS)
console.log('EVENT_CODE_SEED', EVENT_CODE_SEED)
console.log('EVENT_CODE_SALT', EVENT_CODE_SALT)
console.log('EVENT_CODE_SUGAR', EVENT_CODE_SUGAR)

console.log("EVENT_CODE_DiceDivideCreate", EVENT_CODE_DiceDivideCreate);
console.log("EVENT_CODE_DiceDivideComplete", EVENT_CODE_DiceDivideComplete);
console.log("EVENT_CODE_DiceDivideStep", EVENT_CODE_DiceDivideStep);

console.log("EVENT_CODE_DividePlusCreate", EVENT_CODE_DividePlusCreate);
console.log("EVENT_CODE_DividePlusComplete", EVENT_CODE_DividePlusComplete);
console.log("EVENT_CODE_DividePlusStep", EVENT_CODE_DividePlusStep);

const TX_STATE = {
    READY: 0, //未处理
    ATTENTION: 1, //相关
    IGNORE: 2, //忽略
    ERROR: 3, //异常
}

async function init() {
    await syncBlock();
}

function sleep(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}

let start_ts = Date.now();
let end_ts = Date.now();
async function scanNext(nexBlockNumber, _block_info, delay) {
    delay = delay || 10;
    if (_block_info) {
        let isOk = await SaveDB(_block_info);
        if (isOk === false) {
            tronSrvEvent.emit("scanNext", _block_info.block_num, null, 1501); //继续扫描当前区块
            return;
        }
        end_ts = Date.now();
        loggerDefault.info("save block " + _block_info.block_num + " done!!! 总耗时:" + (end_ts - start_ts) + " ms");
    }
    await sleep(delay);
    start_ts = Date.now();
    await scanBlock(nexBlockNumber);
}

tronSrvEvent.on('scanNext', scanNext);

//同步落后区块
async function syncBlock() {
    loggerDefault.info("App start!!!");
    let hadDoneBlockNum = BEGIN_BLOCK_NUMBER; //配置的默认区块起始号
    let dbBlockNumber = await dbService.getMaxBlockNum(); //数据库中最新区块号
    dbBlockNumber = dbBlockNumber || 0;
    loggerDefault.info("db block num:", dbBlockNumber);
    loggerDefault.info("config block num:", hadDoneBlockNum);
    if (BEGIN_BLOCK_NUMBER < dbBlockNumber) {
        hadDoneBlockNum = dbBlockNumber;
    }
    let tronWeb = await getTronWeb();
    if (tronWeb) {
        loggerDefault.info("using tronWeb fullnode => " + tronWeb.fullNode.host + " ;soliditynode => " + tronWeb.solidityNode.host + " ;eventnode => " + tronWeb.eventServer);
    } else {
        loggerError.error("tronWeb is null!");
        process.exit(0);
    }
    let currentBlock = null;
    try {
        currentBlock = await getnowblock(tronWeb); //最新区块号 ？？ //TODO: latestBlockNumber ==> 本地节点get的最高区块 or 本地节点synced最高区块 or 链上最高区块
    } catch (e) {
        loggerError.error("无法获取最新区块数据!", e);
        process.exit(0);
    }
    if (currentBlock == null) {
        loggerError.error("无法获取最新区块数据!");
        process.exit(0);
    }
    let latestBlockNumber = currentBlock.block_header.raw_data.number;
    if (latestBlockNumber == null) {
        loggerError.error("无法获取最新区块号!");
        process.exit(0);
    }
    loggerDefault.info("newestBlockNumber", latestBlockNumber);
    if (hadDoneBlockNum < latestBlockNumber) {
        let nexBlockNum = hadDoneBlockNum + 1;
        loggerDefault.info("同步落后区块 No =", nexBlockNum);
        await scanBlock(nexBlockNum);
    } else {
        loggerDefault.info("\r\n");
        loggerDefault.info("Congratulation!All Blockes are async");
        loggerDefault.info("\r\n");
        tronSrvEvent.emit("scanNext", hadDoneBlockNum);
    }
}

//扫描指定区块数据
async function scanBlock(blockNumber) {
    let tronWeb = await getTronWeb();
    if (tronWeb == null) {
        loggerDefault.error("tronWeb lost connection!");
        tronSrvEvent.emit("scanNext", blockNumber, null, 1501); //继续扫描当前区块
        return;
    }
    // print("扫描指定TRX区块数据 =>", blockNumber);
    console.log("扫描指定TRX区块数据 =>", blockNumber);
    let bolckInfo = null;
    try {
        bolckInfo = await getblockbynum(tronWeb, blockNumber);
    } catch (e) {
        loggerDefault.error("无法获取 [" + blockNumber + "] 区块数据!", e);
        tronSrvEvent.emit("scanNext", blockNumber, null, 1501); //继续扫描当前区块
        return;
    }

    if (_.isEmpty(bolckInfo)) {
        loggerDefault.info("~~ empty block(" + blockNumber + ")! May be it is newest!");
        tronSrvEvent.emit("scanNext", blockNumber, null, 1501); //继续扫描当前区块
        return;
    }
    let blockHash = bolckInfo.blockID;
    let ts = bolckInfo.block_header.raw_data.timestamp;
    let transactions = bolckInfo.transactions;
    let tx_scan_begin_ts = Date.now();
    if (transactions && !_.isEmpty(transactions) && _.isArray(transactions) && transactions.length > 0) {
        let txCount = transactions ? transactions.length : 0;
        loggerDefault.info("-----------------------------------------------------------------------------------------------------------------");
        loggerDefault.info("TRX区块:" + blockNumber + "; 出块时间:" + moment(ts).format('YYYY-MM-DD HH:mm:ss') + "; 包含交易数:" + txCount + '; blockId:' + blockHash);
        let app_txs = {};
        for (let txInfo of transactions) {
            app_txs[txInfo.txID] = { state: TX_STATE.READY }; //READY:0=未处理  ATTENION:1=关联交易 IGNORE:2=忽略交易 ERROR:4=异常（全初始化为 READY）
        }
        // loggerDefault.info(app_txs);
        for (let txInfo of transactions) {
            scanTx(tronWeb, txInfo, (err, res) => {
                if (err) {
                    loggerError.error(">>> 扫描交易错误 blockNumber:" + blockNumber + " txID:" + txInfo.txID, err);
                    // tronSrvEvent.emit("scanNext", blockNumber, null, 1501); //继续扫描当前区块
                    // return;
                    app_txs[txInfo.txID] = { state: TX_STATE.ERROR };
                }
                if (res == null) {
                    app_txs[txInfo.txID] = { state: TX_STATE.ERROR };
                } else {
                    app_txs[txInfo.txID] = res;
                }
                // loggerDefault.info("txInfo", res.state);
                let noreturn = _.find(app_txs, function (element) { return element.state === TX_STATE.READY; }); //查找未处理/未扫描的交易
                if (noreturn == null) { //已全部处理
                    let errores = _.find(app_txs, function (element) { return element.state === TX_STATE.ERROR; }); //查找扫描异常的交易
                    if (errores == null) {
                        // console.log("app_txs", app_txs);
                        let _block_info = {
                            block_num: blockNumber,
                            txs_count: txCount,
                            app_txs: app_txs,
                            block_ts: ts
                        }
                        loggerDefault.info("    >> 交易全部扫描完成 blockNumber:" + blockNumber + " 耗时:" + (Date.now() - tx_scan_begin_ts) + " ms");
                        loggerDefault.info("    >> TRX区块:" + blockNumber + "; 交易扫描完成！ 耗时：" + (Date.now() - tx_scan_begin_ts) + " ms");
                        tronSrvEvent.emit("scanNext", blockNumber + 1, _block_info);
                    } else {
                        loggerDefault.info("    >> 交易全部扫描完成 (ERROR!) blockNumber:" + blockNumber + " 耗时:" + (Date.now() - tx_scan_begin_ts) + " ms");
                        loggerDefault.info("    >> TRX区块:" + blockNumber + "; 交易扫描失败！重试本区块 耗时：" + (Date.now() - tx_scan_begin_ts) + " ms");
                        tronSrvEvent.emit("scanNext", blockNumber, null, 1501);
                    }
                }
            }); //扫描相关交易
        }
    } else {
        loggerDefault.info("-----------------------------------------------------------------------------------------------------------------");
        loggerDefault.info("TRX区块:" + blockNumber + "; 出块时间:" + moment(ts).format('YYYY-MM-DD HH:mm:ss') + "; 包含交易数: 0");
        let _block_info = {
            block_num: blockNumber,
            txs_count: 0,
            app_txs: {},
            block_ts: ts
        }
        loggerDefault.info("    >> TRX区块:" + blockNumber + "; 交易扫描完成！ 耗时：" + (Date.now() - tx_scan_begin_ts) + " ms");
        tronSrvEvent.emit("scanNext", blockNumber + 1, _block_info);
    }
}

//获取最新区块
function getnowblock(tronWeb) {
    return tronWeb.solidityNode.request('walletsolidity/getnowblock', {}, 'post');
}

//获取blockInfo
function getblockbynum(tronWeb, block_num) {
    return tronWeb.solidityNode.request('walletsolidity/getblockbynum', { "num": block_num }, 'post');
}

//扫描交易
function scanTx(tronWeb, tx, _callback) {
    let txID = tx.txID;
    let raw_data = tx.raw_data;
    let contract = raw_data.contract;
    let res = null;
    for (let _contract of contract) {
        let type = _contract.type;
        if (type === "TriggerSmartContract") { //调用合约
            let value = _contract.parameter.value;
            let owner_address = value.owner_address; //发起人地址
            let to_address = value.to_address; //转账合约时有效
            let contract_address = value.contract_address; //触发合约时有效

            let call_value = value.call_value || 0; //涉及金额 (单位:sun)
            let data = value.data; //触发合约时有效

            if (contract_address == null) {
                _callback(null, { state: TX_STATE.IGNORE, txID: txID });
                return;
            } else if (contract_address === RANDOM_CONTRACT_ADDRESS) { //RANDOM_CONTRACT_ADDRESS
                // loggerDefault.info("RANDOM_CONTRACT_ADDRESS",tx);
                tronWeb.solidityNode.request('walletsolidity/gettransactioninfobyid', { "value": txID }, 'post').then((txInfo) => {
                    if (_.isEmpty(txInfo)) {
                        _callback("Maybe node is asyncing!", null);
                        return;
                    }
                    // console.log(txInfo)
                    // loggerDefault.info("\n===>",txInfo);
                    let receipt = txInfo.receipt;
                    if (receipt == null) {
                        receipt = {
                            origin_energy_usage: 0, //能源消耗 1trx = 100usage
                            energy_usage_total: 0, //能源总消耗 1trx = 100usage
                            energy_fee: 0, //能量花费 1trx = 100usage
                            net_fee: 0, //带宽花费 1trx = 100usage
                            net_usage: 0, //带宽消耗 1trx = 100usage
                            result: "REVERT"
                        }
                    }
                    let logs = txInfo.log;
                    // console.log(logs)
                    // console.log('--------------')
                    // let transactions = txInfo.internal_transactions
                    // console.log(transactions)
                    // for (let one of transactions) {
                    //     let callVale = one.callValueInfo[0]
                    //     if (callVale) {
                    //         console.log(callVale)
                    //     }
                    // }
                    res = {
                        state: TX_STATE.ATTENTION, //** 必须设置为关联状态 TX_STATE.ATTENTION */
                        txID: txID, //交易编号
                        fee: txInfo.fee, //总花费(单位:sun)
                        blockNumber: txInfo.blockNumber,//区块号
                        blockTimeStamp: txInfo.blockTimeStamp,//区块时间戳
                        owner_address: TronWeb.address.fromHex(owner_address), //发起人地址
                        contract_address: TronWeb.address.fromHex(txInfo.contract_address), //合约地址
                        call_value: call_value,//交易额
                        origin_energy_usage: receipt.origin_energy_usage || 0, //能源消耗 1trx = 100usage
                        energy_usage_total: receipt.energy_usage_total || 0, //能源总消耗 1trx = 100usage
                        energy_fee: receipt.energy_fee || 0, //能量花费 1trx = 100usage
                        net_fee: receipt.net_fee || 0, //带宽花费 1trx = 100usage
                        net_usage: receipt.net_usage || 0, //带宽消耗 1trx = 100usage
                        result: receipt.result,  //执行结果 SUCCESS/REVERT
                        logs: []
                    }
                    if (txInfo.resMessage) {
                        res.resMessage = hextoString(txInfo.resMessage);
                        loggerDefault.warn("resMessage:" + res.resMessage + "; tx_id:" + txID);
                    }

                    if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
                        let iLogs = res.logs;
                        for (let _log of logs) {
                            // loggerDefault.info("_log",_log);
                            let event_contract_address = "41" + _log.address;
                            let hexTopics = _log.topics
                            let hexData = _log.data;
                            let _ver = _.indexOf(TRON_BET_CONTRACT_ADDRESS, event_contract_address);

                            let eventCode = hexTopics[0];
                            if (eventCode === EVENT_CODE_DiceResult || eventCode === EVENT_CODE_SEED || eventCode === EVENT_CODE_SALT) {
                                // console.log(eventCode, EVENT_CODE_SEED, EVENT_CODE_SALT, EVENT_CODE_SEED)
                                let log = {
                                    _type: "bet_result",
                                    _ver: _.indexOf(TRON_BET_CONTRACT_ADDRESS, event_contract_address),
                                    _orderId: hexStringToBigNumber(hexTopics[1]).toNumber(),
                                    _bettor: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                                    _mentor: hexStringToTronAddress(hexTopics[3].substr(24, 40)),
                                    _number: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                    _direction: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                    _amount: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                    _roll: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                    _winAmount: hexStringToBigNumber(hexData.substr(256, 64)).toNumber(),
                                    _referralAmount: hexStringToBigNumber(hexData.substr(320, 64)).toNumber(),
                                }
                                // loggerDefault.info(log);
                                // console.log(log)
                                iLogs.push(log);
                            }
                        }
                    }
                    // loggerDefault.info("Tron bet gogogo!!!");
                    // loggerDefault.info("tx=>", tx);
                    // loggerDefault.info("contract=>", _contract);
                    // loggerDefault.info("txInfo=>", txInfo);
                    // process.exit(0);
                    // loggerDefault.info(res);
                    _callback(null, res);
                    return;
                }).catch((e) => {
                    loggerError.error("WTF! walletsolidity/gettransactioninfobyid", txID, e);
                    _callback("WTF! walletsolidity/gettransactioninfobyid/" + txID, null);
                    return;
                });
            } else if (contract_address === DICE_DIVIDENDS_CONTRACT_ADDRESS) { //DICE分红合约
                console.log("*** About DICE_DIVIDENDS_CONTRACT_ADDRESS!!!", txID);
                tronWeb.solidityNode.request('walletsolidity/gettransactioninfobyid', { "value": txID }, 'post').then((txInfo) => {
                    if (_.isEmpty(txInfo)) {
                        _callback("Maybe node is asyncing!", null);
                        return;
                    }

                    let contractResult = hexStringToBigNumber(txInfo.contractResult).toNumber(); //调用合约函数

                    let receipt = txInfo.receipt;
                    if (receipt == null) {
                        receipt = {
                            origin_energy_usage: 0, //能源消耗 1trx = 100usage
                            energy_usage_total: 0, //能源总消耗 1trx = 100usage
                            energy_fee: 0, //能量花费 1trx = 100usage
                            net_fee: 0, //带宽花费 1trx = 100usage
                            net_usage: 0, //带宽消耗 1trx = 100usage
                            result: "REVERT"
                        }
                    }
                    let logs = txInfo.log;
                    res = {
                        state: TX_STATE.ATTENTION,
                        txID: txID, //交易编号
                        fee: txInfo.fee, //总花费(单位:sun)
                        blockNumber: txInfo.blockNumber,//区块号
                        blockTimeStamp: txInfo.blockTimeStamp,//区块时间戳
                        owner_address: TronWeb.address.fromHex(owner_address), //发起人地址
                        contract_address: TronWeb.address.fromHex(txInfo.contract_address), //合约地址
                        call_value: call_value,//交易额
                        origin_energy_usage: receipt.origin_energy_usage || 0, //能源消耗 1trx = 100usage
                        energy_usage_total: receipt.energy_usage_total || 0, //能源总消耗 1trx = 100usage
                        energy_fee: receipt.energy_fee || 0, //能量花费 1trx = 100usage
                        net_fee: receipt.net_fee || 0, //带宽花费 1trx = 100usage
                        net_usage: receipt.net_usage || 0, //带宽消耗 1trx = 100usage
                        result: receipt.result,  //执行结果 SUCCESS/REVERT
                        logs: []
                    }
                    if (txInfo.resMessage) {
                        res.resMessage = hextoString(txInfo.resMessage);
                        loggerDefault.warn("resMessage:" + res.resMessage + "; tx_id:" + txID);
                    }

                    if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
                        let iLogs = res.logs;
                        for (let _log of logs) {
                            let hexTopics = _log.topics
                            let hexData = _log.data;
                            let eventCode = hexTopics[0];
                            let log = null;
                            switch (eventCode) {
                                case EVENT_CODE_DiceDivideCreate:
                                    log = {
                                        _type: "DiceDivideCreate",
                                        round: hexStringToBigNumber(hexTopics[1]).toNumber(),
                                        trxAmountTotal: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                        diceAmountTotal: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                        maxHolderIndex: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                        tmCreate: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                    }
                                    break;
                                case EVENT_CODE_DiceDivideComplete:
                                    log = {
                                        _type: "DiceDivideComplete",
                                        round: hexStringToBigNumber(hexTopics[1]).toNumber(),
                                        trxAmountTotal: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                        diceAmountTotal: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                        maxHolderIndex: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                        tmCompleted: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                    }
                                    break;
                                case EVENT_CODE_DiceDivideStep:
                                    log = {
                                        _type: "DiceDivideStep",
                                        index: hexStringToBigNumber(hexTopics[1]).toNumber(),
                                        owner: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                                        round: hexStringToBigNumber(hexTopics[3]).toNumber(),
                                        trxAmountTotal: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                        diceAmountTotal: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                        maxHolderIndex: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                        diceAmount: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                        trxAmount: hexStringToBigNumber(hexData.substr(256, 64)).toNumber(),
                                    }
                                    break;
                            }
                            // loggerDefault.info(log);
                            if (log != null) {
                                iLogs.push(log);
                            }
                        }
                    }
                    // loggerDefault.info("Tron bet gogogo!!!");
                    // loggerDefault.info("tx=>", tx);
                    // loggerDefault.info("contract=>", _contract);
                    // loggerDefault.info("txInfo=>", txInfo);
                    // process.exit(0);
                    // loggerDefault.info(res);
                    _callback(null, res);
                    return;
                }).catch((e) => {
                    loggerError.error("WTF! walletsolidity/gettransactioninfobyid", txID, e);
                    _callback("WTF! walletsolidity/gettransactioninfobyid/" + txID, null);
                    return;
                });
            } else if (contract_address === WIN_DIVIDENDS_CONTRACT_ADDRESS) {  //WIN分红合约
                console.log("*** About WIN_DIVIDENDS_CONTRACT_ADDRESS!!!", txID);
                tronWeb.solidityNode.request('walletsolidity/gettransactioninfobyid', {"value": txID}, 'post').then((txInfo) => {
                    if (_.isEmpty(txInfo)) {
                        _callback("Maybe node is asyncing!", null);
                        return;
                    }

                    let contractResult = hexStringToBigNumber(txInfo.contractResult).toNumber(); //调用合约函数

                    let receipt = txInfo.receipt;
                    if (receipt == null) {
                        receipt = {
                            origin_energy_usage: 0, //能源消耗 1trx = 100usage
                            energy_usage_total: 0, //能源总消耗 1trx = 100usage
                            energy_fee: 0, //能量花费 1trx = 100usage
                            net_fee: 0, //带宽花费 1trx = 100usage
                            net_usage: 0, //带宽消耗 1trx = 100usage
                            result: "REVERT"
                        }
                    }
                    let logs = txInfo.log;
                    res = {
                        state: TX_STATE.ATTENTION,
                        txID: txID, //交易编号
                        fee: txInfo.fee, //总花费(单位:sun)
                        blockNumber: txInfo.blockNumber,//区块号
                        blockTimeStamp: txInfo.blockTimeStamp,//区块时间戳
                        owner_address: TronWeb.address.fromHex(owner_address), //发起人地址
                        contract_address: TronWeb.address.fromHex(txInfo.contract_address), //合约地址
                        call_value: call_value,//交易额
                        origin_energy_usage: receipt.origin_energy_usage || 0, //能源消耗 1trx = 100usage
                        energy_usage_total: receipt.energy_usage_total || 0, //能源总消耗 1trx = 100usage
                        energy_fee: receipt.energy_fee || 0, //能量花费 1trx = 100usage
                        net_fee: receipt.net_fee || 0, //带宽花费 1trx = 100usage
                        net_usage: receipt.net_usage || 0, //带宽消耗 1trx = 100usage
                        result: receipt.result,  //执行结果 SUCCESS/REVERT
                        logs: []
                    }
                    if (txInfo.resMessage) {
                        res.resMessage = hextoString(txInfo.resMessage);
                        loggerDefault.warn("resMessage:" + res.resMessage + "; tx_id:" + txID);
                    }

                    if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
                        let iLogs = res.logs;
                        for (let _log of logs) {
                            let hexTopics = _log.topics
                            let hexData = _log.data;
                            let eventCode = hexTopics[0];
                            let log = null;
                            switch (eventCode) {
                                case EVENT_CODE_DividePlusCreate:
                                    log = {
                                        _type: "DividePlusCreate",
                                        round: hexStringToBigNumber(hexTopics[1]).toNumber(),
                                        trxAmountTotal: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                        winAmountTotal: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                        maxHolderIndex: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                        tmCreate: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                    }
                                    break;
                                case EVENT_CODE_DividePlusComplete:
                                    log = {
                                        _type: "DividePlusComplete",
                                        round: hexStringToBigNumber(hexTopics[1]).toNumber(),
                                        trxAmountTotal: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                        winAmountTotal: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                        maxHolderIndex: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                        tmCompleted: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                    }
                                    break;
                                case EVENT_CODE_DividePlusStep:
                                    log = {
                                        _type: "DividePlusStep",
                                        index: hexStringToBigNumber(hexTopics[1]).toNumber(),
                                        owner: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                                        round: hexStringToBigNumber(hexTopics[3]).toNumber(),
                                        trxAmountTotal: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                        winAmountTotal: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                        maxHolderIndex: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                        winAmount: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                        trxAmount: hexStringToBigNumber(hexData.substr(256, 64)).toNumber(),
                                    }
                                    break;
                            }
                            // loggerDefault.info(log);
                            if (log != null) {
                                iLogs.push(log);
                            }
                        }
                    }
                    // loggerDefault.info("Tron bet gogogo!!!");
                    // loggerDefault.info("tx=>", tx);
                    // loggerDefault.info("contract=>", _contract);
                    // loggerDefault.info("txInfo=>", txInfo);
                    // process.exit(0);
                    // loggerDefault.info(res);
                    _callback(null, res);
                    return;
                }).catch((e) => {
                    loggerError.error("WTF! walletsolidity/gettransactioninfobyid", txID, e);
                    _callback("WTF! walletsolidity/gettransactioninfobyid/" + txID, null);
                    return;
                });
            } else if(contract_address === MINE_CONTRACT_ADDRESS){ // 扫雷游戏下注合约地址
                console.log('===========:' + contract_address+' =====:' + MINE_CONTRACT_ADDRESS)
                tronWeb.solidityNode.request('walletsolidity/gettransactioninfobyid', { "value": txID }, 'post').then((txInfo) => {
                    if (_.isEmpty(txInfo)) {
                        _callback("Maybe node is asyncing!", null);
                        return;
                    }
                    let receipt = txInfo.receipt;
                    if (receipt == null) {
                        receipt = {
                            origin_energy_usage: 0, //能源消耗 1trx = 100usage
                            energy_usage_total: 0, //能源总消耗 1trx = 100usage
                            energy_fee: 0, //能量花费 1trx = 100usage
                            net_fee: 0, //带宽花费 1trx = 100usage
                            net_usage: 0, //带宽消耗 1trx = 100usage
                            result: "REVERT"
                        }
                    }
                    let logs = txInfo.log;
                    res = {
                        state: TX_STATE.ATTENTION, //** 必须设置为关联状态 TX_STATE.ATTENTION */
                        txID: txID, //交易编号
                        fee: txInfo.fee, //总花费(单位:sun)
                        blockNumber: txInfo.blockNumber,//区块号
                        blockTimeStamp: txInfo.blockTimeStamp,//区块时间戳
                        owner_address: TronWeb.address.fromHex(owner_address), //发起人地址
                        contract_address: TronWeb.address.fromHex(txInfo.contract_address), //合约地址
                        call_value: call_value,//交易额
                        origin_energy_usage: receipt.origin_energy_usage || 0, //能源消耗 1trx = 100usage
                        energy_usage_total: receipt.energy_usage_total || 0, //能源总消耗 1trx = 100usage
                        energy_fee: receipt.energy_fee || 0, //能量花费 1trx = 100usage
                        net_fee: receipt.net_fee || 0, //带宽花费 1trx = 100usage
                        net_usage: receipt.net_usage || 0, //带宽消耗 1trx = 100usage
                        result: receipt.result,  //执行结果 SUCCESS/REVERT
                        logs: []
                    }
                    if (txInfo.resMessage) {
                        res.resMessage = hextoString(txInfo.resMessage);
                        loggerDefault.warn("resMessage:" + res.resMessage + "; tx_id:" + txID);
                    }
                    if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
                        let iLogs = res.logs;
                        for (let _log of logs) {
                            let hexTopics = _log.topics;
                            let hexData = _log.data;
                            let eventCode = hexTopics[0];
                            console.log('>>>>>>>>>>>:' + eventCode+' >>>>>>' + EVENT_CODE_MineResult)
                            if (eventCode === EVENT_CODE_MineResult) {
                                // 解析对应的order信息
                                let log={
                                    _type: "bet_mine_result",
                                    addr: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                                    mentor_addr: hexStringToTronAddress(hexTopics[3].substr(24, 40)),
                                    mentor_rate: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                    win_amount: hexStringToBigNumber(hexData.substr(64, 64)).toNumber()
                                };
                                getOrderDetail(log, hexTopics[1])
                                console.log('++++++++++:' + log.addr)
                                iLogs.push(log);
                            }
                        }
                    }
                    _callback(null, res);
                    return;
                }).catch((e) => {
                    loggerError.error("WTF! walletsolidity/gettransactioninfobyid", txID, e);
                    _callback("WTF! walletsolidity/gettransactioninfobyid/" + txID, null);
                    return;
                });
            } else {
                _callback(null, { state: TX_STATE.IGNORE, txID: txID });
                return;
            }
        } else if (type === "FreezeBalanceContract") {
            _callback(null, { state: TX_STATE.IGNORE, txID: txID });
            return;
            // let x = _contract.parameter.value.frozen_balance;
            // if (x > 1000000000000) {
            //     loggerDefault.info(_contract);
            //     process.exit(0);
            // }
        } else {
            _callback(null, { state: TX_STATE.IGNORE, txID: txID });
            return;
        }
    }
}

init();
module.exports.init = init;
////////////////////////////////////////////////////////////////////////////

function hextoString(hex) {
    const arr = hex.split('');
    let out = '';
    for (let i = 0; i < arr.length / 2; i++) {
        let tmp = `0x${arr[i * 2]}${arr[i * 2 + 1]}`;
        out += String.fromCharCode(tmp);
    }
    return out;
}

//十六进制字符串转Tron账号
EMPTY_ADDRESS = "0000000000000000000000000000000000000000";
function hexStringToTronAddress(_hexStr) {
    if (_hexStr === EMPTY_ADDRESS) {
        return "";
    }
    return TronWeb.address.fromHex('41' + _hexStr);
}

//十六进制字符串转BigNumber
function hexStringToBigNumber(_hexStr) {
    return new BigNumber(_hexStr, 16);
}

async function SaveDB(_block_info) {
    return await dbService.saveDB(_block_info);
}

/**
 * 解析对应的订单信息
 * @param log 信息
 * @param order 订单
 */
function getOrderDetail(log, order){
    order = ZEROS.substring(0, 64 - order.length) + order
    log.amount = parseInt(order.substring(24, 40),16)
    log.order_id = parseInt(order.substring(40, 48),16)
    log.order_state = parseInt(order.substring(62, 64),16)
    log.order_ts = new Date(parseInt(order.substring(8, 24),16) * 1000)
    log.order_block_height = parseInt(order.substring(0, 8),16)
    log.order_finish_block_height = parseInt(order.substring(48, 56),16)
    log.mode = parseInt(order.substring(56, 58),16)
    log.mine_region_height = parseInt(order.substring(60, 62),16)
    log.mine_region_width = parseInt(order.substring(58, 60),16)
}
