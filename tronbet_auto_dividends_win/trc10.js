const _ = require('lodash')._;
const BigNumber = require('bignumber.js');
const tronNodePool = require('./src/service/tronNodePool');
const tronSrv = require('./src/service/tronService');
const dbService = require('./src/service/dbService');
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');
const events = require('events');
const appEvent = new events.EventEmitter();
const support_trc10_list = require('./src/configs/config').support_trc10_list;

const BTT_CONFIG = support_trc10_list.BTT;
const tokenID = BTT_CONFIG.tokenID;
const tokenName = BTT_CONFIG.tokenName;
const decimail = BTT_CONFIG.decimail;
const save_token = BTT_CONFIG.save_token;
const poolAddr = BTT_CONFIG.poolAddr;
const awardPK = BTT_CONFIG.awardPK;

async function test() {
    await tronNodePool.init();
    await sleep(5000);
    sendTrc10();
}

// test(); //TODO:

async function sendTrc10() {
    loggerDefault.info("Trc10 token ready go!");

    await sleep(5000);

    let lastestRoundInfo = await dbService.getLastestRoundInfo();

    if (lastestRoundInfo == null) {
        loggerDefault.info("没有分红需求");
        return;
    }

    if (lastestRoundInfo.div_state !== 2) {
        loggerDefault.info("等待WIN分红结束！");
        return;
    }

    let round = lastestRoundInfo.ver;
    if (lastestRoundInfo.btt_state === 0) {
        if (_.isEmpty(lastestRoundInfo.btt_tx)) {

            //
            let value = Math.floor(lastestRoundInfo.btt_total * 0.41);
            loggerDefault.info("BTT开始分红" + value);
            dividend(round, value);
            //

            // loggerDefault.info("BTT开始分红");
            // dividend(round, lastestRoundInfo.btt_total);
        } else {
            loggerDefault.info("等待BTT提款");
            appEvent.emit('checkTx', lastestRoundInfo.btt_tx, tokenID, tokenName, poolAddr, round);
        }
        return;
    } else if (lastestRoundInfo.btt_state === 1) {
        loggerDefault.info("BTT正在分红");
        appEvent.emit('send_BTT', round, tokenID, lastestRoundInfo.btt_total, lastestRoundInfo.btt_tx);
        return;
    } else if (lastestRoundInfo.btt_state === 2) {
        loggerDefault.info("BTT分红已完成");
        return;
    }
}

async function dividend(round) {
    //提款
    loggerDefault.info("scan trc10 info ==> tokenID,tokenName,poolAddr,awardPK,decimail,save_token", tokenID, tokenName, poolAddr, awardPK, decimail, save_token);

    let accountInfo = await tronSrv.getBalance(poolAddr);
    let assetV2 = accountInfo.assetV2;
    loggerDefault.info("accountInfo", assetV2);
    let res = _.find(assetV2, (element) => {
        return Number(element.key) === tokenID;
    });

    if (res == null) {
        loggerDefault.info("No dividends", tokenName);
    } else {
        let balance = (res.value || 0) / Math.pow(10, (decimail || 0));
        let val = res.value - save_token * Math.pow(10, (decimail || 0));
        if(val > 0) val = 1; //TODO:
        loggerDefault.info("Pool Balance =>", tokenName + ":" + balance, "save:" + save_token, "withdraw(sun) =>", val);
        if (val > 0) {
            withdraw(tokenID, tokenName, poolAddr, round);
        } else {
            loggerDefault.info("no enough trc10", tokenName);
            await dbService.updateLastestRoundInfo(round, 0, 'no tx', 2);
            await dbService.updateAllBttTxState(round, 3);
            loggerDefault.info("bye!");
        }
    }
}

async function withdraw(tokenID, tokenName, poolAddr, round) {
    let txWithdraw = await tronSrv.commitTransaction(poolAddr, "transferDivide(uint256,uint256)", 20000000, 0, [{ type: "uint256", value: tokenID }, { type: "uint256", value: round }]);
    let tx_id = txWithdraw.txID;
    loggerDefault.info("txWithdraw submit result:", txWithdraw.result, "withdrawTxID:", tx_id);
    await dbService.updateLastestRoundInfo(round, 0, tx_id, 0);
    appEvent.emit('checkTx', txWithdraw.txID, tokenID, tokenName, poolAddr, round);
}

appEvent.on('checkTx', (tx, tokenID, tokenName, poolAddr, round) => {
    let t = setTimeout(async () => {
        clearTimeout(t);
        let txInfo = await tronSrv.getTransactionInfoById(tx);
        if (txInfo.ret === "UNKNOWN") {
            loggerDefault.info("withdrawTxID: " + tx + " state === UNKNOWN");
            appEvent.emit('checkTx', tx, tokenID, tokenName, poolAddr, round);
        } else if (txInfo.ret === "SUCCESS") {
            loggerDefault.info("withdrawTxID: " + tx + " state === SUCCESS");
            //解析日志 
            let data = txInfo.data;
            let log = data.log[0];
            let flag = hexStringToBigNumber(log.topics[1]).toNumber();
            let _data = log.data;
            let tokenID = hexStringToBigNumber(_data.substr(0, 64)).toNumber();
            let tokenValue = hexStringToBigNumber(_data.substr(64, 64)).toNumber();
            loggerDefault.info("txInfo->event==>", "flag:", flag, "tokenID:", tokenID, "tokenValue:", tokenValue);

            //根据日志中金额发奖
            if (tokenValue > 0) {
                if (tokenName === tokenName) {
                    await dbService.updateLastestRoundInfo(round, tokenValue, tx, 1);
                    appEvent.emit('send_BTT', round, tokenID, tokenValue, tx);
                }
            } else {
                loggerDefault.info(tokenName + "(+" + tokenValue + ")is not enought to dividend!");
            }
        } else if (txInfo.ret === "FAIL") {
            loggerDefault.info("withdrawTxID: " + tx + " state === FAIL");
            loggerDefault.info("withdraw again!");
            withdraw(tokenID, tokenName, poolAddr, round);
        }
    }, 10000);
})

appEvent.on('send_BTT', (round, tokenID, total, tx) => {
    loggerDefault.info("BTT dividends is working !", round, total);
    let t = setTimeout(async () => {
        clearTimeout(t);
        let list = await dbService.getBttRoundInfo(round);
        if (list == null || list.length === 0) {
            loggerDefault.info("all BTT had send!");
            await dbService.updateLastestRoundInfo(round, total, tx, 2);
            return;
        }
        for (let obj of list) {
            let addr = obj.addr;
            let state = obj.btt_state;
            if (state === 2) { //已发送，待确认
                // let isTxOK = await tronSrv.isTxSuccess(obj.btt_tx);
                // let ret = isTxOK.ret;
                // if (ret === "SUCCESS") {
                //     loggerDefault.info("btt => ", addr, "success");
                //     await dbService.updateBttTxInfo(round, addr, 3);
                // } else if (ret === "FAIL") {
                //     loggerDefault.info("btt => ", addr, "fail");
                //     await dbService.updateBttTxInfo(round, addr, 4);
                // } else if (ret === "UNKNOWN") {
                //     let isSolidityTxExists = await tronSrv.isTxSuccessFromSolidity(obj.btt_tx);
                //     ret = isSolidityTxExists.ret;
                //     if (ret === "SUCCESS") {
                //         loggerDefault.info("btt => ", addr, "success");
                //         await dbService.updateBttTxInfo(round, addr, 3);
                //     } else if (ret === "FAIL") {
                //         loggerDefault.info("btt => ", addr, "fail");
                //         await dbService.updateBttTxInfo(round, addr, 4);
                //     } else if (ret === "UNKNOWN") {
                //         loggerDefault.info("unknown tx state");
                //     }
                // }

                tronSrv.isTxSuccess(obj.btt_tx, (err, res) => {
                    if (res === "SUCCESS") {
                        loggerDefault.info("btt => ", addr, "success");
                        dbService.updateBttTxInfo(round, addr, 3);
                    } else if (res === "FAIL") {
                        loggerDefault.info("btt => ", addr, "fail");
                        dbService.updateBttTxInfo(round, addr, 4);
                    } else if (err === "UNKNOWEN") {
                        tronSrv.isTxSuccessFromSolidity(obj.btt_tx, (err, res) => {
                            if (res === "SUCCESS") {
                                loggerDefault.info("btt => ", addr, "success");
                                dbService.updateBttTxInfo(round, addr, 3);
                            } else if (res === "FAIL") {
                                loggerDefault.info("btt => ", addr, "fail");
                                dbService.updateBttTxInfo(round, addr, 4);
                            } else if (err === "UNKNOWN") {
                                loggerDefault.info("unknown tx state");
                            } else {
                                loggerDefault.info(err);
                            }
                        });
                    } else {
                        loggerDefault.info(err);
                    }
                });
            } else {
                let rate = obj.win / obj.total_win;
                let amount = Math.floor(total * rate);
                try {
                    if (amount > 0) {
                        loggerDefault.info("btt => addr, tokeID, amount", addr, tokenID, amount, rate);
                        let txTrc10 = await tronSrv.sendToken(addr, tokenID, amount);
                        // loggerDefault.info('btt_tx = ', txTrc10);
                        if (txTrc10.result === true) {
                            await dbService.addBttTxInfo(round, addr, amount, total, txTrc10.transaction.txID, 2);
                        } else {
                            await dbService.addBttTxInfo(round, addr, amount, total, "", 1);
                        }
                    } else {
                        await dbService.addBttTxInfo(round, addr, amount, total, "", 3);
                    }
                } catch (error) {
                    loggerDefault.warn(error);
                }

            }
        }
        appEvent.emit('send_BTT', round, tokenID, total, tx);
    }, 3000);
});

module.exports.sendTrc10 = sendTrc10;

//######################################
function hexStringToBigNumber(_hexStr) {
    return new BigNumber(_hexStr, 16);
}

function sleep(time = 0) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}
