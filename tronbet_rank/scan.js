const _ = require('lodash')._;
const moment = require('moment');
const events = require('events');
const TronWeb = require('tronweb');
const tronUtil = require('./src/utils/tronUtil');
const appEvent = new events.EventEmitter();
const modelRank = require('./src/models/modelRank');
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('default');
const loggerError = log4js.getLogger('error');
const config = require('./src/configs/config');
const ANTE_CONTRACT_ADDRESS = config.award.anteAddr;
const SCAN_INTERVAL = config.award.SCAN_INTERVAL;
const defaultPk = config.tronConfig.defaultPk;
const defaultAddr = TronWeb.address.fromPrivateKey(defaultPk);

const AWARD_STATUS = {
    NOAWARD: 0, //无需发奖
    NOSEND: 1,  //未发奖
    PENDING: 2, //发奖交易正在确认
    FAIL: 3,    //发奖交易失败
    SUCCESS: 99 //发奖交易成功
}

appEvent.on('scan', () => {
    let t = setTimeout(() => {
        clearTimeout(t);
        scan();
    }, SCAN_INTERVAL);
})

async function init() {
    scan();
}

async function scan() {
    let _now = _.now();
    let awardRoundInfo = await modelRank.getAwardRoundInfo();
    if (awardRoundInfo == null || awardRoundInfo.round === 0) {
        loggerDefault.info("scan.js --> awardRoundInfo == null || awardRoundInfo.round === 0 !!!");
        appEvent.emit('scan');
        return;
    }
    let newest_round = awardRoundInfo.round;
    let create_ts = awardRoundInfo.create_ts;
    loggerDefault.info("scan.js --> [" + moment(_now).format("YYYY-MM-DD hh:mm:ss") + "]" + "scaning... Round:" + newest_round + " deadline:" + moment(create_ts).format("YYYY-MM-DD hh:mm:ss"));
    if (_now - create_ts > 10000) {
        let logs = await modelRank.getRankLogs(newest_round);
        if (logs == null || logs.length === 0) {
            appEvent.emit('scan');
            loggerDefault.info("scan.js --> All have done!!!");
            return;
        }

        loggerDefault.info("scan.js --> Round " + newest_round + " is working!");

        let trx = await getTrxBalance();
        let ante = await getAnteBalance();
        loggerDefault.info("scan.js --> TRX_BALANCE = " + trx + "; ANTE_BALANCE = " + ante);

        for (let log of logs) {
            // loggerDefault.info("scan.js --> log:", log);
            if (log.trx > 0) {
                switch (log.trx_tx_status) {
                    case AWARD_STATUS.NOAWARD:  //0
                        loggerDefault.info("scan.js --> no trx award !!!");
                        break;
                    case AWARD_STATUS.NOSEND:   //1
                        loggerDefault.info("scan.js --> trx award waiting ...");
                        if (trx > log.trx + 1) {
                            await sendTrx(log.round, log.rank, log.addr, log.trx);
                            trx = trx - log.trx;
                        } else {
                            loggerError.error("scan.js --> trx is not enough!", trx, log.trx);
                        }
                        break;
                    case AWARD_STATUS.PENDING:  //2
                        loggerDefault.info("scan.js --> trx award pending ...");
                        await isTxSuccess4trx(log.round, log.rank, log.addr, log.trx_tx);
                        break;
                    case AWARD_STATUS.FAIL:
                        loggerDefault.info("scan.js --> trx award fail !!!");  //3
                        if (trx > log.trx + 1) {
                            loggerDefault.info("scan.js --> trx award resend !!!");  //3
                            await sendTrx(log.round, log.rank, log.addr, log.trx);
                            trx = trx - log.trx;
                        } else {
                            loggerError.error("scan.js --> trx is not enough!", trx, log.trx);
                        }
                        break;
                    case AWARD_STATUS.SUCCESS:  //99
                        loggerDefault.info("scan.js --> trx award success !!!");
                        break;
                }
            }
            if (log.ante > 0) {
                switch (log.ante_tx_status) {
                    case AWARD_STATUS.NOAWARD:  //0
                        loggerDefault.info("scan.js --> no ante award");
                        break;
                    case AWARD_STATUS.NOSEND:   //1
                        loggerDefault.info("scan.js --> ante award waiting ...");
                        if (ante > log.ante) {
                            await sendAnte(log.round, log.rank, log.addr, log.ante);
                            ante = ante - log.ante;
                        } else {
                            loggerError.error("scan.js --> ante is not enough!", ante, log.ante);
                        }
                        break;
                    case AWARD_STATUS.PENDING:  //2
                        loggerDefault.info("scan.js --> ante award pending ...");
                        await isTxSuccess4ante(log.round, log.rank, log.addr, log.ante_tx);
                        break;
                    case AWARD_STATUS.FAIL:
                        loggerDefault.info("scan.js --> ante award fail !!!");  //3
                        if (ante > log.ante) {
                            loggerDefault.info("scan.js --> ante award resend !!!");  //3
                            await sendAnte(log.round, log.rank, log.addr, log.ante);
                            ante = ante - log.ante;
                        } else {
                            loggerError.error("scan.js --> ante is not enough!", ante, log.ante);
                        }
                        break;
                    case AWARD_STATUS.SUCCESS:  //99
                        loggerDefault.info("scan.js --> ante award success !!!");
                        break;
                }
            }
        }
    }
    appEvent.emit('scan');
}

//发送TRX
async function sendTrx(round, rank, addr, trx) {
    try {
        let tx_res = await tronUtil.sendTrx(addr, trx * 1e6);
        let trx_tx = tx_res.transaction.txID;
        if (!_.isEmpty(trx_tx)) {
            let opRes = await modelRank.updateTrxTxStatue(round, rank, addr, trx_tx, AWARD_STATUS.PENDING);
            loggerDefault.info("scan.js --> sendTrx => tx = ", opRes, trx_tx);
        }
    } catch (error) {
        loggerError.error(error);
    }
}

//验证发送TRX交易
async function isTxSuccess4trx(round, rank, addr, trx_tx) {
    try {
        let res = await tronUtil.isTxSuccessBySolidityNode(trx_tx);
        if (res != null) {
            if (res === true) {
                let opRes = await modelRank.updateTrxTxStatue(round, rank, addr, trx_tx, AWARD_STATUS.SUCCESS);
                loggerDefault.info("scan.js --> sendTrx => complete !!!", opRes);
            } else {
                let opRes = await modelRank.updateTrxTxStatue(round, rank, addr, trx_tx, AWARD_STATUS.FAIL);
                loggerDefault.info("scan.js --> sendTrx => fail !!!", opRes);
            }
        } else {
            let _now = _.now();
            let sendInfo = await modelRank.getSendInfo(round, rank, addr);
            if (sendInfo != null && sendInfo.trx_tx === trx_tx && sendInfo.trx_tx_status === AWARD_STATUS.PENDING && (_now - sendInfo.create_ts) > 300000) {
                let opRes = await modelRank.updateTrxTxStatue(round, rank, addr, trx_tx, AWARD_STATUS.FAIL);
                loggerDefault.info("scan.js --> send_trx_tx:" + trx_tx + " timeout > 5min ==> fail ==> resend!!!", opRes);
            } else {
                loggerDefault.info("scan.js --> keep waiting trx tx result ...", trx_tx);
            }
        }
    } catch (error) {
        loggerError.error(error);
    }
}

//发送ANTE
async function sendAnte(round, rank, addr, ante) {
    try {
        let param = [{ type: 'address', value: addr }, { type: 'uint256', value: ante * 1e6 }];
        let tx_res = await tronUtil.tronExec(ANTE_CONTRACT_ADDRESS, 'transfer(address,uint256)', 1000000, 0, param);
        let ante_tx = tx_res.transaction.txID;
        if (!_.isEmpty(ante_tx)) {
            let opRes = await modelRank.updateAnteTxStatue(round, rank, addr, ante_tx, AWARD_STATUS.PENDING);
            loggerDefault.info("scan.js --> sendAnte => tx = ", opRes, ante_tx);
        }
    } catch (error) {
        loggerError.error(error);
    }
}

//验证发送ANTE交易
async function isTxSuccess4ante(round, rank, addr, ante_tx) {
    try {
        let res = await tronUtil.isTxSuccessBySolidityNode(ante_tx);
        if (res != null) {
            if (res === true) {
                let opRes = await modelRank.updateAnteTxStatue(round, rank, addr, ante_tx, AWARD_STATUS.SUCCESS);
                loggerDefault.info("scan.js --> sendAnte => complete !!!", opRes);
            } else {
                let opRes = await modelRank.updateAnteTxStatue(round, rank, addr, ante_tx, AWARD_STATUS.FAIL);
                loggerDefault.info("scan.js --> sendAnte => fail !!!", opRes);
            }
        } else {
            let _now = _.now();
            let sendInfo = await modelRank.getSendInfo(round, rank, addr);
            if (sendInfo != null && sendInfo.ante_tx === ante_tx && sendInfo.ante_tx_status === AWARD_STATUS.PENDING && (_now - sendInfo.create_ts) > 300000) {
                let opRes = await modelRank.updateAnteTxStatue(round, rank, addr, ante_tx, AWARD_STATUS.FAIL);
                loggerDefault.info("scan.js --> send_ante_tx:" + ante_tx + " timeout > 5min ==> fail ==> resend!!!", opRes);
            } else {
                loggerDefault.info("scan.js --> keep waiting ante tx result ...", ante_tx);
            }
        }
    } catch (error) {
        loggerError.error(error);
    }
}

//查询TRX余额
async function getTrxBalance() {
    let res = await tronUtil.getAccount(defaultAddr);
    return res ? (res.balance ? res.balance / 1e6 : 0) : 0;
}

//查询ANTE余额
async function getAnteBalance() {
    try {
        let param = [{ type: 'address', value: defaultAddr }];
        let res = await tronUtil.tronQuery(ANTE_CONTRACT_ADDRESS, 'balanceOf(address)', param);
        return tronUtil.hexStringToBigNumber(res).div(1e6).toNumber();
    } catch (error) {
        loggerError.error("scan.js --> ", error);
        return 0;
    }
}

module.exports.init = init;