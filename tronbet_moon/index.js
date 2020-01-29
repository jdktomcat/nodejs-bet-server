
const config = require('./src/configs/config');
const BigNumber = require('bignumber.js');
const moment = require('moment');
const TronWeb = require('tronweb');
const _ = require('lodash')._;
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');
const dbService = require('./dbService');
const tronNodePool = require('./src/service/tronNodePool');
const tronCrash = require('./tronCrash');
const tronUtil = require('./tronUtil');
const bigNumberUtil = require('./src/utils/utilBigNumber');
const EXP_MAP = require('./src/data/exp');
const sha3 = require('js-sha3');
const sha3_256 = sha3.sha3_256;
const evnets = require('events');
const appEvent = new evnets.EventEmitter();

const redis = require("redis").createClient(
    {
        host: config.redisConfig.host,
        port: config.redisConfig.port,
        password: config.redisConfig.pwd,
        db: config.redisConfig.db
    }
);

const APP_KEY = config.moon.APP_KEY;
const RANDOM_SALT_1 = config.moon.RANDOM_SALT_1;
const RANDOM_SALT_2 = config.moon.RANDOM_SALT_2;
const RANDOM_SALT_3 = config.moon.RANDOM_SALT_2;
const READY_DURATION = config.moon.READY_DURATION; //等待下注事件ms
const MAX_LOSE = config.moon.MAX_LOSE; //每轮游戏最大赔付上限trx => 自动爆点
const MAX_BET = config.moon.MAX_BET; //单个玩家最大下注金额trx
const MAX_PAYOUT = config.moon.MAX_PAYOUT; //单个玩家最大赔付下注限制trx
const MAX_RATE = config.moon.MAX_RATE; //最大爆点
const BROADCAST_INTERVAL_TS = config.moon.BROADCAST_INTERVAL_TS; //广播间隔ms
const broadcast_player_info_when_action = config.moon.broadcast_player_info_when_action; //是否玩家进出推送完整玩家信息列表
const check_key = config.moon.check_key; //开启玩家数据验证

let isWorking = true; //正在运行
let ONLINE = {}; //房间内在线玩家 k:v => addr:random_key
let ONLINE_NAME = {};
let tempRdm = "";//上轮随机数

let Map_addr_socket = {};
let Map_socket_addr = {};

let crash_info = null; //游戏信息

const GAME_STATE = {//Crash游戏状态
    WAITING: 0, //正在准备
    PENDING: 1, //已就绪
    RUNNING: 2, //正在运行
    CONFIRMING: 3, //正在结算
    STOPPED: 4, //程序停止
}

let io = require('socket.io')(config.app.websocket_port);
io.set('origins', '*:*'); //运行跨域
function broadcast(method, data) {
    io.sockets.in('crash').emit(method.toString(), data);
}
io.on('connection', function (socket) {
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
        if (_.isEmpty(room) || room !== "crash") return;
        socket.join(room);
        if (isWorking === false) return;
        let game_info = getGameInfo();
        if (game_info != null) {
            socket.emit(game_info.state, game_info);
            socket.emit("player_info", getPlayerInfo());
        }
        let _key = _.random(0, 9999);
        ONLINE[addr] = _key;
        redis.hget('player:info:' + addr, 'name', (err, result) => {
            if (err) return;
            if (result && !_.isEmpty(result) && result.length > 0) {
                ONLINE_NAME[addr] = result;
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

    socket.on('player_in', (addr, amount, auto_out, key) => {
        if (check_key && ONLINE[addr] !== key) return;
        appEvent.emit('player_in', addr, amount, auto_out);
    })

    socket.on('player_out', (addr, key) => {
        if (check_key && ONLINE[addr] !== key) return;
        appEvent.emit('player_out', addr);
    })

    socket.on('my_logs', async (addr) => {
        // if (_.isEmpty(addr)) return;
        if (_.isEmpty(addr)) addr = "";
        let pre_round = crash_info.round - 1;

        let logs = await dbService.getMyLogs(pre_round, 50, addr);
        let db_round_max = 0;
        if (logs != null && logs.length > 0) {
            db_round_max = logs[0].round;
        }
        let ret = [];

        while (pre_round > db_round_max) {
            let log = await hget("moon_log", pre_round);
            if (log != null) {
                log = JSON.parse(log);
                let player_log = log.players[addr];
                let your_cashed_out = "-";
                let bet = "-";
                let profit = "-";
                if (player_log != null) {
                    your_cashed_out = player_log.cashed_out;
                    bet = player_log.bet;
                    profit = player_log.profit;
                }
                ret.push({ round: log.round, result: log.result, your_cashed_out, bet, profit });
            }
            pre_round = pre_round - 1;
        }
        for (let i = 0; i < logs.length; i++) {
            let result = logs[i].result
            let your_cashed_out = logs[i].your_cashed_out;
            let bet = logs[i].bet;
            let profit = logs[i].profit;
            if (result === 0) { logs[i].result = "-"; } else { logs[i].result = bigNumberUtil.toFixed(result / 100) }
            if (your_cashed_out === 0) {
                logs[i].your_cashed_out = "-";
            } else if (your_cashed_out > result) {
                logs[i].your_cashed_out = 0;
            } else {
                logs[i].your_cashed_out = bigNumberUtil.toFixed(your_cashed_out / 100);
            }
            if (bet === 0) {
                logs[i].bet = "-";
                logs[i].profit = "-";
            } else {
                logs[i].bet = bigNumberUtil.toFixed(bet / 1e6);
                logs[i].profit = bigNumberUtil.toFixed((profit - bet) / 1e6);
            }

            ret.push(logs[i]);
        }
        socket.emit("my_logs_ret", ret);

        redis.hkeys("moon_log", (err, ret) => {
            for (let key of ret) {
                let _key = Number(key);
                if (_key < db_round_max) {
                    hdel("moon_log", key);
                }
            }
        })
    })

    socket.on('round_log', async (round) => {
        if (!_.isNumber(round)) return;
        if (round === 0) return;
        let ret = await dbService.getRoundInfo(round); //form db

        if (ret[0] == null) { //from redis
            let log = await hget("moon_log", round);
            if (log == null) return;
            log = JSON.parse(log);
            let roundInfo = { end_ts: log.end_ts, result: log.result, hash: log.end_tx_id }
            let playerInfo = [];
            let players = log.players;
            for (let addr in players) {
                let player_log = players[addr];
                playerInfo.push({ addr: player_log.addr, bet: player_log.bet, cashed_out: player_log.cashed_out, profit: player_log.profit, name: (ONLINE_NAME[addr] || "") });
            }
            socket.emit("round_log_ret", { roundInfo, playerInfo });
            return;
        }

        let roundInfo = ret[0];
        let _result = bigNumberUtil.toFixed(roundInfo.result / 100);
        roundInfo.result = _result;
        let playerInfo = ret[1];
        for (let p of playerInfo) {
            p.bet = bigNumberUtil.toFixed(p.bet / 1e6);
            p.cashed_out = bigNumberUtil.toFixed(p.cashed_out / 100);
            p.profit = bigNumberUtil.toFixed(p.profit / 1e6);
            if (p.cashed_out > _result) p.cashed_out = "-";
            p.name = ONLINE_NAME[p.addr] || "";
        }
        socket.emit("round_log_ret", { roundInfo, playerInfo });
    })
});

let newPlayer = function (no, addr, bet, auto_out) {
    return {
        no: no,
        addr: addr,
        join_ts: Date.now(),
        name: "",
        bet: bet,
        auto_out: auto_out,
        cashed_out: 0,
        payout: 0,
        profit: 0,
        hold_ts: 0,
    }
}

async function start(_round, _players, count, total) {
    if (_round == null) _round = 1;

    let _now = Date.now();
    crash_info = {
        round: _round,
        hash: "",
        result: 0,
        count: count != null ? count : 0,
        win_count: 0,
        total: total != null ? total : 0,
        payout: 0,
        players: _players != null ? _players : (new Map()),
        waiting_ts: _now, //开始下注
        pending_ts: _now + READY_DURATION, //下注结束，开始确认
        begin_ts: 0, //开始时间
        duration: 0,
        end_ts: 0, //结束时间
        begin_tx_id: "",
        end_tx_id: "",
        state: GAME_STATE.WAITING
    }

    redisDel("moon_info");
    // isWorking = true;

    appEvent.emit('waiting');
}

function getGameInfo() {
    if (crash_info == null) return null;
    return {
        round: crash_info.round,
        count: crash_info.count,
        total: crash_info.total,
        waiting_duration: READY_DURATION,
        waiting_ts: crash_info.waiting_ts,
        pending_ts: crash_info.pending_ts,
        begin_ts: crash_info.begin_ts,
        server_ts: Date.now(),
        state: stateToString(crash_info.state)
    }
}

function getPlayerInfo() {
    let all_players = crash_info.players;
    let players_list = [];
    for (let addr in all_players) {
        let p = all_players[addr];
        if (p != null) {
            p.name = ONLINE_NAME[addr] || "";
            players_list.push(p);
        }
    }
    return {
        count: crash_info.count,
        total: crash_info.total,
        players_list
    }
}

appEvent.on('waiting', () => {
    crash_info.state = GAME_STATE.WAITING;
    stateChanged();
})

let pending_confirm_try = 0;
appEvent.on('pending_confirm', () => {
    let timer = setTimeout(async () => {
        clearTimeout(timer);

        loggerDefault.info("check pending_confirm tx :" + crash_info.begin_tx_id);
        let txRet = null;
        try {
            txRet = await tronUtil.isTxSuccess(crash_info.begin_tx_id);
        } catch (error) {
            loggerDefault.error(error);
        }
        
        if (txRet == null) {
            pending_confirm_try = pending_confirm_try + 1;
            if (pending_confirm_try > 20) {
                pending_confirm_try = 0;
                appEvent.emit('pending_order');
            } else {
                loggerDefault.warn("pending_confirm tx --> null !!! retry = " + pending_confirm_try);
                appEvent.emit('pending_confirm');
            }
            return;
        } else if (txRet === false) {
            pending_confirm_try = 0;
            loggerDefault.warn("pending_confirm tx --> No !!!", txRet);
            appEvent.emit('pending_order');
            return;
        } else if (txRet === true) {
            pending_confirm_try = 0;
            loggerDefault.info("pending_confirm tx --> Yes !!!", txRet);
        }

        let ret = null;
        try {
            ret = await tronCrash.getRoundInfo(); //获取详细信息getRoundInfo，以补全玩家队列数据
        } catch (error) {
            loggerDefault.warn('pending_confirm error!');
        }
        if (ret != null && ret._roundState === 2) {
            /////// 获取最新玩家队列数据
            let res = refreshPlayerInfo(ret._bettorArray, ret._trxAmountArray, ret._autoRateArray);
            crash_info.players = res[0];
            crash_info.count = res[1];
            crash_info.total = res[2];
            appEvent.emit("running");
        } else {
            appEvent.emit("pending_confirm");
            // appEvent.emit("pending_order");
        }
    }, 3100);
})

appEvent.on('pending_order', () => {
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        let txRet = null;
        try {
            txRet = await tronCrash.TakeFlight();
        } catch (error) {
            loggerDefault.warn('pending_order error!', error);
        }
        if (txRet != null && txRet.result === true && txRet.transaction != null && !_.isEmpty(txRet.transaction.txID)) {
            crash_info.begin_tx_id = txRet.transaction.txID;
            loggerDefault.info("tronCrash.TakeFlight success => tx_id: " + crash_info.begin_tx_id);
            pending_confirm_try = 0;
            appEvent.emit("pending_confirm");
        } else {
            loggerDefault.warn("tronCrash.TakeFlight fail => txRet", txRet);
            appEvent.emit("pending_order");
        }
    }, 3100);
})

appEvent.on('pending', async () => {
    crash_info.state = GAME_STATE.PENDING;
    stateChanged();
    appEvent.emit("pending_order");
})

appEvent.on('running', () => {
    let _now = Date.now();
    let _hash = createRandom();
    let _result = compute(_hash);
    if (_result > MAX_RATE) {
        _result = MAX_RATE;
    }
    //TODO: cancel
    // _result = 1.01;
    //TODO: cancel
    let _duration = getDurationByCashedout(_result);
    crash_info.hash = _hash;
    crash_info.result = _result;
    crash_info.begin_ts = _now;
    crash_info.duration = _duration;
    crash_info.end_ts = _now + _duration;
    crash_info.state = GAME_STATE.RUNNING;
    stateChanged();
})

let award_tx_confirm_try = 0;
let retry = 0; //重试获取结算交易结果次数
let confirmed = 0; //状态确认次数
appEvent.on('award_tx_confirm', (tx_id) => {
    let timer = setTimeout(async () => {
        clearTimeout(timer);

        loggerDefault.info("check award_tx_confirm tx :" + tx_id);
        let txRet = null;
        try {
            txRet = await tronUtil.isTxSuccess(tx_id);   
        } catch (error) {
            loggerDefault.error(error);
        }
        if (txRet == null) {
            award_tx_confirm_try = award_tx_confirm_try + 1;
            if (award_tx_confirm_try > 20) {
                award_tx_confirm_try = 0;
                appEvent.emit('award');
            } else {
                loggerDefault.warn("award_tx_confirm tx --> null !!! retry = " + award_tx_confirm_try);
                appEvent.emit('award_tx_confirm', tx_id);
            }
            return;
        } else if (txRet === false) {
            award_tx_confirm_try = 0;
            loggerDefault.warn("award_tx_confirm tx --> No !!!", txRet);
            appEvent.emit('award');
            return;
        } else if (txRet === true) {
            award_tx_confirm_try = 0;
            loggerDefault.info("award_tx_confirm tx --> Yes !!!", txRet);
        }

        let roundInfo = null;
        let roundInfoCopy = null;
        try {
            roundInfo = await tronCrash.getRoundInfo();
            roundInfoCopy = await tronCrash.getRoundInfoBySlaveNode();
        } catch (error) {
            loggerDefault.warn('award_tx_confirm error!', error);
        }
        let _next_round = crash_info.round + 1;
        if (roundInfo == null) {
            loggerDefault.warn('award_tx_confirm roundInfo is empty!');
        }
        if (roundInfoCopy === null) {
            loggerDefault.warn('award_tx_confirm roundInfoCopy is empty!');
        }
        if (roundInfo != null && roundInfoCopy != null && roundInfo._roundState === 1 && roundInfoCopy._roundState === 1 && roundInfo._round === roundInfoCopy._round && roundInfo._round <= _next_round && roundInfoCopy._round <= _next_round) {
            confirmed = confirmed + 1;
            loggerDefault.info("round " + crash_info.round + " confirmed " + confirmed);
            if (confirmed >= 3) {
                confirmed = 0;
                retry = 0;
                loggerDefault.info("LandOnMoon success!");
                loggerDefault.info("save data!");
                await hset("moon_log", crash_info.round, JSON.stringify(crash_info)); //已进入下一轮 => crash_info.round - 1

                if (isWorking === true) {
                    loggerDefault.info("==> next round = " + roundInfo._round + "\r\n");
                    // appEvent.emit('award_confirm');
                    start(roundInfo._round); //开启新游戏
                    return;
                } else {
                    loggerDefault.warn("==> app will be shutdwon\r\n");
                    crash_info.state = GAME_STATE.STOPPED;
                    // process.exit(0);
                    return;
                }
            } else {
                // let t = setTimeout(() => {
                //     clearTimeout(t);
                // if (confirmed === 1) tronCrash.LandOnMoon(crash_info);
                appEvent.emit('award_tx_confirm', tx_id);
                // }, 3100);
                return;
            }
        } else {
            if (confirmed > 0) {
                loggerDefault.warn("round confirmed roll back! confirmed: " + confirmed + " => 0");
                confirmed = 0;
            }
            // if (roundInfo._roundState === 1 && roundInfoCopy._roundState === 1) {
            //     loggerDefault.warn("confirmOnce result => ", roundInfo);
            //     loggerDefault.warn("confirmTwice result => ", roundInfoCopy);
            // }
            if (roundInfo != null && roundInfoCopy != null) {
                retry = retry + 1;
            } else {
                appEvent.emit('award_tx_confirm', tx_id);
                return;
            }
        }
        if (retry > 20) {
            loggerDefault.warn("the result are different from two nodes ==> award try again");
            loggerDefault.warn(
                "roundInfo is null = " + (roundInfo === null ? "yes" : "no"),
                "roundInfoCopy is null = " + (roundInfoCopy === null ? "yes" : "no"),
                "roundInfo._roundState = " + roundInfo._roundState,
                "roundInfoCopy._roundState = " + roundInfoCopy._roundState,
                "roundInfo._round = " + roundInfo._round,
                "roundInfoCopy._round = " + roundInfoCopy._round
            )
            retry = 0;
            appEvent.emit('award');
        } else {
            appEvent.emit('award_tx_confirm', tx_id);
        }
    }, 3100);
})

appEvent.on('award', () => {
    retry = 0;
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        loggerDefault.info("LandOnMoon round:", crash_info.round);
        let txRet = null;
        try {
            txRet = await tronCrash.LandOnMoon(crash_info);
            loggerDefault.info("LandOnMoon tx =>", txRet.transaction.txID);
        } catch (error) {
            loggerDefault.warn('award error!');
        }
        if (txRet != null && txRet.result === true && txRet.transaction != null && !_.isEmpty(txRet.transaction.txID)) {
            loggerDefault.info("LandOnMoon tx submit success!!!", txRet.transaction.txID);
            crash_info.end_tx_id = txRet.transaction.txID;
            award_tx_confirm_try = 0;
            appEvent.emit('award_tx_confirm', txRet.transaction.txID);
        } else {
            loggerDefault.warn("LandOnMoon tx submit fail!!!");
            appEvent.emit('award');
        }
    }, 500);
})

appEvent.on('confirming', async () => {
    let _now = _.now();
    crash_info.state = GAME_STATE.CONFIRMING;

    let result = crash_info.result;
    // loggerDefault.info("------------------ Boooooom ~~~ ------------------ Crashed !!! --------- @ " + result + "X");

    let payout = 0;
    let win_count = 0;
    let all_players = crash_info.players;

    for (let addr in all_players) {
        let player_info = all_players[addr];
        if (player_info.cashed_out === 0) {
            if (player_info.auto_out <= result) { //处理自动退出
                player_info.cashed_out = player_info.auto_out;
                player_info.payout = bigNumberUtil.toFixed(player_info.bet * player_info.cashed_out);
                player_info.profit = bigNumberUtil.toFixed(player_info.payout - player_info.bet);
            } else {
                player_info.payout = 0;
                player_info.profit = bigNumberUtil.toFixed(0 - player_info.bet);
            }
        } else {
            win_count = win_count + 1;
        }
        loggerDefault.info(player_info.addr + " bet:" + player_info.bet + "; payout:" + player_info.payout
            + (player_info.profit > 0 ? " [win] " : " [lost] ")
            + player_info.profit + "; @" + player_info.cashed_out + "X;");

        payout = bigNumberUtil.toFixed(payout + player_info.payout);

        //更新玩家
        await hincrby("player:info:" + addr, "count", 1);
        let exp = await hincrby("player:info:" + addr, "total", Math.floor(player_info.bet));
        let lv = getLv(exp);
        await hset("player:info:" + addr, "lv", lv);
        await hset("player:info:" + addr, "ts", _now);

        sendGameMsg(addr, crash_info.round, player_info.bet);
        doTask(addr, player_info.bet, player_info.cashed_out);
    }

    //更新平台数据
    await hincrby('app:info', 'count', crash_info.count);
    await hincrby('app:info', 'total', Math.floor(crash_info.total));

    crash_info.payout = payout;
    crash_info.win_count = win_count;
    appEvent.emit('award');

    stateChanged(true);
})

let _GAME_TYPE = "moon";
let ACTIVITY_START_TS = config.moon.ACTIVITY_START_TS || 0;
let ACTIVITY_END_TS = config.moon.ACTIVITY_END_TS || 0;
function sendGameMsg(addr, order_id, trxAmount) {
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
        let msg = { addr: addr, order_id: order_id, box_num: 1, game_type: _GAME_TYPE };
        // loggerDefault.info("sendGameMsg", msg);
        redis.publish("game_message", JSON.stringify(msg));
        appEvent.emit('activity_info', msg); //**  */
    }
    return [trxAmount, persent, hit];
}

// let _GAME_TYPE = "moon";
const task_5_val = config.moon.task_5_val;
const task_8_val = config.moon.task_8_val;
const task_bet = config.moon.task_bet;
async function doTask(addr, bet, cashed_out) {
    if (bet < task_bet || cashed_out <= 0) return;
    redis.publish("task_message", JSON.stringify({ addr: addr, task_id: 2, val: 1, game_type: _GAME_TYPE }));
    if (cashed_out >= task_5_val) {
        redis.publish("task_message", JSON.stringify({ addr: addr, task_id: 5, val: 1, game_type: _GAME_TYPE }));
    }
    if (cashed_out >= task_8_val) {
        redis.publish("task_message", JSON.stringify({ addr: addr, task_id: 8, val: 1, game_type: _GAME_TYPE }));
    }
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

appEvent.on('player_in', (addr, bet, auto_out) => {
    try {
        bet = Number(bet);
        auto_out = Number(auto_out);
    } catch (error) {
        return;
    }
    if (!_.isNumber(bet) || _.isNaN(bet) || !_.isNumber(auto_out) || _.isNaN(auto_out) || _.isEmpty(addr)) return;

    if (crash_info.state !== GAME_STATE.WAITING) return loggerDefault.warn("×××", "Game is not waiting", addr);
    let player_info = crash_info.players[addr];
    if (player_info != null) return loggerDefault.warn("×××", "Addr is exists", addr);
    if (validate(bet, auto_out) === false) return loggerDefault.warn("×××", "bet or auto_out is wrong", bet, auto_out);
    let count = crash_info.count + 1;
    let total = crash_info.total + bet;
    player_info = newPlayer(count, addr, bet, auto_out);
    crash_info.players[addr] = player_info;
    crash_info.count = count;
    crash_info.total = total;
    loggerDefault.info("√√√", "in >>> [" + addr + "][name:" + (ONLINE_NAME[addr] || "null") + "] bet = " + bet + " TRX auto_out@" + auto_out);
    broadcast("player_in", player_info);

    if (broadcast_player_info_when_action === true) {
        let players_info = getPlayerInfo();
        broadcast("player_info", players_info);
    }
})

appEvent.on('player_out', (addr, _auto_out) => {
    if (crash_info.state !== GAME_STATE.RUNNING) return loggerDefault.warn("×××", "Game is not running", addr);
    let player_info = crash_info.players[addr];
    if (player_info == null) return loggerDefault.warn("×××", "addr is not exists", addr);
    if (player_info.cashed_out > 0) return loggerDefault.warn("×××", "player had cashed out", addr, player_info.cashed_out);

    let _now = Date.now();
    let hold_ts = _now - crash_info.begin_ts;
    let cashed_out = 0;


    if (_auto_out != null) {
        loggerDefault.info("√√√", "auto out <<< [" + addr + "] @" + _auto_out + "X;");
        cashed_out = _auto_out;
    } else {
        cashed_out = getCashedoutByDuration(hold_ts / 1000);
    }
    if (cashed_out <= 1) {
        cashed_out = 1.01;
    }
    if (cashed_out > crash_info.result) {
        cashed_out = crash_info.result;
    }
    if (cashed_out > MAX_RATE) {
        cashed_out = MAX_RATE;
    }
    player_info.out_ts = _now;
    player_info.cashed_out = cashed_out;
    player_info.payout = bigNumberUtil.toFixed(player_info.bet * player_info.cashed_out);
    player_info.profit = bigNumberUtil.toFixed(player_info.payout - player_info.bet);
    player_info.hold_ts = hold_ts;

    loggerDefault.info("√√√", "out <<< [" + addr + "] @" + player_info.cashed_out + "X; hold = " + hold_ts
        + " ms; bet = " + player_info.bet + "; payout = " + player_info.payout + "; win = " + player_info.profit
        + "; out at = " + getTimeStr(_now));

    redis.hset("moon_info", addr, JSON.stringify({ round: crash_info.round, out: cashed_out }));

    broadcast("player_out", player_info);

    if (broadcast_player_info_when_action === true) {
        let players_info = getPlayerInfo();
        broadcast("player_info", players_info);
    }
})

function broadcastCountDown(countdown) {
    // let _now = Date.now();
    // let countdown = crash_info.pending_ts - _now;
    broadcast("KEEP_WAITING", countdown);
}
let throttled = _.throttle(broadcastCountDown, 1000);
appEvent.on('keep_waiting', () => {
    let _now = Date.now();
    let countdown = crash_info.pending_ts - _now;
    if (countdown > 0) {
        throttled(countdown);
    }
})

appEvent.on('keep_running', () => {
    let _now = Date.now();
    let duration = _now - crash_info.begin_ts;
    let sec = duration / 1000;
    let cashed_out = getCashedoutByDuration(sec);
    let will_payout = statistics(cashed_out);

    //** !!! */
    let lose = will_payout - crash_info.total;
    // loggerDefault.info("duration = " + duration + "ms; @" + cashed_out + "; total_bet:" + crash_info.total + "; total_payout = " + (will_payout) + "; May lose = " + lose + " TRX");
    if (lose > 0 && lose > MAX_LOSE) {
        loggerDefault.warn("we may lose " + lose + " TRX! had more than max lose:" + MAX_LOSE);
        crash_info.result = cashed_out;
        crash_info.end_ts = _now;
        appEvent.emit('confirming');
        return;
    }
    //** !!! */

    broadcast("KEEP_RUNNING", duration);
})

init();

function work() {
    setInterval(() => {
        if (crash_info == null) return;
        let _now = Date.now();
        if (crash_info.state === GAME_STATE.WAITING && _now < crash_info.pending_ts) {
            appEvent.emit('keep_waiting');
        } else if (crash_info.state === GAME_STATE.WAITING && _now >= crash_info.pending_ts) {
            appEvent.emit('pending');
        }
        //  else if (crash_info.state === GAME_STATE.PENDING) {
        //     if (_now >= crash_info.begin_ts && crash_info.duration > 0) {
        //         appEvent.emit('running');
        //     } else if (_now >= crash_info.begin_ts && crash_info.duration === 0) { //爆点为0时，begin_ts === end_ts,duration === 0
        //         appEvent.emit('confirming');
        //     }
        // } 
        else if (crash_info.state === GAME_STATE.RUNNING && _now < crash_info.end_ts) {
            appEvent.emit('keep_running');
        } else if (crash_info.state === GAME_STATE.RUNNING && _now >= crash_info.end_ts) {
            appEvent.emit('confirming');
        }
    }, BROADCAST_INTERVAL_TS);
}

//投注期 按照时间降序排列
//运行期 按照退出时间标注
//结算期 按照利润降序排列

//生成随机数 ***
function createRandom() {
    let _now = Date.now() + 2018;
    let _random = _.random(1000000000, 9999999999) - 1949;
    let _result = sha3_256(sha3_256(APP_KEY + _now + RANDOM_SALT_1) + _random + RANDOM_SALT_2 + tempRdm + RANDOM_SALT_3);
    tempRdm = _result;
    return _result;
}

function compute(_hash) {
    // let _number = (new BigNumber(_hash, 16)).mod(10400).toNumber();
    // let x = ((_number) - 400) / 10000;
    // if (x < 0.01) {
    //     x = 0;
    // }
    // return Number((new BigNumber(1)).div((new BigNumber(1)).minus(x)).toFixed(3));

    let x = (new BigNumber(_hash, 16)).mod(104000000000).minus(4000000000).toNumber() / 100000000000;
    if (x < 0.01) {
        x = 0;
    }
    let ret = bigNumberUtil.toFixed((new BigNumber(1)).div((new BigNumber(1)).minus(x)).toNumber());
    if (ret > 9999) {
        ret = 9999;
    }
    return ret;
}

function validate(bet, auto_out) { //验证玩家合法+金额合法
    if (!_.isNumber(bet) || _.isNaN(bet) || bet < 0) return false;
    if (!_.isNumber(auto_out) || _.isNaN(auto_out) || auto_out < 0) return false;
    if (bet > MAX_BET) return false;
    if (bet * auto_out > MAX_PAYOUT) return false;
    return true;
}

function stateToString(state) {
    switch (state) {
        case GAME_STATE.WAITING:
            return "WAITING";
        case GAME_STATE.PENDING:
            return "PENDING";
        case GAME_STATE.RUNNING:
            return "RUNNING";
        case GAME_STATE.CONFIRMING:
            return "CONFIRMING";
        case GAME_STATE.STOPPED:
            return "STOPPED";
    }
}

//统计当前战况,以及执行自动退出
function statistics(rate) {
    let total_payout = 0;
    let all_players = crash_info.players;
    for (let addr in all_players) {
        let player_info = all_players[addr];
        if (player_info.cashed_out === 0) { //未退出
            total_payout = total_payout + player_info.bet * rate;
            if (rate >= player_info.auto_out) {
                appEvent.emit("player_out", addr, player_info.auto_out);
            }
        } else {
            total_payout = total_payout + player_info.payout;
        }
    }
    return total_payout;
}

function getTimeStr(ts) {
    return moment(ts).format("YYYY-MM-DD HH:mm:ss.SS");
}

function stateChanged(showResult = false) {
    let game_info = getGameInfo();
    let players_info = getPlayerInfo();
    if (showResult === true) {
        game_info.duration = crash_info.duration;
        game_info.end_ts = crash_info.end_ts;
        game_info.result = crash_info.result;
    }
    loggerDefault.info(
        "App:Moon:Round:" + crash_info.round
        + " [" + game_info.state + "]"
        // + " [moon @ " + (crash_info.result || 0) + "]"
        + "; players_count = " + crash_info.count
        + "; total_bet = " + crash_info.total + " TRX"
        + (crash_info.state === GAME_STATE.CONFIRMING ? ("; to_the_moon @ " + (crash_info.result || 0) + "X") : "") //谁也不能预知结果！！！
        + (crash_info.state === GAME_STATE.CONFIRMING ? ("; total_payout = " + crash_info.payout + " TRX") : "")
        + (crash_info.state === GAME_STATE.CONFIRMING ? ("; winners_count = " + crash_info.win_count) : "")
        + (crash_info.state === GAME_STATE.CONFIRMING ? ("; duration = " + crash_info.duration / 1000 + "s") : "")
        + (crash_info.state === GAME_STATE.CONFIRMING ? ("; end_at = " + getTimeStr(crash_info.end_ts) || 0) : "")
    );

    broadcast(game_info.state, game_info);
    broadcast("player_info", players_info);
}

function getDurationByCashedout(val) {
    let sec = Math.log(val) / Math.log(2) / 0.09;
    let ms = Math.floor(sec * 1000);
    // loggerDefault.info("getDurationByCashedout = " + ms + "ms");
    return ms;
}

function getCashedoutByDuration(sec) {
    // return Number(Math.pow(2, sec / 1000 * 0.09).toFixed(3));
    // return Number((Math.floor(Math.pow(2, sec * 0.09) * 1000 + 0.0000002) / 1000).toFixed(3));
    return bigNumberUtil.toFixed(Math.floor(Math.pow(2, sec * 0.09) * 1000) / 1000);
    // (Math.floor(Math.pow(2, time * 0.09) * 1000 + 0.0000002) / 1000).toFixed(3)
}

async function gracefulShutdown() {
    isWorking = false;
    return new Promise((resolve, reject) => {
        let timer = setInterval(() => {
            if (crash_info.state === GAME_STATE.STOPPED) {
                clearInterval(timer);
                resolve(true);
            }
        }, 500);
    })
}

function sleep(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
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

async function init() {
    await tronNodePool.init();
}

tronNodePool.appEvent.on('ready', onReady);

async function onReady() {
    loggerDefault.info("App is ready!!!");
    let newestRoundInfo = null;
    try {
        newestRoundInfo = await tronCrash.getRoundInfo();
    } catch (error) {
        loggerError.error(error);
        process.exit(0);
    }
    if (newestRoundInfo == null) {
        process.exit(0);
    }
    loggerDefault.info("newestRoundInfo", newestRoundInfo);
    let _round = newestRoundInfo._round;
    if (newestRoundInfo._roundState === 1) {
        /////// 获取最新玩家队列数据
        let res = refreshPlayerInfo(newestRoundInfo._bettorArray, newestRoundInfo._trxAmountArray, newestRoundInfo._autoRateArray);
        await start(_round, res[0], res[1], res[2]);
    } else {
        crash_info = {
            round: 1,  //!!!
            hash: "", //!!!
            result: 0, //!!!
            count: 0, //!!!
            win_count: 0,
            total: 0, //!!!
            payout: 0,
            players: null, //!!!
            waiting_ts: 0, //!!!
            pending_ts: 0, //!!!
            begin_ts: 0, //!!!
            duration: 0, //!!!
            end_ts: 0, //!!!
            begin_tx_id: "",
            end_tx_id: "",
            state: GAME_STATE.RUNNING
        }

        let _bettorArray = newestRoundInfo._bettorArray;
        let _trxAmountArray = newestRoundInfo._trxAmountArray;
        let _autoRateArray = newestRoundInfo._autoRateArray;
        let _all_players = new Map();
        let total = 0;
        for (let no = 0; no < _bettorArray.length; no++) {
            let addr = _bettorArray[no];
            let amount = _trxAmountArray[no] / 1e6;
            total = total + amount;
            _all_players[addr] = newPlayer(no + 1, addr, amount, _autoRateArray[no] / 100);
        }
        let max_cashed_out = 1.01;

        let out_list = await hgetall('moon_info');

        // 没有任何玩家退出 => crash@1.01倍率赔付所有玩家
        // 已有玩家退出 => crash@玩家退出倍率取最高值赔付给剩余未退出玩家

        let count = 0;
        if (out_list != null) {
            for (let addr in out_list) {
                count = count + 1;
                let playerInfo = JSON.parse(out_list[addr]);
                if (playerInfo.round === _round && playerInfo.out > max_cashed_out) {
                    max_cashed_out = playerInfo.out; //玩家退出倍率取最高值
                }
            }
        }

        loggerDefault.info("max_cashed_out", max_cashed_out);

        for (let addr in _all_players) {
            let playerInfo = _all_players[addr];
            if (out_list != null) {
                if (out_list[addr] == null) {
                    if (playerInfo.cashed_out === 0) {
                        playerInfo.cashed_out = max_cashed_out;
                    }
                } else {
                    let _p = JSON.parse(out_list[addr]);
                    if (_p.round == _round) {
                        playerInfo.cashed_out = _p.out;
                    } else {
                        playerInfo.cashed_out = max_cashed_out;
                    }
                }
            } else {
                playerInfo.cashed_out = max_cashed_out;
            }
            playerInfo.payout = bigNumberUtil.toFixed(playerInfo.bet * playerInfo.cashed_out);
            playerInfo.profit = bigNumberUtil.toFixed(playerInfo.payout - playerInfo.bet);
            playerInfo.name = ONLINE_NAME[addr] || "";
        }

        loggerDefault.info("_all_players", _all_players);

        let _now = Date.now();
        let _result = max_cashed_out;
        let _duration = getDurationByCashedout(_result);
        let _begin_ts = _now - _duration;
        let _pending_ts = _begin_ts - _.random(1000, 3000);
        let _waiting_ts = _pending_ts - READY_DURATION;

        crash_info.round = _round;
        crash_info.hash = createRandom();

        crash_info.players = _all_players;
        crash_info.count = _bettorArray.length;
        crash_info.total = total;

        crash_info.result = _result;
        crash_info.duration = _duration;
        crash_info.begin_ts = _begin_ts;
        crash_info.pending_ts = _pending_ts;
        crash_info.waiting_ts = _waiting_ts;
        crash_info.end_ts = _now;

        // loggerDefault.info("restart => newest crash info =>", crash_info);
    }
    isWorking = true;
    work();
}

function refreshPlayerInfo(_bettorArray, _trxAmountArray, _autoRateArray) {
    let all_players = new Map();
    let count = 0;
    let total = 0;
    for (let no = 0; no < _bettorArray.length; no++) {
        let addr = _bettorArray[no];
        count = count + 1;
        let amount = _trxAmountArray[no] / 1e6;
        total = total + amount;
        all_players[addr] = newPlayer(no + 1, addr, amount, _autoRateArray[no] / 100);
    }
    return [all_players, count, total];
}

function hget(key, field) {
    return new Promise((resolve, reject) => {
        redis.hget(key, field, (err, ret) => {
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

function hincrby(key, field, value) {
    return new Promise((resolve, reject) => {
        redis.hincrby(key, field, value, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

function hdel(key, field) {
    return new Promise((resolve, reject) => {
        redis.hdel(key, field, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
}

function hgetall(key) {
    return new Promise((resolve, reject) => {
        redis.hgetall(key, (err, ret) => {
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