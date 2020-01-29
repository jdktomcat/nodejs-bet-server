
const conf = require('./src/configs/config');
const BigNumber = require('bignumber.js');
const moment = require('moment');
const _ = require('lodash')._;
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');
const dbService = require('./dbService');
const tronWheel = require('./tronWheel');
const tronUtil = require('./tronUtil');
const bigNumberUtil = require('./src/utils/utilBigNumber');
const sha3 = require('js-sha3');
const TronWeb = require('tronweb');
var shajs = require('sha.js')
const sha3_256 = sha3.sha3_256;
const evnets = require('events');
const EXP_MAP = require('./src/configs/exp');
const appEvent = new evnets.EventEmitter();
const solo = require('./solo');

const BROADCAST_INTERVAL_TS = conf.wheel.BROADCAST_INTERVAL_TS
const APP_KEY = conf.wheel.APP_KEY;
const RANDOM_SALT_1 = conf.wheel.RANDOM_SALT_1;
const RANDOM_SALT_2 = conf.wheel.RANDOM_SALT_2;
const RANDOM_SALT_3 = conf.wheel.RANDOM_SALT_2;
const broadcast_player_info_when_action = conf.wheel.broadcast_player_info_when_action; //是否玩家进出推送完整玩家信息列表

let Map_addr_socket = {};
let Map_socket_addr = {};
let io = require('./wheelSocket').getIo();

let ONLINE = {}; //房间内在线玩家 k:v => addr:random_key
let ONLINE_NAME = {};

const redis = require("redis").createClient(
    {
        host: conf.redisConfig.host,
        port: conf.redisConfig.port,
        password: conf.redisConfig.pwd,
        db: conf.redisConfig.db
    }
);

var tempRdm = -1;

// 全局变量, 下注信息
var betInfo = {
    lastRound : -1,
    round : 1,
    state : 0,
    roundState : 0,
    tx_id : '',
    betStime : 0,  //l开始下注时间
    betEtime : 0,  //结束下注时间
    settleStime : 0, //开始结算时间
    settleEtime : 0,  //结束结算时间
    bet2X : [],
    bet3X : [],
    bet5X : [],
    bet50X : [],
    salt : '',
    hash : '',
    luckyNum : -1,
    multi : -1,
    angle :-1,
}

var retry = 0
var stopRetry = 0
var isWorking = true

const SOLO_GAME_STATE = {//游戏状态
    READY: 0, //正在准备
    ACCEPTING: 1, //接受下注
    STOP_ACCEPTING: 2, //停止下注
    SETTLING: 3, //结算中
    STOPED : 4, //程序停止
}


function initBetInfo (round) {
    betInfo.bet2X = []
    betInfo.bet3X = []
    betInfo.bet5X = []
    betInfo.bet50X = []
    let now = new Date().getTime()
    betInfo.betStime = now
    betInfo.betEtime = now + conf.wheel.READY_DURATION
    betInfo.settleStime = 0
    betInfo.settleEtime = 0
    betInfo.state = 1
    betInfo.roundState = 1
    if (round) {
        betInfo.round = round
        betInfo.lastRound = round - 1
    }

    betInfo.salt = createRandom().substr(0, 16) + randomString(16)
    betInfo.luckyNum = compute(createRandom())
    betInfo.hash = new shajs.sha256().update(betInfo.salt + betInfo.luckyNum).digest('hex')
    betInfo.angle = randomAngle(betInfo.luckyNum)
    betInfo.multi = conf.wheel.WHEEL_MULTI[betInfo.luckyNum]
    //save important data to redis
    saveRoundInfo2Redis()
}

function randomAngle(num) {
    return (_.random(360/54 * num + 0.4, 360/54*(num+1) - 2.6) + 720).toFixed(1)
}

function createRandom() {
    let _now = Date.now() + 5211;
    let _random = _.random(100000000, 999999999) - 1949;
    let _result = sha3_256(sha3_256(APP_KEY + _now + RANDOM_SALT_1) + _random + RANDOM_SALT_2 + tempRdm + RANDOM_SALT_3);
    tempRdm = _result;
    return _result;
}

function compute(_hash) {
    let _number = (new BigNumber(_hash, 16)).mod(56).toNumber();
    if (_number >= 54) {
        let tmp = []
        for (let index = 0; index < 54; index++) {
            if (conf.wheel.WHEEL_MULTI[index] < 5) {
                tmp.push(index)
            }
        }
        // console.log(tmp.join(','))
        let tmpi = Math.floor(_.random(0, tmp.length -1))
        // console.log('-----------Math.floor(_.random(0, tmp.length)), tmp.length',tmpi, tmp[tmpi], tmp.length)
        _number = tmp[tmpi]
    }

    if (_number >= 54) {
        _number = 2   //check again， make sure that the number is ok
    }
    return _number
}

function randomString(range) {
    let str = "",
      arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
        'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
        'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        '-'];
  
    for (let i = 0; i < range; i++) {
      pos = Math.round(Math.random() * (arr.length - 1));
      str += arr[pos];
    }
    return str;
}

appEvent.on('error', () => {
    console.log('--event error----')
})



appEvent.on('player_in', (addr, bet, multi) => {
    console.log('--------addr, bet, multi---------',addr, bet, multi)
    try {
        bet = Number(bet);
        multi = Number(multi);
    } catch (error) {
        console.log(error)
        return;
    }

    
    if (!_.isNumber(bet) || _.isNaN(bet) || !_.isNumber(multi) || _.isNaN(multi) || _.isEmpty(addr)) return;

    console.log(">>>player_in", addr, bet, multi);
    if (betInfo.state !== SOLO_GAME_STATE.ACCEPTING) return loggerDefault.warn("×××", "Game is not accepting", addr);
    let count = betInfo.count + 1;
    let total = betInfo.total + bet;
    player_info = newPlayer(count, addr, bet, multi);
    if (multi == 2) {
        betInfo.bet2X.push(player_info)
    } else if (multi == 3) {
        betInfo.bet3X.push(player_info)
    } else if (multi == 5) {
        betInfo.bet5X.push(player_info)
    } else if (multi == 50) {
        betInfo.bet50X.push(player_info)
    } else {
        return loggerDefault.warn("×××", "Game is not accepting", addr);
    }
    loggerDefault.info("√√√", "in >>> [" + addr + "][name:" + (ONLINE_NAME[addr] || "null") + "] bet = " + bet + " TRX multi@" + multi);
    broadcast("player_in", player_info);

    if (broadcast_player_info_when_action === true) {
        let players_info = getPlayerInfo();
        broadcast("player_info", players_info);
    }
})

appEvent.on('keep_accepting', () => {
    //广播正在接受下注
    let _now = new Date().getTime()
    NoticeAcceptBet('KEEP_WAITING')
    loggerDefault.info('-----------keep_accepting----------')
})


appEvent.on('stop_accepting', () =>{
    loggerDefault.info('-----------stop_accepting----------')
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        try {
            let _roundInfo = await tronWheel.getRoundState()
            if (_roundInfo._roundState == 2) {
                stopRetry = 0
                betInfo.begin_tx_id = 'justr';
                betInfo.roundState = 2
                await refreshPlayerInfo(true)
                betInfo.state = SOLO_GAME_STATE.SETTLING
                NoticeAllPlayingUsers()
                appEvent.emit("settling");
                NoticeSettling('START_ROLL')
                return;
            }
            
            let txRet = await tronWheel.stopAcceptBeting();
            console.log(txRet)
            if (txRet.result === true) {
                appEvent.emit("confirm_stoped", txRet.transaction.txID);
            } else {
                appEvent.emit("stop_accepting");
            }
        } catch (error) {
            loggerDefault.error(error, '-------stop_accepting_error------round=>:', betInfo.round)
            appEvent.emit("stop_accepting");
        }
    }, 200);
})


appEvent.on('confirm_stoped', (txId) =>{
    loggerDefault.info('-----------confirm_stoped----------')
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        try {
            let txOk = await tronUtil.confirmTxIn2Nodes3Times(txId, 500);
            console.log(txId)
            if (txOk) {
                stopRetry = 0
                betInfo.begin_tx_id = txId;
                betInfo.roundState = 2
                let ret = await refreshPlayerInfo(true)
                betInfo.state = SOLO_GAME_STATE.SETTLING
                console.log('-----------------refreshPlayerInfo------------', ret, betInfo.roundState)
                if (betInfo.roundState == 2) {
                    NoticeAllPlayingUsers()
                }
                // appEvent.emit("refresh_players");
                appEvent.emit("settling");
                NoticeSettling('START_ROLL')
            } else {
                stopRetry += 1
                if (stopRetry >= 20) {
                    stopRetry = 0
                    loggerDefault.warn("stop_accepting try again!!! last tx_id :", txId);
                    appEvent.emit("stop_accepting");
                    return;
                } else {
                    appEvent.emit("confirm_stoped", txId);
                }
            }
        } catch (error) {
            loggerDefault.error(error, '-------stop_accepting_error------round=>:', betInfo.round)
            appEvent.emit("confirm_stoped", txId);
        }
    }, 500);
})

// appEvent.on('refresh_players', () => {
//     let timer = setTimeout(async () => {
//         clearTimeout(timer);
//         try {
//             let ret = await refreshPlayerInfo()
//             if (ret && betInfo.roundState == 2) {
//                 NoticeAllPlayingUsers()
//             } else {
//                 appEvent.emit("refresh_players");
//             }
//         } catch (error) {
//             loggerError.error(error);
//             appEvent.emit("refresh_players");
//         }
//     }, 500);
// })

appEvent.on('settling', () => {
    loggerDefault.info('-----------settling round----------', betInfo.round)
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        try {
            let _roundInfo = await tronWheel.getRoundState()
            let _blockState = _roundInfo._roundState
            let _round = _roundInfo._round

            if (_round > betInfo.round && _blockState == 1) {
                loggerDefault.info("confirm tx failed, but state changed, try to start new round " + _round +" ==> save db");
                await dbService.addInfo(betInfo);
                FinishedAtask()
                if (isWorking === true) {
                    loggerDefault.info("state changed to next step -> award confirm\r\n");
                    appEvent.emit('award_confirm');
                    return;
                }  
            }

            // if (_round > betInfo.round && _blockState == 2) {
            //     loggerDefault.info("confirm tx failed, but state changed to next round 2, try to sttle new round " + _round)
            //     initBetInfo(_round) //两次停止下单, 其中一次延迟生效之后会出现到下一轮之直接进入待解决状态
            // }

            if (_round <= betInfo.lastRound) {
                loggerDefault.info("betInfo.round <= betInfo.lastRound", betInfo.round , betInfo.lastRound);
                appEvent.emit('try_new_round'); //回滚, 尝试新一轮
                return;
            }
            betInfo.state = SOLO_GAME_STATE.SETTLING
            let txRet = await tronWheel.finishedTrunWheel(conf.wheel.WHEEL_MULTI[betInfo.luckyNum], betInfo.round);
            if (txRet != null && txRet.result === true) {
                // console.log("txRet",txRet);
                appEvent.emit('tx_confirm', txRet.transaction.txID, betInfo.round)
            } else {
                appEvent.emit('settling');
            }
        } catch (error) {
            loggerError.error(error);
            appEvent.emit('settling');
        }
    }, 1000);
})

appEvent.on('tx_confirm', (tx_id, _round) => {
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        try {
            let done_round = betInfo.lastRound
            if (_round <= done_round || betInfo.round <= done_round || _round < betInfo.round) {
                loggerDefault.info("_round <= done_round", _round, done_round,betInfo.round);
                return;
            }
            loggerDefault.info("appEvent -> award_tx_confirm", _round, tx_id);
            let txOk = await tronUtil.confirmTxIn2Nodes3Times(tx_id, 1500);
            loggerDefault.info("appEvent -> award_tx_confirm -> txOk:", _round, txOk, tx_id);
            // if (txOk != null && txOk === true) {
            if (txOk) {
                retry = 0;
                if (betInfo.round !== _round) {
                    loggerDefault.info("betInfo.round !== _round", betInfo.round, _round);
                    return;
                }
                betInfo.tx_id = tx_id;
                if (done_round != null && _round > done_round) {
                    betInfo.lastRound = _round;
                    done_round = _round
                    loggerDefault.info("award done !!! => " + done_round);
                }
                loggerDefault.info("==> save db");
                await dbService.addInfo(betInfo);
                FinishedAtask()
                if (isWorking === true) {
                    loggerDefault.info("==> next step -> award confirm\r\n");
                    appEvent.emit('award_confirm');
                    return;
                } else {
                    loggerDefault.warn("==> app will be shutdwon\r\n");
                    betInfo.state = SOLO_GAME_STATE.STOPPED;
                    // process.exit(0);
                    return;
                }
            } else {
                retry = retry + 1;
            }

            if (_round <= done_round || betInfo.round <= done_round || _round < betInfo.round) {
                return;
            }
            loggerDefault.warn("retry tx_confirm for round[" + _round + "] = " + retry + " !!! done_round:" + done_round);
            if (retry >= 9) {
                retry = 0;
                loggerDefault.warn("award try again!!!");
                appEvent.emit('settling');
                // appEvent.emit('tx_confirm', tx_id, _round);
            } else {
                await sleep(400) //total wait 8s. if not confirmed, try again
                appEvent.emit('tx_confirm', tx_id, _round);
            }
        } catch (error) {
            loggerError.error(error);
            appEvent.emit('tx_confirm', tx_id, _round);
        }
    }, 1024);
})

let try_award_confirm = 0
appEvent.on('award_confirm', () => {
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        try {
            let ret = await tronWheel.getRoundState();
            loggerDefault.info("award_confirm", ret);
            if (ret._roundState === 1) {
                await newRound(ret._round)
            } else if (ret._roundState === 2 && ret._round > betInfo.round) {
                await newRound(ret._round)
            }else {
                try_award_confirm += 1
                if (try_award_confirm > 6) {
                    try_award_confirm = 0
                    appEvent.emit("settling");
                } else {
                    appEvent.emit("award_confirm");
                }
                
            }
        } catch (error) {
            loggerError.error(error);
            appEvent.emit("award_confirm");
        }
    }, 5000);
})


appEvent.on('try_new_round', () => {
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        try {
            let ret = await tronWheel.getRoundState();
            loggerDefault.info("try_new_round....maybe block roll back", ret);
            await newRound(ret._round)
        } catch (error) {
            loggerError.error(error);
            appEvent.emit("try_new_round");
        }
    }, 5000);
})

appEvent.on('start_accepting', () => {
    //广播开始接受下注
    betInfo.state = SOLO_GAME_STATE.ACCEPTING
    NoticeAcceptBet('WAITING')
    loggerDefault.info('-----------start new round----------------------')
    let players_info = getPlayerInfo();
    broadcast("player_info", players_info);
})

appEvent.on('save_2_redis', () => {
    //广播开始接受下注
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        await saveRoundInfo2Redis()
    }, 1);
})


function FinishedAtask(){
    try {
        if (betInfo.multi == 2) {
            betInfo.bet2X.map(item => {
                if (item.amount >= 100) {
                    redis.publish("task_message", JSON.stringify({ addr: item.addr, task_id: 3, val: 1, game_type: 'ring'}));
                }
            })
        } else if (betInfo.multi == 3) {
            betInfo.bet3X.map(item => {
                if (item.amount >= 100) {
                    redis.publish("task_message", JSON.stringify({ addr: item.addr, task_id: 3, val: 1, game_type: 'ring'}));
                    redis.publish("task_message", JSON.stringify({ addr: item.addr, task_id: 6, val: 1, game_type: 'ring'}));
                }
            })
        } else if (betInfo.multi == 5) {
            betInfo.bet5X.map(item => {
                if (item.amount >= 100) {
                    redis.publish("task_message", JSON.stringify({ addr: item.addr, task_id: 3, val: 1, game_type: 'ring'}));
                    redis.publish("task_message", JSON.stringify({ addr: item.addr, task_id: 6, val: 1, game_type: 'ring'}));
                    redis.publish("task_message", JSON.stringify({ addr: item.addr, task_id: 9, val: 1, game_type: 'ring'}));
                }
            })
        } else if (betInfo.multi == 50) {
            betInfo.bet50X.map(item => {
                if (item.amount >= 100) {
                    redis.publish("task_message", JSON.stringify({ addr: item.addr, task_id: 3, val: 1, game_type: 'ring'}));
                    redis.publish("task_message", JSON.stringify({ addr: item.addr, task_id: 6, val: 1, game_type: 'ring'}));
                    redis.publish("task_message", JSON.stringify({ addr: item.addr, task_id: 9, val: 1, game_type: 'ring'}));
                }
            })
        }
    } catch (error) {
        console.log(error)
        console.log('publish task info failed')
    }
}

//main loop
function run() {
    setInterval(() => {
        if (betInfo == null) return;
        let _now = Date.now();
        if (betInfo.state === SOLO_GAME_STATE.ACCEPTING && _now < betInfo.betEtime) {
            appEvent.emit('keep_accepting');
        } else if (betInfo.state === SOLO_GAME_STATE.ACCEPTING && _now >= betInfo.betEtime) {
            betInfo.state = SOLO_GAME_STATE.STOP_ACCEPTING
            // appEvent.emit('save_2_redis');
            NoticeStopAccept('PENDING')
            appEvent.emit('stop_accepting');
        } else if(betInfo.state === SOLO_GAME_STATE.STOP_ACCEPTING) {
            NoticeStopAccept('PENDING')
        } else if (betInfo.state === SOLO_GAME_STATE.SETTLING) {
            // appEvent.emit('save_2_redis');
            NoticeSettling('CONFIRMING')
        }
    }, BROADCAST_INTERVAL_TS);
}


let newPlayer = function (no, addr, bet, multi) {
    return {
        addr: addr,
        amount: bet,
        multi: multi,
    }
}

//从区块同步数据到本地
async function syncPlayerInfoFromBlock() {
    //todo
    await refreshPlayerInfo(false)
}

//开始新一轮
async function newRound(round) {
    console.log('====================================new round start=========================================', round)
    let lastRount = await hget('wheel_round_info', 'round:' + round)
    console.log(lastRount)
    if (!_.isEmpty(lastRount)) {
        let lastRound = JSON.parse(lastRount)
        let now = new Date().getTime()
        betInfo.betStime = lastRound.betStime
        betInfo.betEtime = lastRound.betEtime
        betInfo.settleStime = lastRound.settleStime
        betInfo.settleEtime = lastRound.settleEtime
        betInfo.state = lastRound.state
        betInfo.roundState = lastRound.roundState
        betInfo.round = lastRound.round
        betInfo.lastRound = lastRound.lastRound
    
        betInfo.salt = lastRound.salt
        betInfo.luckyNum = lastRound.luckyNum
        betInfo.hash = lastRound.hash
        betInfo.angle = lastRound.angle
        betInfo.multi = lastRound.multi

        await syncPlayerInfoFromBlock()
    } else {
        initBetInfo(round)
    }
    //to 开始新一轮逻辑
    appEvent.emit('start_accepting');
}

async function appStart() {
    let _roundInfo = await tronWheel.getRoundState()
    console.log('_roundInfo--------------',_roundInfo)
    let _round = _roundInfo._round
    let _roundState = _roundInfo._roundState
    console.log('=========================!')
    console.log(_roundInfo)
    if (_roundState === 2) {
        //先结算上一轮
        let lastRount = await hget('wheel_round_info', 'round:' + _round)
        console.log(lastRount)
        if (!_.isEmpty(lastRount)) {
            let lastRound = JSON.parse(lastRount)
            let now = new Date().getTime()
            betInfo.betStime = lastRound.betStime
            betInfo.betEtime = lastRound.betEtime
            betInfo.settleStime = lastRound.settleStime
            betInfo.settleEtime = lastRound.settleEtime
            betInfo.state = lastRound.state
            betInfo.roundState = lastRound.roundState
            betInfo.round = lastRound.round
            betInfo.lastRound = lastRound.lastRound
        
            betInfo.salt = lastRound.salt
            betInfo.luckyNum = lastRound.luckyNum
            betInfo.hash = lastRound.hash
            betInfo.angle = lastRound.angle
            betInfo.multi = lastRound.multi
        } else {
           initBetInfo(_round)
        }
        await syncPlayerInfoFromBlock()
    } else {
        await newRound(_round)
    }
    run()
}


function addNameAttrs(alist) {
    let result = []
    for (let one of alist) {
        let _name = ONLINE_NAME[one.addr]
        let tmp = {
            addr : one.addr,
            amount : one.amount,
            multi : one.multi,
            name : _name || ""
        }
        result.push(tmp)
    }
    return result
}

function getPlayerInfo(){

    let plays = {
        bet2X : addNameAttrs(betInfo.bet2X),
        bet3X : addNameAttrs(betInfo.bet3X),
        bet5X : addNameAttrs(betInfo.bet5X),
        bet50X : addNameAttrs(betInfo.bet50X),
        bet2XTotal : sumAmoundByBetMulti(betInfo.bet2X),
        bet3XTotal : sumAmoundByBetMulti(betInfo.bet3X),
        bet5XTotal : sumAmoundByBetMulti(betInfo.bet5X),
        bet50XTotal : sumAmoundByBetMulti(betInfo.bet50X),
    }

    return plays
}

function sumAmoundByBetMulti(X) {
    let sum = 0
    X.map((item) =>{
        sum += item.amount
    })
    return sum
}

function getGameInfo(){
    return {
        state : stateToString(betInfo.state),
        round : betInfo.round,
        hash : betInfo.hash,
    }
}

function stateToString(state) {
    switch (state) {
        case SOLO_GAME_STATE.READY:
            return "READY";
        case SOLO_GAME_STATE.ACCEPTING:
            return "ACCEPTING";
        case SOLO_GAME_STATE.STOP_ACCEPTING:
            return "STOP_ACCEPTING";
        case SOLO_GAME_STATE.SETTLING:
            return "CONFSETTLINGIRMING";
        case SOLO_GAME_STATE.STOPPED:
            return "STOPPED";
    }
}

function broadcast(method, data) {
    io.sockets.in('wheel').emit(method.toString(), data);
}

//通知接受下注
function NoticeAcceptBet(method){
    let _now = new Date().getTime()
    let cntDown =  Math.floor((betInfo.betEtime - _now)/ 1000)
    cntDown = cntDown < 0 ? 0 : cntDown
    broadcast(method, {round : betInfo.round, hash : betInfo.hash, cntDown : cntDown})
}

//通知停止接受下注
function NoticeStopAccept(method){
    broadcast(method, {round : betInfo.round, hash : betInfo.hash})
}

//通知本轮结果, 并等待下一轮开始
function NoticeSettling(method){
    broadcast(method, {round : betInfo.round, hash : betInfo.hash, salt : betInfo.salt, luckyNum : betInfo.luckyNum, angle : betInfo.angle})
}

function NoticeAllPlayingUsers(){
    broadcast('player_info', getPlayerInfo())
}

io.on('connection', function (socket) {
    // console.log("connection",socket);
    //断开事件
    socket.on('disconnect', function (data) {
        let socket_id = socket.id;
        let addr = Map_socket_addr[socket_id];
        if (!_.isEmpty(addr)) {
            delete Map_addr_socket[addr];
            delete Map_socket_addr[socket_id];
            console.log("player " + addr + " leave! socket id = " + socket_id);
        }
    })

    socket.on('join', (room, addr) => {
        if (_.isEmpty(room) || room !== "wheel") return;
        socket.join(room);
        if (isWorking === false) return;
        let game_info = getGameInfo();
        if (game_info != null) {
            socket.emit("player_info", getPlayerInfo());
        }
        let _key = _.random(0, 9999);
        ONLINE[addr] = _key;
        redis.hget('player:info:' + addr, 'name', (err, result) => {
            // console.log("app:dice:player",addr,err,result);
            if (err) return;
            if (result && !_.isEmpty(result) && result.length > 0) {
                ONLINE_NAME[addr] = result;
                socket.emit("user_name", result);
            } else {
                socket.emit("user_name", addr);
            }
        })
        socket.emit("game_key", _key);
        if (!_.isEmpty(addr) && TronWeb.isAddress(addr)) {
            let socket_id = socket.id;
            Map_addr_socket[addr] = socket.id;
            Map_socket_addr[socket_id] = addr;
            console.log("player " + addr + " come back! socket id = " + socket_id);
        }
    })

    socket.on('leave', (room) => {
        room = room || 'wheel'
        socket.leave(room);
    })

    socket.on('player_in', (addr, amount, multi, key) => {
        console.log('player_in', addr, amount, multi, key)
        // if (ONLINE[addr] !== key) return;
        appEvent.emit('player_in', addr, amount, multi);
        console.log('----------player_in_event_send-------------')
    })


    socket.on('history_logs', async (addr) => {
        // if (_.isEmpty(addr)) return;
        if (_.isEmpty(addr)) addr = "";
        let pre_round = betInfo.round - 1;

        let logs = await dbService.getMyLogs(pre_round, 32);
        let db_round_max = 0;
        if (logs != null && logs.length > 0) {
            db_round_max = logs[0].round;
        }

        socket.emit("history_logs_ret", logs);
    })

    socket.on('round_log', async (round) => {
        if (!_.isNumber(round)) return;
        if (round === 0) return;
        let ret = await dbService.getRoundInfo(round);
        if (ret[0] == null) return
        let roundInfo = ret[0];
        roundInfo.result = (roundInfo.result + 0.0002).toFixed(2);
        let playerInfo = ret[1];
        for (let p of playerInfo) {
            p.cashed_out = (p.cashed_out + 0.0002).toFixed(2);
            p.profit = (p.profit + 0.0002).toFixed(2);
        }
        
        socket.emit("round_log_ret", {
            roundInfo,
            playerInfo
        });
    })
});


async function refreshPlayerInfo(isAddExp) {
    let players = await tronWheel.getRoundInfo()
    let bet2X = []
    let bet3X = []
    let bet5X = []
    let bet50X = []
    let index = 1
    let _now = new Date().getTime()
    await Promise.all(players.map(async (item) => {
        sendGameMsg(item.addr, betInfo.round, item.amount, index)
        index += 1
        let addr = item.addr
        await hincrby("player:info:" + addr, "count", 1);
        let exp = await hincrby("player:info:" + addr, "total", Math.floor(item.amount));
        let lv = getLv(exp);
        console.log('lv---------------------lv', lv, exp)
        // await hset("player:info:" + addr, "lv", lv);
        // await hset("player:info:" + addr, "ts", _now);        

        if (item.multi == 2) {
            bet2X.push(item)
        } else if (item.multi == 3) {
            bet3X.push(item)
        } else if (item.multi == 5) {
            bet5X.push(item)
        } else if (item.multi == 50) {
            bet50X.push(item)
        }
    }))
    betInfo.bet2X = bet2X
    betInfo.bet3X = bet3X
    betInfo.bet5X = bet5X
    betInfo.bet50X = bet50X
    if (players.length) {
        return true
    } else {
        return false
    }
}

async function saveRoundInfo2Redis(){
    await redis.hset("wheel_round_info", 'round:' + betInfo.round, JSON.stringify({
        lastRound : betInfo.lastRound,
        round : betInfo.round,
        state : betInfo.state,
        roundState : betInfo.roundState,
        tx_id : betInfo.tx_id,
        betStime : betInfo.betStime,  //l开始下注时间
        betEtime : betInfo.betEtime,  //结束下注时间
        settleStime : betInfo.settleStime, // 开始结算时间
        settleEtime : betInfo.settleEtime,  // 结束结算时间
        salt : betInfo.salt,
        hash : betInfo.hash,
        luckyNum :betInfo.luckyNum,
        multi : betInfo.multi,
        angle :betInfo.angle,
    }));
}

function getLv(exp) {
    let _lv = 99;
    for (let lv = 0; lv < 99; lv++) {
        if (exp < EXP_MAP[lv]) {
            _lv = lv;
            break;
        }
    }
    return _lv;
}

function hget(key, field) {
    return new Promise((resolve, reject) => {
        redis.hget(key, field, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

function hincrby(key, field, value) {
    return new Promise((resolve, reject) => {
        redis.hincrby(key, field, value, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

function hset(key, field, value) {
    return new Promise((resolve, reject) => {
        redis.hset(key, field, value, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

function redisDel(key) {
    return new Promise((resolve, reject) => {
        redis.del(key, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

//SIGINT信號：稍後進程停止！
process.on('SIGINT', async () => {
    if (process.env.NODE_ENV !== 'production') process.exit(0);
    loggerDefault.info("[graceful shutdow ... by SIGINT]");
    let stopped = await gracefulShutdown();
    if (stopped) {
        process.exit(0);
    }
});

//SIGTERM信號：進程關閉可好？
process.on('SIGTERM', async () => {
    if (process.env.NODE_ENV !== 'production') process.exit(0);
    loggerDefault.info("[graceful shutdow ... by SIGTERM]");
    let stopped = await gracefulShutdown();
    if (stopped) {
        process.exit(0);
    }
});

function sleep(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    })
}

function getTimeStr(ts) {
    return moment(ts).format("YYYY-MM-DD HH:mm:ss.SS");
}

async function main() {
    await appStart()
    await solo.soloStart()
}

main()


let _GAME_TYPE = "ring";
let ACTIVITY_START_TS = conf.wheel.ACTIVITY_START_TS || 0;
let ACTIVITY_END_TS = conf.wheel.ACTIVITY_END_TS || 0;
function sendGameMsg(addr, order_id, trxAmount, index) {
    console.log('-------------------------------sendGameMsg---------------------------------------')
    trxAmount = trxAmount
    let _now = _.now();
    if (_now < ACTIVITY_START_TS || _now > ACTIVITY_END_TS) return;
    if (trxAmount < 100) return [trxAmount, 0, false];
    //箱子爆率=投注额^0.527163*0.3%
    let persent = Math.floor(Math.pow(trxAmount, 0.495424251) * 30);
    if (persent > 9000) persent = 9000;
    let _r = _.random(0, 10000);
    let hit = false;
    if (_r <= persent) {
        hit = true;
    }
    if (hit === true) {
        let tmp_order =  order_id * 10000000 + index
        let msg = { addr: addr, order_id: tmp_order, box_num: 1, game_type: _GAME_TYPE };
        // loggerDefault.info("sendGameMsg", msg);
        redis.publish("game_message", JSON.stringify(msg));
        appEvent.emit('activity_info', msg); //**  */
    }
    return [trxAmount, persent, hit];
}

appEvent.on('activity_info', (msg) => {
    let socket_id = Map_addr_socket[msg.addr];
    if (!_.isEmpty(socket_id)) {
        let socket = _.findLast(io.sockets.sockets, { id: socket_id });
        if (!_.isEmpty(socket)) {
            socket.emit('activity_info', msg);
        }
    }
})