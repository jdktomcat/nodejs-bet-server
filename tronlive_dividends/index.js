const Redis = require('ioredis');
const moment = require('moment');
const events = require('events');
const appEvent = new events.EventEmitter();
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');
const config = require('./src/configs/config');
const tronNodePool = require('./src/service/tronNodePool');
const init_ts = config.app.init_ts; //初始截止时间戳
const duration = config.app.duration; //每轮有效时间（秒）
const time_out = config.app.time_out; //超时时间（秒）
const dividends_addr = config.app.dividends_addr;//分红合约地址
const pay_addr = config.app.pay_addr
const pool_addr = config.app.pool_addr; //奖池合约地址
const min_pool_trx = config.app.min_pool_trx * 1e6; //最小分红奖池（单位TRX）
const defaultPK = config.tronConfig.node.master.defaultPk;

const ignore_round_in_db = config.app.ignore_round_in_db; //忽略数据库中不存在的轮次
const min_interval_ts = config.app.min_interval_ts; //发奖最小间隔时间(秒)
const pool_save_trx = config.app.pool_save_trx; //奖池保留资金
const test_trx = config.app.test_trx; //测试要发送的TRX数量 0:按实际奖池数量发送
let  completeRound = 0

const dbService = require('./src/service/dbService');
const tronSrv = require('./src/service/tronService');

let hadSendIndex = 0;
let isBusy = false;

process.on('uncaughtException', (error) => {
    loggerError.error("!!!!!!!!!!!!!!!!!!!!!!!!uncaughtException", error);
    //process.exit(0);
});

process.on('unhandledRejection', (error) => {
    // Will print "unhandledRejection err is not defined"
    loggerError.error("!!!!!!!!!!!!!!!!!!!!!!!!unhandledRejection", error.stack);
    //process.exit(0);
});

appEvent.on('create', doNext);
appEvent.on('step', onContiune);
appEvent.on('complete', onComplete);
appEvent.on('retry', doNext);
appEvent.on('scan', scan);
appEvent.on('action', action);

//获取本轮分红信息
async function getRoundInfo() {
    let flag = false
    let roundInfo = await getDivideInfoFromBlock().catch((err) => {
        console.log('error, can not get roundinfo====, error info =>', err)
        flag = true
    });
    if (flag) {
        console.log('==========get round info from block failed!!!!============')
        return { deadline : 999999999999999}
    }

    if (roundInfo == null || roundInfo.round === 0) {
        loggerDefault.info("从未分红!!!");
        roundInfo = {
            round: 1, trxAmountTotal: 0, anteAmountTotal: 0, maxHolderIndex: 0,
            nextHolderIndex: 999999999999999, tmStart: 0, tmCompleted: 0, deadline: init_ts, lock: false, timeout: false
        };
    } else {
        // if(roundInfo.round === 11)
        // console.log(roundInfo);
        if (isBusy === false && roundInfo.tmCompleted > 0 && roundInfo.nextHolderIndex >= 999999999999999) { //已完成
            // loggerDefault.info("roundInfo", roundInfo);
            let nextDeadline = roundInfo.tmStart + duration;
            if (roundInfo.tmStart < init_ts) { //若之前分红时间小于配置的初始分红时间，则修正下次分红时间为初始分红时间
                nextDeadline = init_ts;
            }
            let deadline = getDeadline(nextDeadline);
            roundInfo.round = roundInfo.round + 1; //下一轮
            roundInfo.deadline = deadline; //下一轮
            roundInfo.lock = false;
            roundInfo.timeout = false;
            roundInfo.pass_round = 0;
        } else { //正在进行
            // console.log("ddq", roundInfo);
            let deadline = getDeadline(roundInfo.tmStart);
            roundInfo.round = roundInfo.round;
            roundInfo.deadline = deadline;
            roundInfo.lock = true;
            roundInfo.timeout = false;
            roundInfo.pass_round = 0;
        }
    }

    if (roundInfo.lock === false && isBusy === false) {
        modifyDeadline(roundInfo, time_out, duration);
        if (roundInfo.timeout === true) { //超时 ==> 推迟
            loggerDefault.info("本轮分红 round " + roundInfo.round + " 已超时,推迟 [" + roundInfo.pass_round + "] 轮 至:", moment(roundInfo.deadline * 1000).format("YYYY-MM-DD HH:mm:ss"));
        } else {
            loggerDefault.info("本轮分红 round " + roundInfo.round + " 将在正常时间截止:", moment(roundInfo.deadline * 1000).format("YYYY-MM-DD HH:mm:ss"));
        }
    } else {
        loggerDefault.info("Round " + roundInfo.round + " is busy!");
    }

    return roundInfo;
}

//从链上获取数据分红轮次信息
function getDivideInfoFromBlock() {
    return new Promise((resolve, reject) => {
        tronSrv.queryTransaction(dividends_addr, "getCurrentDivideInfo()", [], async (err, result) => {
            if (err) reject(err);
            // console.log("getDivideInfoFromBlock result",result);
            if (result == null || result.result == null) {
                loggerDefault.warn("WTF!queryTransaction -->getCurrentDivideInfo() 查詢結果為空!");
                reject("Data is empty");
            }
            if (result.result.result === true) {
                let data = result.constant_result[0];
                // loggerDefault.info(data);
                let round = tronSrv.hexStringToBigNumber(data.substr(0, 64)).toNumber();
                let trxAmountTotal = tronSrv.hexStringToBigNumber(data.substr(64, 64)).toNumber();
                let anteAmountTotal = tronSrv.hexStringToBigNumber(data.substr(128, 64)).toNumber();
                let maxHolderIndex = tronSrv.hexStringToBigNumber(data.substr(192, 64)).toNumber();
                let nextHolderIndex = tronSrv.hexStringToBigNumber(data.substr(256, 64)).toNumber();
                let tmStart = tronSrv.hexStringToBigNumber(data.substr(320, 64)).toNumber();
                let tmCompleted = tronSrv.hexStringToBigNumber(data.substr(384, 64)).toNumber();
                // console.log({ round, trxAmountTotal, anteAmountTotal, maxHolderIndex, nextHolderIndex, tmStart, tmCompleted })
                resolve({ round, trxAmountTotal, anteAmountTotal, maxHolderIndex, nextHolderIndex, tmStart, tmCompleted });
            }
        });
    });
}

async function preDivide(round) {

    console.log('-----preDivide-start-----', round)
    let now = Math.floor((new Date().getTime()) / 1000)
    let balance = await dbService.getProfitAmount(now);

    balance = Math.floor(balance * 1e6 * 0.5)
    // if (balance <= min_pool_trx) {
    //     console.log("奖池余额:" + balance / 1e6 + " TRX < 最小分红要求" + min_pool_trx / 1e6 + " TRX");
    //     return
    // } else {
    //     loggerDefault.info("奖池余额:" + balance + " TRX");
    // }

    console.log('=======Round,balance=====>', round, balance, min_pool_trx)

    if (test_trx > 0) {
        balance = test_trx * 1e6;
        console.warn("测试分红 TRX = " + test_trx);
    }

    if (balance < min_pool_trx) {
        console.warn('！！！！！！！！！！！！！！！！！奖池太低， 暂不分红！！！！！！！！！！！！！！！！')
        return
    }


    // return
    tronSrv.commitTransaction(pay_addr, "Divide(uint256,uint256)", 20000000, 0, [{ type: "uint256", value: balance }, { type: "uint256", value: round + 1000 }], defaultPK, (err, res) => {
        if (err) {
            loggerError.error("===> Divide fail:", err);
        }
        if (res.result === true) {
            loggerDefault.info("===> Divide success:", res);
        } else {
            loggerDefault.error("===> Divide fail:", res);
        }
    });

    let result = await tronSrv.tronQuery(pay_addr, "isSysTxConfirmed(uint256)", [{ type: "uint256", value: round + 1000 }])
    if (result.result.result === true) {
        let isSuccess = tronSrv.hexStringToBigNumber(result.constant_result[0].substr(0, 64)).toNumber();
        console.log('------------------------------------isSuccess-------', isSuccess)
        if (isSuccess) {
            await sleep(200000)
            if (!isBusy && (completeRound < round)) {
                await action()
            }

        }
    }


}

//开始分红
async function action() {

    //开始本轮分红/锁定
    isBusy = true
    tronSrv.commitTransaction(dividends_addr, "createDivide()", 20000000, 0, [], defaultPK, (err, res) => {
        if (err) {
            isBusy = false;
            loggerError.error("===> createDivide fail:", err);
        }
        if (res.result === true) {
            isBusy = true;
            loggerDefault.info("===> createDivide success:", res);
        } else {
            isBusy = false;
            loggerDefault.error("===> createDivide fail:", res);
        }
    });
}

//持续分红
async function doNext(count) {
    loggerDefault.info("===> doNextPayout => count = " + count);
    let count_success = 0;
    for (let idx = 1; idx <= count; idx++) {
        isBusy = true;
        await sleep(100);  //10tps
        tronSrv.commitTransaction(dividends_addr, "doNextPayout()", 10000000, 0, [], defaultPK, (err, res) => {
            if (err) loggerError.error(err);
            if (res == null || res.result == null || res.result === false) {
                loggerDefault.warn("doNextPayout fail!!!");
                loggerDefault.warn(res);
            } else if (res.result === true) {
                count_success = count_success + 1;
                loggerDefault.info("doNextPayout success!!! index:" + idx + " tx_id:" + res.txID);
            }
            if (idx >= count && count_success < count) {
                loggerDefault.info("提交成功次数：" + count_success + " 总数：" + count);
                appEvent.emit('retry', count - count_success);
            }
        });
    }
}

//收到分红进行事件
async function onContiune(event_step) {
    if (event_step.index > hadSendIndex) {
        hadSendIndex = event_step.index;
    }
}

//收到分红完成事件
async function onComplete(event_complete) {
    hadSendIndex = 0;
    isBusy = false;
    completeRound = event_complete.round
    loggerDefault.info("event complete!!!", event_complete);
}

async function init() {
    loggerDefault.info("启动检查");
    let roundInfo = await getRoundInfo();
    if (roundInfo.lock === true) { //正在分红
        loggerDefault.info("启动时已开始分红！！！");
        let temp = hadSendIndex;
        loggerDefault.info("当前分红到第" + (temp + 1) + " 位");
        let n = 5; //等待N次
        let timer = setInterval(() => {
            n = n - 1;
            loggerDefault.info(" ... 倒数 = " + n);
            if (n === 0) { //等待N次
                clearInterval(timer);
                if (hadSendIndex === temp) {//hadSendIndex未变化，未收到分红事件
                    loggerDefault.info("分红进度:" + (hadSendIndex + 1) + "未变化，重新触发");
                    let count = roundInfo.maxHolderIndex - roundInfo.nextHolderIndex + 1;
                    if (count > 0) {
                        loggerDefault.info("分红进度" + roundInfo.nextHolderIndex + "/" + (roundInfo.maxHolderIndex + 1), " count:" + count);
                        appEvent.emit('retry', count); //重新触发
                        return;
                    }
                }
            }
        }, 3000);
    }
}

//扫描区块链数据
function scan() {
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        let roundInfo = await getRoundInfo();
        if (roundInfo.lock === true || isBusy === true) {
            // loggerDefault.info("Round " + roundInfo.round + " 正在分红......");
            appEvent.emit('scan');
            return;
        }

        let _now = Math.floor(Date.now() / 1000);
        console.log("roundInfo.deadline is",roundInfo.deadline)
        if (_now < roundInfo.deadline) {
            loggerDefault.info("Round " + roundInfo.round + " 未到分红时间，还差 " + (roundInfo.deadline - _now) + "秒");
        } else {
            let preRound = roundInfo.round - 1;
            if (preRound > 0 && preRound > (ignore_round_in_db) || 0) {
                let preRoundInfo = await dbService.getPreRoundInfo(preRound);
                if (preRoundInfo && preRoundInfo.div_state !== 2) {
                    loggerDefault.warn("上一轮 [" + preRound + "] 结果未入库");
                    appEvent.emit('scan');
                    return;
                }
                if (preRoundInfo && _now - preRoundInfo.send_ts < min_interval_ts) {
                    loggerDefault.warn("分红间隔时间过短 now:" + moment(_now * 1000).format("YYYY-MM-DD HH:mm:ss") + " pre send ts:" + moment(preRoundInfo.send_ts * 1000).format("YYYY-MM-DD HH:mm:ss"));
                    appEvent.emit('scan');
                    return;
                }
            }

            //先转账， 在分红

            await preDivide(roundInfo.round)

            // await action(10); //触发分红
        }
        appEvent.emit('scan');
        return;
    }, 3000);
}

//订阅Redis消息
function subscribe() {
    const redisObserver = Redis.createClient(
        {
            host: config.redisConfig.host,
            port: config.redisConfig.port,
            password: config.redisConfig.pwd,
            db: config.redisConfig.db
        }
    );

    redisObserver.subscribe('tron_live_dividends', (err, res) => {
        if (err) {
            loggerError.error(err);
            loggerDefault.info("订阅频道 [tron_live_dividends] 失败");
            process.exit(0);
        }
        loggerDefault.info("订阅频道 [tron_live_dividends] 成功");
    });

    redisObserver.on('message', (channel, message) => {
        console.log("channel:" + channel, message);
        message = JSON.parse(message);
        let _type = message._type;
        let amount = message.trxAmountTotal || 0
        switch (_type) {
            case "dividends_create":
                appEvent.emit("create", message.maxHolderIndex + 1);
                break;
            case "dividends_complete":
                appEvent.emit("complete", message);
                break;
            case "dividends_step":
                appEvent.emit("step", message);
                break;
            case "dividends_pre":
                appEvent.emit("action");
                break;
        }
    });

    redisObserver.on('error', (error) => {
        loggerError.error(error);
        loggerDefault.info("无法连接Redis!!!");
        process.exit(0);
    });
}

async function app() {

    await subscribe(); //订阅

    await tronNodePool.init();

    await sleep(5000);

    // let accountInfo = await tronSrv.getBalance(pool_addr);
    // let balance = (accountInfo.balance || 0) - pool_save_trx * 1e6;
    // if (balance <= min_pool_trx) {
    //     loggerError.warn("当前奖池余额:" + balance / 1e6 + " TRX < 最小分红要求" + min_pool_trx / 1e6 + " TRX");
    //     // process.exit(0);
    // } else {
    //     loggerDefault.info("奖池余额:" + balance / 1e6 + " TRX");
    // }

    await init(); //检查

    await scan(); //扫描

}

app();

//////////////////////////////////////////////////////////////////////////////////////////////

//休眠
function sleep(time = 0) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}

//计算超时/推迟轮次，修正本轮截止时间
function modifyDeadline(obj, time_out, duration) {
    let _now = Math.floor(Date.now() / 1000);
    let times = 0;
    while (_now > obj.deadline + time_out) { //超时 ==> 推迟
        times = times + 1;
        obj.timeout = false; //已超时
        obj.deadline = obj.deadline + duration; //设置截止时间戳
    }
    // if (times > 0) {
    //     loggerDefault.info("超时 " + times + " 轮");
    // }
    obj.pass_round = times;
    return obj;
}

// //计算截止时间戳
// function getDeadline(_ts, init_ts, duration) {
//     // loggerDefault.info("xxx", _ts, init_ts, duration);
//     let temp = init_ts;
//     let deadline = init_ts;
//     while (temp <= _ts) {
//         deadline = temp;
//         temp = temp + duration;
//     }
//     // loggerDefault.info("本轮分红截止时间", moment(deadline * 1000).format("YYYY-MM-DD HH:mm:ss"));
//     return deadline;
// }

//计算截止时间戳
function getDeadline(action_ts) {
    // loggerDefault.info("getDeadline", action_ts, init_ts, duration);
    let deadline = init_ts;
    let min_ts = init_ts - time_out;
    if (action_ts > min_ts) {
        let n = 0;
        let b = init_ts + time_out;
        while (action_ts > b) {
            n = n + 1;
            b = init_ts + duration * n + time_out;
        }
        console.log('-------------------nnnnn-----', action_ts, b, n)
        deadline = init_ts + n * duration;
    }
    loggerDefault.info("本轮分红截止时间", moment(deadline * 1000).format("YYYY-MM-DD HH:mm:ss"));
    return deadline;
}