const TronWeb = require('tronweb');
const _ = require('lodash')._;
const sha3 = require('js-sha3');
const sha3_256 = sha3.sha3_256;
const tronUtil = require('./src/utils/tronUtil');
const BigNumber = require('bignumber.js');
const hexStringToTronAddress = tronUtil.hexStringToTronAddress;
const hexStringToBigNumber = tronUtil.hexStringToBigNumber;
const tronQuery = tronUtil.tronQuery;
const tronExec = tronUtil.tronExec;
const getAddressArr = tronUtil.getAddressArr;
const getUint256Arr = tronUtil.getUint256Arr;
const events = require('events');
const appEvent = new events.EventEmitter();
const parseDataService = require('./src/service/parseDataService');
const createBetLogInfo = parseDataService.createBetLogInfo;
const calcPayout = parseDataService.calcPayout;
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('default');
const loggerError = log4js.getLogger('error');
const config = require('./src/configs/config');
const dice10Orcale = config.dice.dice10Orcale;
const dice10Addr = config.dice.dice10Addr;
const fee_resolve_max = config.dice.fee_resolve_max;
const fee_do_bet_max = config.dice.fee_do_bet_max;
const APP_KEY = config.dice.APP_KEY;
const RANDOM_SALT_1 = config.dice.RANDOM_SALT_1;
const RANDOM_SALT_2 = config.dice.RANDOM_SALT_2;
const RARE_WIN_LIMIT = config.dice.RARE_WIN_LIMIT;
const MY_LOGS_CAP = config.dice.MY_LOGS_CAP;
const OB_ADDR = config.dice.OB_ADDR;
const defaultPk = config.tronConfig.node.master.defaultPk;

let PENDING_ORDERS = {};

const redis = require("ioredis").createClient(
    {
        host: config.redisConfig.host,
        port: config.redisConfig.port,
        password: config.redisConfig.pwd,
        db: config.redisConfig.db
    }
);

async function resolve(_address, _order_id, _direction, _number, _sunAmount, _random, _nodeName, _privateKey, _callback) {
    if (!TronWeb.isAddress(_address)) return null;
    if (_.isEmpty(_random)) {
        _random = '0x' + createRandom(_address);
    }

    let bn = new BigNumber(_order_id * 256);
    let _salt = bn.plus(_direction * 128).plus(_number);
    _salt = TronWeb.fromDecimal(_salt);

    tronExec(dice10Orcale, "importSeedFromThirdSugar(address,uint256,uint256,uint256)", fee_resolve_max, 0, [
        { type: "address", value: _address },
        { type: "uint256", value: _random },
        { type: "uint256", value: _salt },
        { type: "uint256", value: _sunAmount },
    ], _nodeName, _privateKey, (err, res) => {
        if (!_callback) return;
        if (err) return _callback(err, null);
        if (!_.isEmpty(res) && res.result === true && !_.isEmpty(res.transaction) && !_.isEmpty(res.transaction.txID)) {
            res.random = _random;
            loggerDefault.info("resolve result ==> ", "addr", _address, "order", _order_id, "tx", res.transaction.txID, "random", res.random);
            return _callback(null, res);
        } else {
            return _callback(res, null);
        }
    });
}

function doBetCommon(_tokenID, _sunVal, _number, _direction, _privateKey, _callback) {
    let tokenConfig = config.dice.trc10_support[_tokenID]
    if (tokenConfig == null || tokenConfig.enable !== true) {
        _callback("not support this trc10 token:" + _tokenID, null);
        return;
    }
    if (!_.isNumber(_sunVal) || !_.isNumber(_number) || !_.isNumber(_direction) || (_direction === 0 && _number > 95) || (_direction === 1 && _number < 4)) return;
    tronExec(dice10Addr, "GoodLuck(uint256,uint256)", fee_do_bet_max, _sunVal, [{ type: 'uint256', value: _number }, { type: 'uint256', value: _direction }], null, _privateKey, (err, res) => {
        if (!_callback) return;
        if (err) return _callback(err, null);
        if (res) return _callback(null, res);
    });
}

function getOrder(_address, _privateKey, _callback) {
    if (!TronWeb.isAddress(_address)) return _callback != null ? _callback("Address is valid!", null) : null;
    tronQuery(dice10Addr, "getOrder(address)", [{ type: "address", value: _address }], null, _privateKey, (err, hexStr) => {
        if (!_callback) return;
        if (err) return _callback(err, null);
        if (hexStr == null) return _callback("hexStr is empty", null);
        let data = {
            bettor: hexStringToTronAddress(hexStr.substr(24, 40)),
            sunAmount: hexStringToBigNumber(hexStr.substr(64, 64)).toNumber(),
            orderid: hexStringToBigNumber(hexStr.substr(128, 64)).toNumber(),
            direction: hexStringToBigNumber(hexStr.substr(192, 64)).toNumber(),
            number: hexStringToBigNumber(hexStr.substr(256, 64)).toNumber(),
            roll: hexStringToBigNumber(hexStr.substr(320, 64)).toNumber(),
            tokenID: hexStringToBigNumber(hexStr.substr(384, 64)).toNumber(),
        }

        let tokenConfig = config.dice.trc10_support[data.tokenID];
        if (tokenConfig && tokenConfig.enable === true) {
            data.trxAmount = data.sunAmount / tokenConfig.decimal;
            _callback(null, data);
        } else {
            _callback(`not support this trc10 token ! addr: ${_address}, tokenId: ${data.tokenID}` , null);
        }

    });
}

function getOrderByIdArray(_addressArray, nodeName, _callback) {
    let _ownerArray = [];
    for (let addr of _addressArray) {
        _ownerArray.push('0x' + TronWeb.address.toHex(addr).substr(2, 40));
    }
    tronQuery(dice10Addr, "getOrderByIdArray(address[])", [{ type: "address[]", value: _ownerArray }], nodeName, null, (err, hexStr) => {
        if (!_callback) return;
        if (err) return _callback(err, null);
        if (hexStr == null) return _callback("hexStr is empty", null);

        // console.log("hexStr",hexStr);
        // let _bettorArray_type = hexStringToBigNumber(hexStr.substr(0, 64)).toNumber(); //投注者地址数组(在数组中的地址从0开始)
        // let _trxAmountArray_type = hexStringToBigNumber(hexStr.substr(64, 64)).toNumber();  //投注TRX数量数组, 与_bettorArray一一对应
        // let _orderIdArray_type = hexStringToBigNumber(hexStr.substr(128, 64)).toNumber(); //自动逃离倍率数组, 与_bettorArray一一对应
        // let _directionArray_type = hexStringToBigNumber(hexStr.substr(192, 64)).toNumber();
        // let _numberArray_type = hexStringToBigNumber(hexStr.substr(256, 64)).toNumber();
        // let _rollArray_type = hexStringToBigNumber(hexStr.substr(320, 64)).toNumber();
        // let _tokenIDArray_type = hexStringToBigNumber(hexStr.substr(384, 64)).toNumber();

        let startIndex = 448;

        let ret1 = getAddressArr(hexStr, startIndex);
        let _bettorArray = ret1[0];
        let _bettorArrayEndIndex = ret1[1];

        let ret2 = getUint256Arr(hexStr, _bettorArrayEndIndex);
        let _trxAmountArray = ret2[0];
        let _trxAmountArrayEndIndex = ret2[1];

        let ret3 = getUint256Arr(hexStr, _trxAmountArrayEndIndex);
        let _orderIdArray = ret3[0];
        let _orderIdArrayEndIndex = ret3[1];

        let ret4 = getUint256Arr(hexStr, _orderIdArrayEndIndex);
        let _directionArray = ret4[0];
        let _directionArrayEndIndex = ret4[1];

        let ret5 = getUint256Arr(hexStr, _directionArrayEndIndex);
        let _numberArray = ret5[0];
        let _numberArrayEndIndex = ret5[1];

        let ret6 = getUint256Arr(hexStr, _numberArrayEndIndex);
        let _rollArray = ret6[0];
        let _rollArrayEndIndex = ret6[1];

        let ret7 = getUint256Arr(hexStr, _rollArrayEndIndex);
        let _tokenIDArray = ret7[0];
        // let _rollArrayEndIndex = ret6[1];

        let data = [];
        for (let idx = 0; idx < _bettorArray.length; idx++) {
            let dice_result = {
                bettor: _bettorArray[idx],
                sunAmount: _trxAmountArray[idx],
                orderid: _orderIdArray[idx],
                direction: _directionArray[idx],
                number: _numberArray[idx],
                roll: _rollArray[idx],
                tokenID: _tokenIDArray[idx],
                // trxAmount: _trxAmountArray[idx] / 1000000
            }
            // console.log("dice_result",dice_result);
            let tokenConfig = config.dice.trc10_support[dice_result.tokenID];
            if (tokenConfig && tokenConfig.enable === true) {
                dice_result.trxAmount = dice_result.sunAmount / tokenConfig.decimal;
                data.push(dice_result);
            }
        }
        _callback(null, data);
    });
}

//生成随机数 ***
let tempRdm = "";
function createRandom(_seed) {
    let _now = _.now() + 2018;
    let _random = _.random(1000000000, 9999999999) - 1949;
    let _result = sha3_256(sha3_256(APP_KEY + _now + RANDOM_SALT_1) + _random + RANDOM_SALT_2 + _seed + tempRdm);
    tempRdm = _result;
    return _result;
}

function init() {
    setInterval(() => {
        let begin_ts = _.now();
        let param = [];
        let param1 = [];
        let count = 0;
        for (let addr in PENDING_ORDERS) {
            count = count + 1;
            if (count % 2 === 1) {
                param.push(addr);
            } else {
                param1.push(addr);
            }
        }
        if (param.length > 0) {
            getOrderByIdArray(param, "master", (err, res) => { //可能时间较长，返回的未处理的订单可能已被处理且回去尝试重新解决前一个订单 to_do_order_id = 实际to_do_order_id - 1 !!!重要
                if (err == null && res != null) {
                    // loggerDefault.info("master node scan cost ms:" + (_.now() - begin_ts) + " count:" + param.length);
                    for (let dice_result of res) {
                        checkOrder(dice_result, "master");
                    }
                }
            })
        }
        if (param1.length > 0) {
            getOrderByIdArray(param1, "master", (err, res) => {
                if (err == null && res != null) {
                    // loggerDefault.info("slave node scan cost ms:" + (_.now() - begin_ts) + " count:" + param1.length);
                    for (let dice_result of res) {
                        checkOrder(dice_result, "master");
                    }
                }
            })
        }
    }, 1600)
}

function checkOrder(dice_result, nodeName) {
    // console.log("checkOrder", dice_result.bettor, dice_result.orderid, dice_result.direction, dice_result.number, dice_result.roll, nodeName)
    let addr = dice_result.bettor;
    let order_id = dice_result.orderid;

    redis.hget("player:logs:erc10:" + addr, order_id, (err, res) => {
        if (err != null || res == null) return;
        if (order_id === 0) {
            delete PENDING_ORDERS[addr];
        } else {
            let roll = dice_result.roll;
            if (roll === 255) { //同handleConfirmedOrder
                resolveAgain(addr, order_id, dice_result.direction, dice_result.number, dice_result.sunAmount, nodeName);
            } else {
                delete PENDING_ORDERS[addr];
                onDiceComplete(dice_result);
            }
        }
    });
}

module.exports.init = init;
module.exports.appEvent = appEvent;
module.exports.resolve = resolve;
module.exports.doBetCommon = doBetCommon;
module.exports.getOrder = getOrder;
module.exports.handleOrder = handleOrder;

function resolveAgain(addr, to_do_order_id, direction, number, sunAmount, nodeName = null, pk = defaultPk) {
    redis.hget("player:logs:erc10:" + addr, to_do_order_id, (err, log) => {
        if (err) return;
        if (log != null) {  //已存在待解决的订单
            let _now = _.now();
            log = JSON.parse(log);
            if (_now - (log.ts || 0) < 1600) return; //正在解决中/繁忙中 订单 order_state === 2 //节流
            let tx = log.tx;
            loggerDefault.info(">>>>>>>>>>>>>>>>>>>>>>>>>resolveAgain", addr, to_do_order_id, tx, direction, number, sunAmount, nodeName);
            if (_.isEmpty(tx)) { //都有tx才对
                //检查该订单号是否被回滚了
                loggerDefault.warn("tx is empty", addr, to_do_order_id);
                resolve(addr, to_do_order_id, log.direction, log.number, log.sunAmount, log.random, nodeName, pk, (err, res) => {
                    if (err != null && res == null) return;
                    log.fromDB = false;
                    log.random = res.random;
                    log.tx = res.transaction.txID;
                    log.ts = _now;
                    redis.hset("player:logs:erc10:" + addr, to_do_order_id, JSON.stringify(log));
                });
            } else {
                tronUtil.isTxSuccess(tx, nodeName, pk, (err, res) => {
                    if (err) return;
                    if (res === false) {
                        chechRollback(addr, to_do_order_id, log);
                    } else {
                        loggerDefault.info("Success tx?", tx, addr, to_do_order_id);
                    }
                })
            }
        } else {  //新订单 order_state === 0
            resolve(addr, to_do_order_id, direction, number, sunAmount, null, nodeName, pk, (err, res) => { })
        }
    })
}

let PLAYER_TS = {};
function handleOrder(data) {
    if (!data) return;
    let addr = data.address;
    let to_do_order_id = data.orderId;
    // let state = data.state || 1; //1:confirmedOrder=>常规解决 2:pendingOrder=>盲解决;
    let state = data.state;
    if (state !== 1) return;
    if (_.isEmpty(addr) || !_.isNumber(to_do_order_id) || _.isNaN(to_do_order_id) || !TronWeb.isAddress(addr)) return;
    loggerDefault.info("handleOrder", addr, to_do_order_id, (state === 1 ? "CONFIRMED" : "PENDING"));
    ////////////////////////////
    let _now = _.now();
    let _pre_ts = PLAYER_TS[addr];
    if (_pre_ts && (_now - _pre_ts < 500)) { //客户端上报数据防抖 <500ms ignore
        loggerDefault.info("handleOrder-->ignore! addr:" + addr + "; order:" + to_do_order_id);
        return
    } else {
        PLAYER_TS[addr] = _now;
    }
    ////////////////////////////
    getOrder(addr, null, (err, info) => {
        if (err != null) return loggerError.error(err);
        // loggerDefault.info("handleOrder-->getOrder", addr, to_do_order_id, (state === 1 ? "CONFIRMED" : "PENDING"));
        if (to_do_order_id === info.orderid) {
            redis.hget("player:logs:erc10:" + addr, to_do_order_id, (err, oldLog) => {
                if (err) return;
                if (oldLog != null) { //防止重入,进入扫描队列
                    // oldLog = JSON.parse(oldLog);
                    // if (!_.isEmpty(oldLog.tx)) {
                    if (PENDING_ORDERS[addr] == null || PENDING_ORDERS[addr] !== to_do_order_id) {
                        PENDING_ORDERS[addr] = to_do_order_id;
                    }
                    //     return console.log("Order is Exists!", addr, to_do_order_id);
                    // }
                    return;
                    // if (oldLog.fromDB === false) {
                    //     return;
                    // }
                }
                info.fromDB = false;
                redis.hset("player:logs:erc10:" + addr, to_do_order_id, JSON.stringify(info), (err) => {
                    if (err) return;
                    resolve(addr, to_do_order_id, info.direction, info.number, info.sunAmount, null, null, null, (err, txRes) => {
                        loggerDefault.info("handleOrder--> new order --> resolve", addr, to_do_order_id, (state === 1 ? "CONFIRMED" : "PENDING"));
                        if (err != null && txRes == null) return loggerError.error(err);
                        info.fromDB = false;
                        info.random = txRes.random;
                        info.tx = txRes.transaction.txID;
                        info.ts = _.now();
                        if (PENDING_ORDERS[addr] == null || PENDING_ORDERS[addr] !== to_do_order_id) {
                            PENDING_ORDERS[addr] = to_do_order_id;
                        }
                        // loggerDefault.info(addr + "_" + to_do_order_id + " => order is new !!!");
                        redis.hset("player:logs:erc10:" + addr, to_do_order_id, JSON.stringify(info)); //log update random & tx
                    });
                });
            });
        }
    })
}


function chechRollback(addr, to_do_order_id, log, nodeName, pk) {
    getOrder(addr, null, (err, info) => {
        loggerDefault.info("chechRollback -->", err, info);
        if (err != null || info == null) return;
        if (info.orderid < to_do_order_id) {
            let roll_back_order_id = info.orderid;
            loggerDefault.warn("ROLL BACK !!!", addr, roll_back_order_id, info.direction, info.number, info.sunAmount);
            if (PENDING_ORDERS[addr] == null || PENDING_ORDERS[addr] !== roll_back_order_id) {
                PENDING_ORDERS[addr] = roll_back_order_id;
            }
            redis.hget("player:logs:erc10:" + addr, roll_back_order_id, (err, pre_log) => {
                if (err != null || pre_log == null) return;
                pre_log = JSON.parse(pre_log);
                resolve(addr, roll_back_order_id, info.direction, info.number, info.sunAmount, pre_log.random, nodeName, pk, (err, res) => { //使用当前参数，从redis获取对应订单的原种子
                    if (err != null && res == null) return;
                    info.fromDB = false;
                    info.random = res.random;
                    info.tx = res.transaction.txID;
                    info.ts = _.now();
                    redis.hset("player:logs:erc10:" + addr, to_do_order_id, JSON.stringify(info));
                });
            })
        } else {
            loggerDefault.warn("JUST REVERT !!!", addr, to_do_order_id, log.direction, log.number, log.sunAmount);
            if (to_do_order_id !== info.orderid || log.direction !== info.direction || log.number !== info.number || log.sunAmount !== info.sunAmount) {
                resolve(addr, to_do_order_id, info.direction, info.number, info.sunAmount, null, nodeName, pk, (err, res) => { //下注值变更了,random = null
                    if (err != null && res == null) return;
                    info.fromDB = false;
                    info.random = res.random;
                    info.tx = res.transaction.txID;
                    info.ts = _.now();
                    redis.hset("player:logs:erc10:" + addr, to_do_order_id, JSON.stringify(info));
                });
            } else {
                resolve(addr, to_do_order_id, info.direction, info.number, info.sunAmount, log.random, nodeName, pk, (err, res) => { //下注值没有变更,random = log.random
                    if (err != null && res == null) return;
                    info.fromDB = false;
                    info.random = res.random;
                    info.tx = res.transaction.txID;
                    info.ts = _.now();
                    redis.hset("player:logs:erc10:" + addr, to_do_order_id, JSON.stringify(info));
                });
            }
        }
    });
}

async function onDiceComplete(dice_result) {
    loggerDefault.info("onDiceCompleteTrc10", dice_result);
    let bettor = dice_result.bettor;
    let orderId = dice_result.orderid;
    let roll = dice_result.roll;
    let direction = dice_result.direction;
    let number = dice_result.number;
    let sunAmount = dice_result.sunAmount;
    let trxAmount = dice_result.trxAmount;
    let ts = _.now();

    if (PENDING_ORDERS[bettor] != null && PENDING_ORDERS[bettor] <= orderId) {
        delete PENDING_ORDERS[bettor]; //**  */
    }

    let payout = 0;
    let multiplier = 0;
    let isWin = false;
    let isHighRoller = false;
    let isRareWins = false;
    //roll => 0 ~ 99
    if (direction === 0) {
        let betResult = calcPayout(number, sunAmount);
        multiplier = betResult.multiplier;
        if (roll < number) { //win
            isWin = true;
            payout = betResult.payout;
        }
    } else {
        let betResult = calcPayout(99 - number, sunAmount);
        multiplier = betResult.multiplier;
        if (roll > number && roll <= 100) { //win
            isWin = true;
            payout = betResult.payout;
        }
    }
    let tokenConfig = config.dice.trc10_support[dice_result.tokenID];
    if (tokenConfig == null || tokenConfig.enable !== true) return;
    if (isWin) {
        if (payout >= tokenConfig.highroll * tokenConfig.decimal) { isHighRoller = true; }
        if (multiplier > RARE_WIN_LIMIT) { isRareWins = true; }
    }

    await redis.hset("player:info:" + bettor, "ts", ts);
    let name = await redis.hget("player:info:" + bettor, "name");

    let completeDiceLog = createBetLogInfo(orderId, bettor, name || "", direction, number, roll,
        trxAmount, payout / 1e6, multiplier, ts, isWin, isHighRoller, isRareWins, "trc10", tokenConfig.name);

    //fill log detail data
    let log = await redis.hget("player:logs:erc10:" + bettor, orderId);
    if (log != null) {
        log = JSON.parse(log);
        completeDiceLog.fromDB = false;
        completeDiceLog.random = log.random || "";
        completeDiceLog.tx = log.tx || "";
    } else {
        completeDiceLog.fromDB = false;
        completeDiceLog.random = "";
        completeDiceLog.tx = "";
    }
    completeDiceLog.order_state = 2;
    //fill log detail data

    await redis.hset("player:logs:erc10:" + bettor, orderId, JSON.stringify(completeDiceLog));
    let min_order_id = orderId - MY_LOGS_CAP;
    redis.hkeys("player:logs:erc10:" + bettor, (err, res) => {
        if (err == null && res != null) {
            for (let key of res) {
                if (key <= min_order_id) {
                    redis.hdel("player:logs:erc10:" + bettor, key);
                }
            }
        }
    })

    let BETS_MADE = await redis.hincrby('app:info', 'count', 1);
    let TOTAL_WON = await redis.hget('app:info', 'total');

    let appInfo = { BETS_MADE, TOTAL_WON };

    if (_.isEmpty(OB_ADDR) || bettor === OB_ADDR) {
        loggerDefault.info("√√√complete => " + bettor + " orderId:" + orderId + " " + tokenConfig.name + ":"
            + trxAmount + (direction == 1 ? " over " : " under ") + number + " roll:" + roll);
    }
    appEvent.emit('bet_info', completeDiceLog, appInfo); //**  */
}