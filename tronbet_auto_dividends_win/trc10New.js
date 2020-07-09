const _ = require('lodash')._;
const BigNumber = require('bignumber.js');
const tronNodePool = require('./src/service/tronNodePool');
const tronSrv = require('./src/service/tronService');
const bttService = require('./src/service/bttService');
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
// const loggerError = log4js.getLogger('error');
const events = require('events');
const appEvent = new events.EventEmitter();
const { app, support_trc10_list } = require('./src/configs/config');

const BTT_CONFIG = support_trc10_list.BTT;
const tokenID = BTT_CONFIG.tokenID;
const tokenName = BTT_CONFIG.tokenName;
const decimail = BTT_CONFIG.decimail;
const save_token = BTT_CONFIG.save_token;
const poolAddr = BTT_CONFIG.poolAddr;
const awardPK = BTT_CONFIG.awardPK;
const finance_58addr = app.finance_58addr;
const tronBetPoolPlus_58addr = app.pool_58addr;

async function test() {
    if (BTT_CONFIG.testRound != null && BTT_CONFIG.testRound > 0) {
        await tronNodePool.init();
        await sleep(5000);
        sendTrc10(BTT_CONFIG.testRound);
    }
}

// test();

//开始发送trc10币，需要已质押数,可分红数
async function sendTrc10(new_round) {
    loggerDefault.info("Trc10 token ready go!");

    await sleep(5000);

    let lastestRoundInfo = await bttService.getLastestRoundInfo();
    if (lastestRoundInfo == null) {
        if (new_round != null) {
            loggerDefault.info("新建BTT分红");
            dividend(new_round);
        }
    } else if (lastestRoundInfo.div_state === 0) {
        if (_.isEmpty(lastestRoundInfo.tx_id)) {
            loggerDefault.info("找不到BTT提取交易记录，BTT重置分红!!!");
            dividend(lastestRoundInfo.ver);
        } else {
            loggerDefault.info("找到BTT提取交易记录，确认分红交易记录中");
            appEvent.emit('checkTx', lastestRoundInfo.tx_id, tokenID, tokenName, poolAddr, lastestRoundInfo.ver);
        }
        console.log("sendTrc10 WTF");
    } else if (lastestRoundInfo.div_state === 1) {
        loggerDefault.info("BTT正在分红 => contiune");
        appEvent.emit('send_BTT', lastestRoundInfo.ver, tokenID, lastestRoundInfo.tx_id);
    } else if (lastestRoundInfo.div_state === 2) {
        if (lastestRoundInfo.ver < new_round) {
            loggerDefault.info("新建BTT分红");
            dividend(new_round);
        } else {
            loggerDefault.info("BTT分红已完成");
        }
    }
}

//分红
async function dividend(round) {
    //提款
    loggerDefault.info("scan trc10 info ==> tokenID,tokenName,poolAddr,awardPK,decimail,save_token", tokenID, tokenName, poolAddr, awardPK, decimail, save_token);

    let accountInfo = await tronSrv.getBalance(poolAddr);
    let assetV2 = accountInfo.assetV2;
    loggerDefault.info("[奖池中] TRC10币余额", assetV2);
    let res = _.find(assetV2, (element) => {
        return Number(element.key) === tokenID;
    });

    if (res == null) {
        loggerDefault.info("no enough trc10", tokenName);
    } else {
        let balance = (res.value || 0) / Math.pow(10, (decimail || 0)); //奖池余额
        let val = res.value - save_token * Math.pow(10, (decimail || 0)); //奖池提取额（奖池余额-奖池留底）
        loggerDefault.info("trc10 info =>", tokenName, "balance = " + balance, "withdraw = " + val);

        if (BTT_CONFIG.testRound != null && BTT_CONFIG.testRound > 0 && BTT_CONFIG.testRound === round) {  //测试用,发送12BTT
            let test_count = 13;
            loggerDefault.info("开发测试模式,直接发送BTT:" + test_count + "个");
            val = test_count * Math.pow(10, (decimail || 0));
            let tx_id = "test_tx";
            await bttService.createRoundInfo(round, 0, tx_id);
            await bttService.updateLastestRoundInfo(round, val, 1);
            appEvent.emit('send_BTT', round, tokenID, tx_id);
            return;
        }

        loggerDefault.info("Pool Balance =>", tokenName + ":" + balance, "save:" + save_token, "withdraw(sun) =>", val);
        if (val > 0) {
            //提款
            withdraw(tokenID, tokenName, poolAddr, round);
        } else {
            loggerDefault.info("no enough trc10", tokenName);
            await bttService.updateLastestRoundInfo(round, 0, 2); //完成
            await bttService.updateAllBttTxState(round, 3);
            loggerDefault.info("bye!");
        }
    }
}

async function withdraw(tokenID, tokenName, poolAddr, round) {
    let txWithdraw = await tronSrv.commitTransaction(poolAddr, "transferDivide(uint256,uint256)", 20000000, 0, [{ type: "uint256", value: tokenID }, { type: "uint256", value: round }]);
    let tx_id = txWithdraw.txID;
    loggerDefault.info("txWithdraw submit result:", txWithdraw.result, "withdrawTxID:", tx_id);
    await bttService.createRoundInfo(round, 0, tx_id);
    appEvent.emit('checkTx', txWithdraw.txID, tokenID, tokenName, poolAddr, round);
}

appEvent.on('checkTx', (tx, tokenID, tokenName, poolAddr, round) => {
    loggerDefault.info("on checkTx tx:", tx);
    let t = setTimeout(async () => {
        loggerDefault.info("exec checkTx tx:", tx);
        // clearTimeout(t);
        let txInfo = await tronSrv.getTransactionInfoById(tx);
        loggerDefault.info("checkTx txInfo:", txInfo);
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
                    await bttService.updateLastestRoundInfo(round, tokenValue, 1);
                    appEvent.emit('send_BTT', round, tokenID, tx);
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

appEvent.on('send_BTT', (round, tokenID, tx) => {
    loggerDefault.info("BTT dividends is working !", round);
    let t = setTimeout(async () => {
        clearTimeout(t);
        let div_info = await bttService.getLastestRoundInfo();

        let ver = div_info.ver;
        if (ver != round) {
            loggerDefault.info("send_BTT ver is not match!", round, ver);
            return;
        }
        let total_dice = div_info.total_dice;
        let total_win = div_info.total_win;
        let total_btt = div_info.total_btt;
        let dice_rate = div_info.dice_rate;
        let win_rate = div_info.win_rate;

        // console.log("total_dice,total_win,total_btt,dice_rate,win_rate", total_dice, total_win, total_btt, dice_rate, win_rate);

        let list = await bttService.getBttSendList(round);
        if (list == null || list.length === 0) {
            loggerDefault.info("all BTT had send!");
            await bttService.updateLastestRoundInfo(round, total_btt, 2); //完成
            return;
        }
        let co = 0;
        for (let obj of list) {
            let addr = obj.addr;
            let state = obj.state;
            if (state === 2) { //已发送，待确认
                tronSrv.isTxSuccess(obj.tx_id, (err, res) => { //trx/assert transfer => full节点因为出块超级节点的原因，不一定能正常返回交易结果是 success/fail
                    if (res === "SUCCESS") {
                        loggerDefault.info("check btt tx by full node => ", addr, "success");
                        bttService.updateBttTxInfo(round, addr, 3, obj.tx_id);
                    } else if (res === "FAIL") {
                        loggerDefault.info("check btt tx by full node => ", addr, "fail");
                        bttService.updateBttTxInfo(round, addr, 4, obj.tx_id);
                    } else if (err === "UNKNOWN") {
                        tronSrv.isTxSuccessFromSolidity(obj.tx_id, (err, res) => { //trx/assert transfer => solidity节点能查到也是交易成功
                            if (err != null) {
                                if (err === "UNKNOWN") {
                                    // loggerDefault.info("unknown tx state");
                                    if (obj.send_ts != null && _.now() > obj.send_ts + 130000) { //发送130秒后full/solidity均无法查找到该交易则重发
                                        loggerDefault.info("tx timeout => resend tx for", round, addr);
                                        bttService.updateBttTxInfo(round, addr, 4, obj.tx_id);
                                    }
                                } else {
                                    loggerDefault.info("isTxSuccessFromSolidity->err", err);
                                }
                            } else {
                                if (res === "SUCCESS") {
                                    loggerDefault.info("check btt tx by solidity node => ", addr, "success");
                                    bttService.updateBttTxInfo(round, addr, 3, obj.tx_id);
                                } else if (res === "FAIL") {
                                    loggerDefault.info("check btt tx by solidity node => ", addr, "fail");
                                    bttService.updateBttTxInfo(round, addr, 4, obj.tx_id);
                                } else {
                                    loggerDefault.info("isTxSuccessFromSolidity->res", res);
                                }
                            }
                        });
                    } else {
                        loggerDefault.info("isTxSuccess->err", err);
                    }
                });
            } else {
                if (obj.win > 0) { //只要持有win则进行分红
                    co = co + 1;
                    let rate = obj.win / total_win;
                    let amount = Math.floor(total_btt * (win_rate / 100) * rate);
                    try {
                        if (amount > 0) {
                            loggerDefault.info("win => btt => addr, tokeID, amount, send_idx", addr, tokenID, amount, rate, co);
                            let txTrc10 = await tronSrv.sendToken(addr, tokenID, amount);
                            // loggerDefault.info('tx_id = ', txTrc10);
                            if (txTrc10.result === true) {
                                await bttService.addBttTxInfo4Win(round, addr, amount, txTrc10.transaction.txID, _.now(), 2);
                            } else {
                                await bttService.addBttTxInfo4Win(round, addr, amount, "", _.now(), 1);
                            }
                        } else {
                            await bttService.addBttTxInfo4Win(round, addr, amount, "", _.now(), 3);
                        }
                    } catch (error) {
                        loggerDefault.warn(error);
                        if (error === "Cannot transfer tokens to the same account") {
                            await bttService.addBttTxInfo4Win(round, addr, amount, error, _.now(), 0);
                        }
                    }
                }
                if (obj.dice > 0) { //只要持有dice则进行分红
                    co = co + 1;
                    let rate = obj.dice / total_dice;
                    let amount = Math.floor(total_btt * (dice_rate / 100) * rate);
                    try {
                        if (amount > 0) {
                            loggerDefault.info("dice => btt => addr, tokeID, amount, send_idx", addr, tokenID, amount, rate, co);
                            let token_collection_addr = addr;
                            if (addr == tronBetPoolPlus_58addr) {
                                token_collection_addr = finance_58addr;
                            }
                            let txTrc10 = await tronSrv.sendToken(token_collection_addr, tokenID, amount);
                            // loggerDefault.info('tx_id = ', txTrc10);
                            if (txTrc10.result === true) {
                                await bttService.addBttTxInfo4Dice(round, addr, amount, txTrc10.transaction.txID, _.now(), 2);
                            } else {
                                await bttService.addBttTxInfo4Dice(round, addr, amount, "", _.now(), 1);
                            }
                        } else {
                            await bttService.addBttTxInfo4Dice(round, addr, amount, "", _.now(), 3);
                        }
                    } catch (error) {
                        loggerDefault.warn(error);
                        if (error === "Cannot transfer tokens to the same account") {
                            await bttService.addBttTxInfo4Dice(round, addr, amount, error, _.now(), 0);
                        }
                    }
                }
            }
        }
        appEvent.emit('send_BTT', round, tokenID, tx);
    }, 1000);
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
