const moment = require('moment');
const TronWeb = require('tronweb');
const _ = require('lodash')._;
const sha3 = require('js-sha3');
const dbService = require('./dbService');
const logService = require('./logService');
const config = require('../configs/config');
const log4js = require('../configs/log4js.config');
const strUtil = require('../common/stringUtil');
const commomEnum = require('../common/commonEnum');
const loggerDefault = log4js.getLogger('print');


const BEGIN_BLOCK_NUMBER = config.tronConfig.beginBlockNumber;
const TRON_TEXAS_PAY_ADDR = config.tronConfig.TRON_TEXAS_PAY_ADDR;
const TRON_TEXAS_JACKPOT_ADDR = config.tronConfig.TRON_TEXAS_JACKPOT_ADDR;

const ETH_TEXAS_PAY_ADDR = TRON_TEXAS_PAY_ADDR.substr(2, TRON_TEXAS_PAY_ADDR.length - 2);
const ETH_TEXAS_JACKPOT_ADDR = TRON_TEXAS_JACKPOT_ADDR.substr(2, TRON_TEXAS_JACKPOT_ADDR.length - 2);


const tronNodePool = require('./tronNodePool');
const getTronWeb = tronNodePool.getTronWeb;
const getTronWebNot = tronNodePool.getTronWebNot;

const EVENT_TEXAS_BUYIN = sha3.keccak_256('TexasBuyIn(address,uint256,uint256)');
const EVENT_TEXAS_SITOUT = sha3.keccak_256('TexasSitOut(uint256,address,uint256,uint256,uint256)');
const FUNC_TEXAS_BUYIN = sha3.keccak_256('BuyIn(uint256)').substr(0, 8);

const FUNC_SELECTOR_BUYOUT = 'SitOut(address,uint256,uint256,uint256,uint256)';
const FUNC_TEXAS_BUYOUT = sha3.keccak_256(FUNC_SELECTOR_BUYOUT).substr(0, 8);

const EVENT_TEXAS_JACKPOT = sha3.keccak_256('ReachJackpot(uint256,address,uint256,uint256,uint256,uint256,uint256,uint256)');
const FUNC_SELECTOR_JACKPOT = 'setJackpot(uint256,address,uint256,uint256,uint256,uint256,uint256)';
const FUNC_TEXAS_JACKPOT = sha3.keccak_256(FUNC_SELECTOR_JACKPOT).substr(0, 8);

const PokerScanEvent = commomEnum.GLOBAL_EVENT;
const PayInState = commomEnum.PAYIN_STATE;
const PayOutState = commomEnum.PAYOUT_STATE;
const REVENUE_OPTYPE = commomEnum.REVENUE_OPTYPE;
const JACKPOT_STATE = commomEnum.JACKPOT_STATE;

let getUnixTimeStamp = strUtil.getUnixTimeStamp;
let assert = strUtil.assert;

let LobbyInstance = null;

class TexasScan {
    constructor() {
        this.instance = null;       // 单例实例
        this.scanedFullBlockId = BEGIN_BLOCK_NUMBER;
        this.scanedSolidityBlockId = BEGIN_BLOCK_NUMBER;
        this.unconfirmedPayInOrder = new Map();             // txID=>Order 初始化的时候, 需从mysql加载未处理的订单
        this.unconfirmedPayOutOrder = new Map();            // sysTxId=>Order
        this.unconfirmedJackpotOrder = new Map();          // sysTxId=>Order
        this.stoped = false;
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new TexasScan();
        }
        return this.instance;
    }

    async doPayOut(order, cb) {
        this.unconfirmedPayOutOrder.set(order.sysTxID, order);
        let options = {
            feeLimit: 1000000,
            callValue: 0,
        };
        let pamarmArray = [
            {type:'address', value: TronWeb.address.toHex(order.addr)},
            {type:'uint256', value: order.tableId},
            {type:'uint256', value: order.trxAmount},
            {type:'uint256', value: '0x' + order.sysTxID},
            {type:'uint256', value: order.optype || 999},
        ];

        let tronWeb = await getTronWeb();
        if (!tronWeb) {
            loggerDefault.error("doPayOut时无法初始化tronweb", order.sysTxID);
            cb(false, null);
            return;
        }

        loggerDefault.info('---------doPayOut----------', order);

        order.lastCheckBlock = this.scanedFullBlockId + 10;      // 猜测block, 一般靠前几个区块
        order.lastSubmit = getUnixTimeStamp();
        if (order.status == PayOutState.NEW) {
            order.status = PayOutState.SUBMITED;
        }

        try {
            tronWeb.transactionBuilder.triggerSmartContract(TRON_TEXAS_PAY_ADDR, FUNC_SELECTOR_BUYOUT, options,
                pamarmArray, async (err, transaction) => {
                if (err) {
                    loggerDefault.error(err);
                    cb(false, null);
                    return;
                }
                try {
                    let sendRet = {result: true};
                    let signData = await tronWeb.trx.sign(transaction.transaction).catch((ex) => {
                        sendRet.result = false;
                    });

                    if (sendRet.result) { // && process.env.NODE_ENV === 'production') {
                        sendRet = await tronWeb.trx.sendRawTransaction(signData).catch((ex) => {
                            // 什么也不处理
                        });
                    }
                    if (sendRet != null && sendRet.result == true) {
                        cb(true, signData.txID);
                    } else {
                        cb(false, null);
                    }
                } catch(e) {
                    loggerDefault.error("doPayOut调用合约异常1", e);
                    cb(false, null);
                }
            });
        } catch (ex) {
            loggerDefault.error("doPayOut调用合约异常2", ex);
            cb(false, null);
        }
    }

    async doJackpot(order, cb) {
        this.unconfirmedJackpotOrder.set(order.sysTxID, order);
        let options = {
            feeLimit: 1000000,
            callValue: 0,
        };
        // function setJackPot(uint256 sysTX, address winner, uint256 tableId, uint256 cardsType,
        //     uint256 jackpotType, uint256 trxVal, uint256 poolVal)
        let pamarmArray = [
            {type:'uint256', value: '0x' + order.sysTxID},
            {type:'address', value: TronWeb.address.toHex(order.addr)},
            {type:'uint256', value: order.tableId},
            {type:'uint256', value: order.cardShow},
            {type:'uint256', value: order.jackpotType},
            {type:'uint256', value: order.trxAmount},
            {type:'uint256', value: order.poolAmount},
        ];

        let tronWeb = await getTronWeb();
        if (!tronWeb) {
            loggerDefault.error("doPayOut时无法初始化tronweb", order.sysTxID);
            cb(false, null);
            return;
        }

        loggerDefault.info('---------doJackpot----------', order);
        order.lastCheckBlock = this.scanedFullBlockId + 10;      // 猜测block, 一般靠前几个区块
        order.lastSubmit = getUnixTimeStamp();
        if (order.status == JACKPOT_STATE.NEW) {
            order.status = JACKPOT_STATE.SUBMITED;
        }

        try {
            tronWeb.transactionBuilder.triggerSmartContract(TRON_TEXAS_JACKPOT_ADDR, FUNC_SELECTOR_JACKPOT, options,
                pamarmArray, async (err, transaction) => {
                if (err) {
                    loggerDefault.error(err);
                    cb(false, null);
                    return;
                }
                try {
                    let sendRet = {result: true};
                    let signData = await tronWeb.trx.sign(transaction.transaction).catch((ex) => {
                        sendRet.result = false;
                    });

                    if (sendRet.result) { // && process.env.NODE_ENV === 'production') {
                        sendRet = await tronWeb.trx.sendRawTransaction(signData).catch((ex) => {
                            // 什么也不处理
                        });
                    }
                    console.log('----------jackpot tx-------------', signData.txID);
                    if (sendRet != null && sendRet.result == true) {
                        cb(true, signData.txID);
                    } else {
                        cb(false, null);
                    }
                } catch(e) {
                    loggerDefault.error("doJackpot调用合约异常1", e);
                    cb(false, null);
                }
            });
        } catch (ex) {
            loggerDefault.error("doJackpot调用合约异常2", ex);
            cb(false, null);
        }
    }

    async init(lobby) {
        LobbyInstance = lobby;

        // 同步落后的区块
        let { fullId, solidityId } = await dbService.getLastBlockId();

        if (fullId > this.scanedFullBlockId) {
            this.scanedFullBlockId = fullId;
        } else {
            fullId = this.scanedFullBlockId;
        }

        if (solidityId > this.scanedSolidityBlockId) {
            this.scanedSolidityBlockId = solidityId;
        } else {
            solidityId = this.scanedSolidityBlockId;
        }

        console.log(fullId, solidityId);

        // 加载未完成的订单
        await this.loadBuyInOrder();
        await this.loadBuyOutOrder();
        await this.loadJackpotOrder();

        let tronWeb = await getTronWeb(3);
        if (tronWeb) {
            loggerDefault.info("using tronWeb fullnode => " + tronWeb.fullNode.host + "; soliditynode => " + tronWeb.solidityNode.host);
        } else {
            loggerDefault.error("tronWeb is null!");
            process.exit(0);
        }

        let currentFullBlock = await tronWeb.trx.getCurrentBlock().catch((e) => {
            loggerDefault.error("scanService init 异常" + (e.stack || ''));
            process.exit(0);
        });
        let currentSolidityBlock = await tronWeb.trx.getConfirmedCurrentBlock().catch((e) => {
            loggerDefault.error("scanService init 异常" + (e.stack || ''));
            process.exit(0);
        });
        if (currentFullBlock == null || currentSolidityBlock == null) {
            loggerDefault.error("scanService init 异常" + (e.stack || ''));
            process.exit(0);
        }

        let latestFullBlockNumber = currentFullBlock.block_header.raw_data.number;
        if (latestFullBlockNumber == null) {
            loggerDefault.error("无法获取最新FullNode区块号!");
            process.exit(0);
        }
        loggerDefault.info("当前FullNode区块号:", latestFullBlockNumber);

        let latestSolidityBlockNumber = currentSolidityBlock.block_header.raw_data.number;
        if (latestSolidityBlockNumber == null) {
            loggerDefault.error("无法获取最新SolidityNode区块号!");
            process.exit(0);
        }
        loggerDefault.info("当前SolidityNode区块号:", latestSolidityBlockNumber);

        if (fullId < latestFullBlockNumber) {
            loggerDefault.info("FullNode同步落后区块, blockNumber:", fullId + 1);
            await this.scanFullBlock(fullId + 1);
        } else {
            loggerDefault.info("FullNode直接同步后续区块, blockNumber:", fullId + 1);
            PokerScanEvent.emit("scanFull", fullId + 1, 1500);
        }

        if (solidityId < latestSolidityBlockNumber) {
            loggerDefault.info("SolidityNode同步落后区块, blockNumber:", solidityId + 1);
            await this.scanSolidityBlock(solidityId + 1);
        } else {
            loggerDefault.info("SolidityNode直接同步后续区块, blockNumber:", solidityId + 1);
            PokerScanEvent.emit("scanSolidity", solidityId + 1, 1500);
        }

        PokerScanEvent.emit("updateOrder", 10000);
    }

    async loadBuyInOrder() {
        let data = await dbService.getPayInOrder();
        if (data.ret == false) {
            loggerDefault.error("PayIno无法获取未完成订单!");
            process.exit(0);
        }

        for (let row of data.dataRow) {
            let order = {
                txID: row.txID,
                addr: row.addr,
                tableId: row.tableId,
                trxAmount: row.trxAmount,
                paytime: row.paytime,
                blockId: row.blockId,
                status: row.status,
                lastUpdate: row.lastUpdate,
                checkCnt: 2,                // 从数据库里面加载出来的记录只需要再被确认一次
            };

            this.unconfirmedPayInOrder.set(order.txID, order);
        }
        loggerDefault.info("loadBuyInOrder 完成, 数量:" + this.unconfirmedPayInOrder.size);
    }

    async loadBuyOutOrder() {
        let data = await dbService.getPayOutOrder();
        if (data.ret == false) {
            loggerDefault.error("PayOut无法获取未完成订单!");
            process.exit(0);
        }

        for (let row of data.dataRow) {
            let order = {
                sysTxID: row.sysTxID,
                txID: row.txID,
                addr: row.addr,
                tableId: row.tableId,
                trxAmount: row.trxAmount,
                paytime: row.paytime,
                blockId: row.blockId,
                status: row.status,
                lastUpdate: row.lastUpdate,
                optype: row.optype,
                lastCheckBlock: this.scanedSolidityBlockId,
                lastSubmit: 0,
                retry: row.retry || 0
            };

            // if (process.env.NODE_ENV === 'production') {
                this.unconfirmedPayOutOrder.set(order.sysTxID, order);
            // }
        }
        loggerDefault.info("loadBuyOutOrder 完成, 数量:" + this.unconfirmedPayOutOrder.size);
    }

    async loadJackpotOrder() {
        let data = await dbService.getJackpotOrder();
        if (data.ret == false) {
            loggerDefault.error("Jackpot无法获取未完成订单!");
            process.exit(0);
        }

        for (let row of data.dataRow) {
            let order = {
                sysTxID: row.sysTxID,
                txID: row.txID,
                blockId: row.blockId,
                addr: row.addr,
                tableId: row.tableId,
                cardShow: row.cardShow,
                jackpotType: row.jackpotType,
                trxAmount: row.trxAmount,
                poolAmount: row.poolAmount,
                paytime: row.paytime,
                status: row.status,
                lastUpdate: row.lastUpdate,
                lastCheckBlock: this.scanedSolidityBlockId,
                lastSubmit: 0,
                retry: row.retry || 0
            };

            // if (process.env.NODE_ENV === 'production') {
                this.unconfirmedJackpotOrder.set(order.sysTxID, order);
            // }
        }
        loggerDefault.info("loadJackpotOrder 完成, 数量:" + this.unconfirmedJackpotOrder.size);
    }

    // 轮询未确认的订单, 确认后向牌桌通知
    async updateOrderMap(delay) {
        delay = delay || 100;
        await sleep(delay);

        TexasScan.getInstance().scanOrderMap();
    }

    async scanNextFullBlock(nextBlockId, delay) {
        delay = delay || 10;
        await sleep(delay);

        TexasScan.getInstance().scanFullBlock(nextBlockId);
    }

    async scanSolidityFullBlock(nextBlockId, delay) {
        delay = delay || 10;
        await sleep(delay);

        TexasScan.getInstance().scanSolidityBlock(nextBlockId);
    }

    changeScanedBlockId(change) {
        if (change || this.scanedFullBlockId % 10 == 0) {
            dbService.saveScanedBlock(this.scanedFullBlockId, this.scanedSolidityBlockId);
        }
    }

    async scanFullBlock(blockNumber) {
        if (this.stoped) { return; }
        let tronWeb = await getTronWeb();
        if (tronWeb == null) {
            loggerDefault.error("full tronWeb lost connection!");
            PokerScanEvent.emit("scanFull", blockNumber, 2500);     //继续扫描当前区块
            return;
        }

        let block = await tronWeb.trx.getBlockByNumber(blockNumber).catch((e) => {
            // 什么也不处理
        });

        if (block == null || _.isEmpty(block) || block.block_header == null || block.block_header.raw_data == null) {
            PokerScanEvent.emit("scanFull", blockNumber, 2500);     //继续扫描当前区块
            return;
        }

        let ts = block.block_header.raw_data.timestamp;
        let transactions = block.transactions;
        if (transactions && !_.isEmpty(transactions) && Array.isArray(transactions) && transactions.length > 0) {
            if (blockNumber % 100 == 0) {
                loggerDefault.info("-----------FullNode[%s] [%s个交易] at %s-----------", blockNumber, transactions.length, moment(ts).format('YYYY-MM-DD HH:mm:ss'));
            }

            let texasTxArray = [];
            for (let txData of transactions) {
                let contractRet = txData.ret[0].contractRet;
                if (contractRet !== 'SUCCESS') {
                    continue;
                }
                let contract_data = txData.raw_data.contract[0];
                if (contract_data.type !== 'TriggerSmartContract' || contract_data.parameter == null || contract_data.parameter.value == null) {
                    continue;
                }
                let contract_address = contract_data.parameter.value.contract_address;
                if (contract_address === TRON_TEXAS_PAY_ADDR) {
                    let func = contract_data.parameter.value.data.substr(0, 8);
                    // PayOut相关的订单不用管, 只要Solidity确认即可
                    if (func === FUNC_TEXAS_BUYIN) {
                        texasTxArray.push(txData);
                    }
                }
            }

            if (texasTxArray.length == 0) {
                this.scanedFullBlockId = blockNumber;
                this.changeScanedBlockId(false);
                PokerScanEvent.emit("scanFull", blockNumber + 1, 100);       //继续扫描下一区块
                return;
            }

            let txOrderArray = [];
            let cbCount = 0;
            // TODO: 此处需要测试一个区块多条交易的各种情况
            for (let txData of texasTxArray) {
                this.scanFullBuyInTx(tronWeb, txData, blockNumber, async (order) => {
                    cbCount += 1;
                    if (order != null) {
                        txOrderArray.push(order);
                    }

                    if (cbCount == texasTxArray.length) {
                        if (txOrderArray.length == texasTxArray.length) {
                            let addDBCnt = 0;

                            // 1. 将未确认充值订单写入数据库及缓存, 将扫描到的取款订单
                            for (let order of txOrderArray) {
                                let addRet = await dbService.addPayInOrder(order);
                                if (addRet.ret == true) {
                                    addDBCnt += 1;
                                } else if (addRet.status > 0) {
                                    addDBCnt += 1;
                                    order.status = addRet.status;
                                }
                            }
                            if (addDBCnt == txOrderArray.length) {
                                for (let order of txOrderArray) {
                                    this.unconfirmedPayInOrder.set(order.txID, order);
                                    if (order.status < PayInState.CONFIRMED) {
                                        let setRet = await dbService.updatePayInOrder(order, PayInState.TABLEKNOW);
                                        if (setRet == true) {
                                            order.status = PayInState.TABLEKNOW;
                                            order.lastUpdate = getUnixTimeStamp();
                                            LobbyInstance.sendUnconfirmedOrder(order);
                                        } else {
                                            loggerDefault.error("scanFullBlock.updatePayInOrder更新异常1!!!!!!!!!", order.txID);
                                        }
                                    }
                                }
                                this.scanedFullBlockId = blockNumber;
                                this.changeScanedBlockId(true);
                                PokerScanEvent.emit("scanFull", blockNumber + 1, 100);
                            } else {
                                loggerDefault.error("没有把所有交易都写入Mysql", cbCount, addDBCnt);
                                PokerScanEvent.emit("scanFull", blockNumber, 2500);       //继续扫描当前区块
                            }
                        } else {
                            loggerDefault.error("未能解析出所有的PayIn订单", cbCount, txOrderArray.length);
                            PokerScanEvent.emit("scanFull", blockNumber, 1500);       //继续扫描当前区块
                        }
                    }
                });
            }
        } else {
            if (blockNumber % 100 == 0) {
                loggerDefault.info("-----------FullNode[%s] [%s个交易] at %s-----------", blockNumber, 0, moment(ts).format('YYYY-MM-DD HH:mm:ss'));
            }
            this.scanedFullBlockId = blockNumber;
            this.changeScanedBlockId(false);
            PokerScanEvent.emit("scanFull", blockNumber + 1, 1000);     //继续扫描下一区块
        }
    }

    async scanSolidityBlock(blockNumber) {
        if (this.stoped) { return; }

        let tronWeb = await getTronWeb(2);
        if (tronWeb == null) {
            loggerDefault.error("solidity tronWeb lost connection!");
            PokerScanEvent.emit("scanSolidity", blockNumber, 1000);     //继续扫描当前区块
            return;
        }

        if ((this.scanedFullBlockId - this.scanedSolidityBlockId) < 5) {
            PokerScanEvent.emit("scanSolidity", blockNumber, 1000);     //继续扫描当前区块
            return;
        }

        let block = await tronWeb.getConfirmedBlockByNumber(blockNumber).catch((e) => {
            // 什么也不处理
        });

        if (block == null || _.isEmpty(block)) {
            PokerScanEvent.emit("scanSolidity", blockNumber, 2500);     //继续扫描当前区块
            return;
        }

        let ts = block.block_header.raw_data.timestamp;
        let transactions = block.transactions;
        if (transactions && !_.isEmpty(transactions) && Array.isArray(transactions) && transactions.length > 0) {
            if (blockNumber % 100 == 0) {
                loggerDefault.info("_________SolidityNode[%s] [%s个交易] at %s_________", blockNumber, transactions.length, moment(ts).format('YYYY-MM-DD HH:mm:ss'));
            }

            let stexasTxArray = [];
            for (let txData of transactions) {
                let contractRet = txData.ret[0].contractRet;
                if (contractRet !== 'SUCCESS') {
                    continue;
                }
                let contract_data = txData.raw_data.contract[0];
                if (contract_data.type !== 'TriggerSmartContract' || contract_data.parameter == null || contract_data.parameter.value == null) {
                    continue;
                }
                let contract_address = contract_data.parameter.value.contract_address;
                if (contract_address === TRON_TEXAS_PAY_ADDR) {
                    let func = contract_data.parameter.value.data.substr(0, 8);
                    if (func == FUNC_TEXAS_BUYOUT) {
                        stexasTxArray.push(txData);
                    }
                } else if (contract_address == TRON_TEXAS_JACKPOT_ADDR) {
                    let func = contract_data.parameter.value.data.substr(0, 8);
                    if (func == FUNC_TEXAS_JACKPOT) {
                        stexasTxArray.push(txData);
                    }
                }
            }

            if (stexasTxArray.length == 0) {
                this.scanedSolidityBlockId = blockNumber;
                PokerScanEvent.emit("scanSolidity", blockNumber + 1, 100);       //继续扫描下一区块
                return;
            }

            let txOrderArray = [];
            let cbCount = 0;
            for (let txData of stexasTxArray) {
                // 如果是payOut的订单, 将未确认的订单状态设置为已确认
                this.scanSoldityBuyInTx(tronWeb, txData, blockNumber, async (order) => {
                    cbCount += 1;
                    if (order != null) {
                        txOrderArray.push(order);
                    }
                    if (cbCount == stexasTxArray.length) {
                        if (txOrderArray.length == stexasTxArray.length) {
                            for (let order of txOrderArray) {
                                // 已确认提款订单预处理, 如果处理失败, 等待定时扫描
                                if (order.orderType == 1) {
                                    this.PayOutPretreatment(order);
                                } else {
                                    this.JackpotPretreatment(order);
                                }
                            }
                            this.scanedSolidityBlockId = blockNumber;
                            this.changeScanedBlockId(true);
                            PokerScanEvent.emit("scanSolidity", blockNumber + 1, 100);       //继续扫描下一区块
                        } else {
                            loggerDefault.error("未能解析出所有的PayOut订单", cbCount, txOrderArray.length);
                            PokerScanEvent.emit("scanSolidity", blockNumber, 2500);       //继续扫描当前区块
                        }
                    }
                });
            }
        } else {
            if (blockNumber % 100 == 0) {
                loggerDefault.info("_________SolidityNode[%s] [%s个交易] at %s_________", blockNumber, 0, moment(ts).format('YYYY-MM-DD HH:mm:ss'));
            }
            this.scanedSolidityBlockId = blockNumber;
            PokerScanEvent.emit("scanSolidity", blockNumber + 1, 1500);     //继续扫描下一区块
        }
    }

    async scanFullBuyInTx(tronWeb, txData, blockNumber, callback) {
        try {
            let paramVal = txData.raw_data.contract[0].parameter.value;
            let callValue = paramVal.call_value;
            let ownerAddr = TronWeb.address.fromHex(paramVal.owner_address);
            let timestamp = Math.floor((txData.raw_data.timestamp || 0) / 1000);
            let txInfo = await tronWeb.getTransactionInfoUnconfirmed(txData.txID).catch((e) => {
                // 什么也不处理
            });
            if (txInfo == null || txInfo.log == null || !Array.isArray(txInfo.log)) {
                loggerDefault.error("获取TX_INFO内容不合法");
                callback(null);
                return;
            }

            let logArray = txInfo.log;
            for (let log of logArray) {
                let address = log.address;
                let topics = log.topics;
                let data = log.data;

                if (address === ETH_TEXAS_PAY_ADDR && topics[0] == EVENT_TEXAS_BUYIN) {
                    let order = {
                        txID: txData.txID,
                        addr: TronWeb.address.fromHex('41' + topics[1].substr(24, 40)),
                        tableId: strUtil.hexStringToInt(data.substr(0, 64)),
                        trxAmount: strUtil.hexStringToInt(data.substr(64, 64)),
                        paytime: timestamp,
                        blockId: blockNumber,
                        status: PayInState.NEW,
                        lastUpdate: timestamp,
                        checkCnt: 0,
                    }
                    if (callValue != order.trxAmount || ownerAddr != order.addr) {
                        loggerDefault.error("PayIn参数与事件不一致, callValue[%s,%s], owerAddr[%s,%s]!!!", callValue, order.trxAmount, ownerAddr,  order.addr);
                    }

                    callback(order);
                    return;
                }
            }
            callback(null);
        } catch (ex) {
            loggerDefault.error("scanBuyInTx 异常", ex);
            callback(null);
        }
    }

    async scanSoldityBuyInTx(tronWeb, txData, blockNumber, callback) {
        try {
            let timestamp = Math.floor((txData.raw_data.timestamp || 0) / 1000);
            let txInfo = await tronWeb.trx.getTransactionInfo(txData.txID).catch((e) => {
                // 什么也不做
            });
            if (txInfo == null || txInfo.log == null || !Array.isArray(txInfo.log)) {
                loggerDefault.error("获取TX_INFO内容不合法");
                callback(null);
                return;
            }

            let logArray = txInfo.log;
            for (let log of logArray) {
                let address = log.address;
                let topics = log.topics;
                let data = log.data;
                if (address === ETH_TEXAS_PAY_ADDR && topics[0] == EVENT_TEXAS_SITOUT) {
                    let outOrder = {
                        orderType: 1,           // payout
                        sysTxID: topics[1],
                        txID: txData.txID,
                        addr: TronWeb.address.fromHex('41' + topics[2].substr(24, 40)),
                        tableId: strUtil.hexStringToInt(data.substr(0, 64)),
                        trxAmount: strUtil.hexStringToInt(data.substr(64, 64)),
                        optype: strUtil.hexStringToInt(data.substr(128, 64)),
                        paytime: timestamp,
                        blockId: blockNumber,
                        status: PayOutState.CONFIRMED,
                        lastUpdate: timestamp,
                    };
                    callback(outOrder);
                    return;
                } else if (address == ETH_TEXAS_JACKPOT_ADDR && topics[0] == EVENT_TEXAS_JACKPOT) {
                    let jpOrder = {
                        orderType: 2,           // jackpot
                        sysTxID: topics[3],
                        txID: txData.txID,
                        addr: TronWeb.address.fromHex('41' + topics[2].substr(24, 40)),
                        tableId: strUtil.hexStringToInt(data.substr(0, 64)),
                        cardShow: strUtil.hexStringToInt(data.substr(64, 64)),
                        jackpotType: strUtil.hexStringToInt(data.substr(128, 64)),
                        trxAmount: strUtil.hexStringToInt(data.substr(192, 64)),
                        poolAmount: strUtil.hexStringToInt(data.substr(256, 64)),
                        paytime: timestamp,
                        blockId: blockNumber,
                        status: JACKPOT_STATE.CONFIRMED,
                        lastUpdate: timestamp,
                    };
                    callback(jpOrder);
                    return;
                } else {
                    loggerDefault.error('Address: %s, topics: %s', address, topics[0] || '');
                }
            }
            callback(null);
        } catch (ex) {
            loggerDefault.error("scanBuyInTx 异常", ex);
            callback(null);
        }
    }

    // 已确认提款订单预处理, 如果处理失败, 等待定时扫描
    async PayOutPretreatment(cpOrder) {
        let realOrder = this.unconfirmedPayOutOrder.get(cpOrder.sysTxID);
        let tmNow = getUnixTimeStamp();
        if (realOrder == null) {
            loggerDefault.error("提款订单异常, Solidity里面能扫出来, unconfirmedPayOutOrder里面没有: [txId:%s, addr:%s, trx:%s]", cpOrder.txID, TronWeb.address.fromHex(cpOrder.addr), cpOrder.trxAmount);

            // 强制记录到日志
            cpOrder.status = PayOutState.UNSAFE_CONFIRMED;
            let addRet = await dbService.addPayOutOrder(cpOrder);
            if (addRet == null || addRet.ret == false) {
                dbService.updatePayOutOrder(cpOrder.sysTxID,
                    {txID: cpOrder.txID, blockId: cpOrder.blockId, status: cpOrder.status, retry:0, lastUpdate:tmNow});
            }
            logService.addPayOutLog(cpOrder);
            let optype = cpOrder.optype || REVENUE_OPTYPE.PAYOUT_UNKONW;
            if (optype < 200) {
                let oldAmount = realOrder.oldAmount || realOrder.trxAmount;
                let newAmount = realOrder.newAmount || 0;
                logService.addRevenueLog(cpOrder.addr, cpOrder.tableId, cpOrder.no || 0, cpOrder.trxAmount, oldAmount, newAmount, optype)
            }

            return;
        }
        if (realOrder.checking == true) {
            return;         // 正在被定时检测
        }
        if (realOrder.addr != cpOrder.addr || realOrder.trxAmount != cpOrder.trxAmount || realOrder.tableId != cpOrder.tableId) {
            loggerDefault.error("提款订单前后不一致: addr[%s <--> %s], tableId[%s <--> %s], trx[%s <--> %s]", realOrder.addr, cpOrder.addr, realOrder.tableId, cpOrder.tableId, realOrder.trxAmount, cpOrder.trxAmount);
            // TODO: 这里可以暂时不检测
            // return;
        }

        realOrder.txID = cpOrder.txID;
        realOrder.checking = true;
        let setRet = await dbService.updatePayOutOrder(realOrder.sysTxID,
            {txID: cpOrder.txID, blockId: cpOrder.blockId, status: PayOutState.CONFIRMED, retry: realOrder.retry, lastUpdate:tmNow});
        realOrder.checking = false;
        logService.addPayOutLog(realOrder);
        let optypeReal = realOrder.optype;
        if (optypeReal < 200) {
            let oldAmount = realOrder.oldAmount || realOrder.trxAmount;
            let newAmount = realOrder.newAmount || 0;
            logService.addRevenueLog(realOrder.addr, realOrder.tableId, realOrder.no || 0, realOrder.trxAmount, oldAmount, newAmount, optypeReal)
        }

        if (setRet == true) {
            realOrder.status = PayOutState.CONFIRMED;
            realOrder.lastUpdate = getUnixTimeStamp();       // 等待删除
        } else {
            loggerDefault.error("PayOutPretreatment.updatePayOutOrder更新异常!!!!!!!!!", realOrder.txID);
        }
    }

    async JackpotPretreatment(cpOrder) {
        let realOrder = this.unconfirmedJackpotOrder.get(cpOrder.sysTxID);
        let tmNow = getUnixTimeStamp();
        if (realOrder == null) {
            loggerDefault.error("Jackpot订单异常, Solidity里面能扫出来, unconfirmedJackpotOrder里面没有: [txId:%s, addr:%s, trx:%s]", cpOrder.txID, TronWeb.address.fromHex(cpOrder.addr), cpOrder.trxAmount);
            cpOrder.status = JACKPOT_STATE.UNSAFE_CONFIRMED;
            let addRet = await dbService.addJackpotOrder(cpOrder);
            if (addRet == null || addRet.ret == false) {
                dbService.updateJackpotOrder(cpOrder.sysTxID,
                    {txID: cpOrder.txID, blockId: cpOrder.blockId, status: cpOrder.status, retry:0, lastUpdate:tmNow});
            }
            return;
        }
        if (realOrder.checking == true) {
            return;         // 正在被定时检测
        }

        realOrder.txID = cpOrder.txID;
        realOrder.checking = true;
        let setRet = await dbService.updateJackpotOrder(realOrder.sysTxID,
            {txID: cpOrder.txID, blockId: cpOrder.blockId, status: JACKPOT_STATE.CONFIRMED, retry: realOrder.retry, lastUpdate:tmNow});
        realOrder.checking = false;

        if (setRet == true) {
            realOrder.status = JACKPOT_STATE.CONFIRMED;
            realOrder.lastUpdate = getUnixTimeStamp();       // 等待删除
        } else {
            loggerDefault.error("JackpotPretreatment.updateJackpotOrder更新异常!!!!!!!!!", realOrder.txID);
        }
    }

    clearPayInOrders() {
        // 先清理掉已经完成的
        if (this.unconfirmedPayInOrder.size <= 0) {
            return;
        }

        let compeleteArray = [];
        for (let [txID, order] of this.unconfirmedPayInOrder) {
            if (order.status >= PayInState.CONFIRMED) {
                compeleteArray.push(txID);
            }
        }

        for (let txID of compeleteArray) {
            this.unconfirmedPayInOrder.delete(txID);
        }
    }

    clearPayOutOrders() {
        // 先清理掉已经完成的
        if (this.unconfirmedPayOutOrder.size <= 0) {
            return;
        }

        let compeleteArray = [];
        for (let [txID, order] of this.unconfirmedPayOutOrder) {
            if (order.status >= PayOutState.CONFIRMED) {
                compeleteArray.push(txID);
            }
        }

        for (let txID of compeleteArray) {
            this.unconfirmedPayOutOrder.delete(txID);
        }
    }

    clearJackpotOrders() {
        if (this.unconfirmedJackpotOrder.size <= 0) {
            return;
        }

        let compeleteArray = [];
        for (let [txID, order] of this.unconfirmedJackpotOrder) {
            if (order.status >= JACKPOT_STATE.CONFIRMED) {
                compeleteArray.push(txID);
            }
        }

        for (let txID of compeleteArray) {
            this.unconfirmedJackpotOrder.delete(txID);
        }
    }

    async reportConfirmed(order) {
        if (order.checkCnt >= 3) {
            let setRet = await dbService.updatePayInOrder(order, PayInState.CONFIRMED);
            order.checking = false;
            if (setRet == true) {
                order.status = PayInState.CONFIRMED;
                order.lastUpdate = getUnixTimeStamp();
                // 通知牌桌订单已确认
                LobbyInstance.sendConfirmedOrder(order);
                logService.addPayInLog(order);
            } else {
                loggerDefault.error("PayInPretreatment.updatePayInOrder更新异常2!!!!!!!!!", order.txID);
            }
        } else {
            order.checking = false;
        }
    }

    async checkConfirmBuyInOrder(order) {
        order.checking = true;

        if (order.checkCnt >= 3) {
            this.reportConfirmed(order);
        }

        // 两个节点确认都能存在则确认一次, 至少确认3次
        let tronWeb = await getTronWeb();

        let txInfo1 = await tronWeb.getTransactionInfoUnconfirmed(order.txID).catch((e) => {
            // 什么也不做
        });
        if (txInfo1 == null) {
            order.checking = false;
            return;
        }

        let tronWeb2 = await getTronWebNot(tronWeb.nodeId);
        let txInfo2 = await tronWeb2.getTransactionInfoUnconfirmed(order.txID).catch((e) => {
            // 什么也不做
        });;
        if (txInfo2 == null) {
            order.checking = false;
            return;
        }


        order.checkCnt += 1;
        order.checking = false;
        if (order.checkCnt >= 3) {
            this.reportConfirmed(order);
        }
    }

    async checkRollbackBuyInOrder(order) {
        order.checking = true;
        let tronWeb = await getTronWeb(2);
        try {
            let txInfo = await tronWeb.trx.getTransactionInfo(order.txID).catch((e) => {
                // 什么也不做
            });
            if (txInfo != null) {
                order.checkCnt = 99;
                order.checking = false;
                this.reportConfirmed(order);
            } else {
                let setRet = await dbService.updatePayInOrder(order, PayInState.ROLLBACK);
                order.checking = false;
                if (setRet == true) {
                    order.status = PayInState.ROLLBACK;
                    order.lastUpdate = getUnixTimeStamp();
                    // 通知牌桌订单已回滚
                    LobbyInstance.rollbackOrder(order);
                } else {
                    loggerDefault.error("checkRollbackBuyInOrder.updatePayInOrder更新异常4!!!!!!!!!", order.txID);
                }
            }
        } catch(e) {
            order.checking = false;
            loggerDefault.error("checkRollbackBuyInOrder exception", e);
        }
    }

    getOffsetInterval(retryCnt) {
        if (retryCnt < 3) {
            return 30;
        } else if (retryCnt < 6) {
            return 60;
        } else if (retryCnt < 15) {
            return 300;
        } else if (retryCnt < 25) {
            return 3600;
        } else if (retryCnt < 50) {
            return 14400;
        } else {
            return 43200;
        }
    }

    async scanOrderMap() {
        //console.log("---------scanOrderMap----------", this.stoped);
        if (this.stoped) { return; }

        // 清理无用订单
        this.clearPayInOrders();
        this.clearPayOutOrders();
        this.clearJackpotOrders();

        if (this.unconfirmedPayInOrder.size <= 0 && this.unconfirmedPayOutOrder.size <= 0 && this.unconfirmedJackpotOrder.size <= 0) {
            PokerScanEvent.emit("updateOrder", 2000);
            return;
        }
        for (let [txID, order] of this.unconfirmedPayInOrder) {
            if (order.status == PayInState.NEW) {
                let setRet = await dbService.updatePayInOrder(order, PayInState.TABLEKNOW);
                if (setRet == true) {
                    order.status = PayInState.TABLEKNOW;
                    order.lastUpdate = getUnixTimeStamp();
                    // 通知牌桌有新的订单
                    LobbyInstance.sendUnconfirmedOrder(order);
                } else {
                    loggerDefault.error("scanOrderMap.updatePayInOrder更新异常3!!!!!!!!!", txID);
                }
            } else if (order.status == PayInState.TABLEKNOW) {
                if (order.checking == true) {
                    continue;
                }

                // 1. 先检测是不是该区块已经被Solidity确认, 如果是直接去Solidity节点确认
                // 2. 否则看是否已经超过5个区块, 然后开始3次不同节点的确认
                if (this.scanSolidityFullBlock > order.blockId) {
                    this.checkRollbackBuyInOrder(order);
                } else if (this.scanedFullBlockId - order.blockId >= 5) {
                    this.checkConfirmBuyInOrder(order);
                }
            }
        }

        let tmNow = getUnixTimeStamp();
        for (let [tx, order] of this.unconfirmedPayOutOrder) {
            if (order.checking == true) {
                continue;
            }

            if (order.status == PayOutState.NEW) {
                // 重新提交到链上
                order.checking = true;
                this.doPayOut(order, async (ret, txID) => {
                    if (ret) {
                        order.status = PayOutState.SUBMITED;
                        order.txID = txID;
                        await dbService.updatePayOutOrder(order.sysTxID, {txID, status: PayOutState.SUBMITED});
                    } else {
                        loggerDefault.error("withdraw调用合约失败2!!!", order.sysTxID);
                    }
                    order.checking = false;
                });
            } else if (order.status == PayOutState.SUBMITED) {
                // 如果当前已检测Solidity区块>该order的lastCheckBlock, 则重新提交一次
                if (this.scanedSolidityBlockId <= order.lastCheckBlock) {
                    continue;
                }
                let secOffset = this.getOffsetInterval(order.retry || 0);
                if (tmNow <= (order.lastSubmit || 0) + secOffset) {
                    continue;
                }

                order.checking = true;
                this.doPayOut(order, async (ret, txID) => {
                    if (ret) {
                        order.retry = order.retry + 1;
                        order.txID = txID;
                        let uRet = await dbService.updatePayOutOrder(order.sysTxID,
                            {txID: txID, blockId: order.blockId, status: PayOutState.SUBMITED, retry: order.retry, lastUpdate: tmNow});
                        if (uRet) {
                            logService.addPayOutRetryLog(order.sysTxID, order.txID, order.trxAmount, order.tableId || 0);
                        }
                    } else {
                        loggerDefault.error("withdraw调用合约失败3!!!", order.sysTxID);
                    }
                    order.checking = false;
                });
            }
        }

        for (let [tx, order] of this.unconfirmedJackpotOrder) {
            if (order.checking == true) {
                continue;
            }

            if (order.status == JACKPOT_STATE.NEW) {
                // 重新提交到链上
                order.checking = true;
                this.doJackpot(order, async (ret, txID) => {
                    if (ret) {
                        order.status = JACKPOT_STATE.SUBMITED;
                        order.txID = txID;
                        await dbService.updateJackpotOrder(order.sysTxID, {txID, status: JACKPOT_STATE.SUBMITED});
                    } else {
                        loggerDefault.error("doJackpot调用合约失败2!!!", order.sysTxID);
                    }
                    order.checking = false;
                });
            } else if (order.status == JACKPOT_STATE.SUBMITED) {
                // 如果当前已检测Solidity区块>该order的lastCheckBlock, 则重新提交一次
                if (this.scanedSolidityBlockId <= order.lastCheckBlock) {
                    continue;
                }
                let secOffset = this.getOffsetInterval(order.retry || 0);
                if (tmNow <= (order.lastSubmit || 0) + secOffset) {
                    continue;
                }

                order.checking = true;
                this.doJackpot(order, async (ret, txID) => {
                    if (ret) {
                        order.retry = order.retry + 1;
                        order.txID = txID;
                        await dbService.updateJackpotOrder(order.sysTxID,
                            {txID: txID, blockId: order.blockId, status: JACKPOT_STATE.SUBMITED, retry: order.retry, lastUpdate: tmNow});
                    } else {
                        loggerDefault.error("doJackpot调用合约失败3!!!", order.sysTxID);
                    }
                    order.checking = false;
                });
            }
        }

        PokerScanEvent.emit("updateOrder", 3001);
    }
}

function sleep(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}

PokerScanEvent.on('scanFull', TexasScan.getInstance().scanNextFullBlock);
PokerScanEvent.on('scanSolidity', TexasScan.getInstance().scanSolidityFullBlock)
PokerScanEvent.on('updateOrder', TexasScan.getInstance().updateOrderMap);


module.exports.TexasScan = TexasScan;
module.exports.PokerScanEvent = PokerScanEvent;
