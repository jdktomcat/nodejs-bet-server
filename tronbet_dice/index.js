const _ = require('lodash')._;
const code = require('./src/data/code');
const config = require('./src/configs/config');
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('default');
const loggerError = log4js.getLogger('error');
const TronWeb = require('tronweb');
const modelLogDice = require('./src/models/modelLogDice');
// const rankService = require('./src/service/rankService');
const tronNodePool = require('./src/service/tronNodePool');
const tronUtil = require('./src/utils/tronUtil');
const appData = require('./appData');
const appDataEvent = appData.appEvent;

const LAN_SUPPORT = config.dice.LAN_SUPPORT;
// const redpacketService = require('./src/service/redpacketService');
// let raineEvent = redpacketService.raineEvent;

const gameCenter = require('./src/games/center');
const gameDice = require('./gameDice');
let diceEvent = gameDice.appEvent;
const gameDiceTrc20 = require('./gameDiceTrc20');
let diceTrc20Event = gameDiceTrc20.appEvent;
const gameDiceTrc10 = require('./gameDiceTrc10');
let diceTrc10Event = gameDiceTrc10.appEvent;
const parseDataService = require('./src/service/parseDataService');
const createChatInfo = parseDataService.createChatInfo;

//config 配置项
const LASTEST_CHAT_QUEUE_CAP = config.dice.LASTEST_CHAT_QUEUE_CAP;
const LASTEST_BETS_QUEUE_CAP = config.dice.LASTEST_BETS_QUEUE_CAP;
const HIGH_ROLLERS_QUEUE_CAP = config.dice.HIGH_ROLLERS_QUEUE_CAP;
const RARE_WINS_QUEUE_CAP = config.dice.RARE_WINS_QUEUE_CAP;
const CHAT_LV_LIMIT = config.dice.CHAT_LV_LIMIT;
const RAIN_LV_LIMIT = config.dice.RAIN_LV_LIMIT;
const RESET_PLAYER_DATA_INTERVAL = config.dice.RESET_PLAYER_DATA_INTERVAL * 1000;

process.on('uncaughtException', function (error) {
    loggerError.error("!!!!!!!!!!!!!!!!!!!!!!!!uncaughtException", error);
    //process.exit(0);
});

process.on('unhandledRejection', error => {
    // Will print "unhandledRejection err is not defined"
    loggerError.error("!!!!!!!!!!!!!!!!!!!!!!!!unhandledRejection", error.stack);
});

const redis = require("ioredis").createClient(
    {
        host: config.redisConfig.host,
        port: config.redisConfig.port,
        password: config.redisConfig.pwd,
        db: config.redisConfig.db
    }
);

let PLAYER_INFO_MAP_KEY = "player:info:"; //玩家信息
let LASTEST_CHAT_QUEUE_KEY = "chat_dice_lan_";//最近聊天记录

let Map_addr_socket = {};
let Map_socket_addr = {};

async function init() {
    subscribe();
    await tronNodePool.init();
    await appData.init();
    gameDice.init();
    gameDiceTrc20.init();
    gameDiceTrc10.init();

    // await redpacketService.listen();
    // raineEvent.on('new_rain', async () => {
    //     console.log('new-----rain');
    //     let rain_list = await redpacketService.getRainList();
    //     // console.log("rain_list", rain_list);
    //     broadcast('rain_list', rain_list);
    // })

    // setInterval(async () => {
    //     let rain_list = await redpacketService.getRainList();
    //     // console.log("rain_list", rain_list);
    //     broadcast('rain_list', rain_list);
    // }, 15000);
}

init();

let io = require('socket.io')(config.app.websocket_port);
io.set('origins', '*:*'); //运行跨域
io.on('connection', function (socket) {
    //断开事件
    socket.on('disconnect', function () {
        let socket_id = socket.id;
        let addr = Map_socket_addr[socket_id];
        if (!_.isEmpty(addr)) {
            delete Map_addr_socket[addr];
            delete Map_socket_addr[socket_id];
            // console.log("player " + addr + " leave! socket id = " + socket_id);
        }
    })

    //下单
    socket.on('new_order', function (data) {
        let tokenType = data.tokenType;
        if (tokenType == null || tokenType === "trx") {
            loggerDefault.info("new order", data.address, data.orderId, (data.state === 1 ? "CONFIRMED" : "PENDING"));
            gameDice.handleOrder(data);
        } else if (tokenType === "trc20") {
            let tokenAddr = TronWeb.address.fromHex(data.tokenAddr);
            if (_.isEmpty(tokenAddr)) return;
            console.log("new_order_trc20", data);
            let tokenConfig = config.dice.trc20_support[tokenAddr];
            if (tokenConfig == null || tokenConfig.enable !== true) return;
            loggerDefault.info("new order trc20", data.address, data.orderId, (data.state === 1 ? "CONFIRMED" : "PENDING"), tokenAddr, tokenConfig.name);
            gameDiceTrc20.handleOrder(data);
        } else if (tokenType === "trc10") {
            let tokenID = TronWeb.address.fromHex(data.tokenID);
            if (!_.isNumber(tokenID)) return;
            console.log("new_order_trc10", data);
            let tokenConfig = config.dice.trc10_support[tokenID];
            if (tokenConfig == null || tokenConfig.enable !== true) return;
            loggerDefault.info("new order trc10", data.address, data.orderId, (data.state === 1 ? "CONFIRMED" : "PENDING"), tokenID, tokenConfig.name);
            gameDiceTrc10.handleOrder(data);
        }
    });

    //发送红包
    socket.on('new_redpacket', function (data) {
        loggerDefault.info(data);
    });

    //领取红包
    socket.on('receive_rain', async (data) => {
        // let packet_id = data.id;
        // let address = data.addr;
        // loggerDefault.info("rain receive", packet_id, address);
        // try {
        //     packet_id = Number(packet_id);
        // } catch (error) {
        //     return
        // }
        // if (_.isEmpty(address) || !TronWeb.isAddress(address)) {
        //     return;
        // }
        // let playerInfo = await redis.hgetall(PLAYER_INFO_MAP_KEY + address);
        // if (playerInfo == null || playerInfo.lv < RAIN_LV_LIMIT) {
        //     return socket.emit('chat_info', code.RAIN_LV_IS_TOO_LOW);
        // }
        // redpacketService.take(packet_id, address, (rain_list, rain_log) => {
        //     broadcast('rain_list', rain_list);
        //     // let msg = "yafet,yafet_sender,1TRX,1" //receiver,receiverName,sender,senderName,amount,index
        //     let msg = rain_log.receiver + "," + rain_log.receiverName + "," + rain_log.sender + "," + rain_log.senderName + "," + (rain_log.amount / 1e6).toFixed(2) + "TRX," + rain_log.index;
        //     let now = Math.floor(Date.now() / 1000);
        //     let type = "all"
        //     let chatInfo = createChatInfo("rain", "rain", 99, msg, "all", now);
        //     chatInfo.msgType = "rain_log";
        //     broadcast('chat_info', chatInfo);
        //     addToRedisQueue(LASTEST_CHAT_QUEUE_KEY + type, JSON.stringify(chatInfo), LASTEST_CHAT_QUEUE_CAP);
        // });
    });

    //聊天
    socket.on('chat', async (data) => {
        loggerDefault.info("event => chat", JSON.stringify(data));
        let address = data.addr;
        if (_.isEmpty(address) || !TronWeb.isAddress(address)) {
            return socket.emit('chat_info', code.ADDRESS_IS_EMPTY);
        }
        //blacklist
        if (await redis.hget("blacklist", address)) {
            return;
        }

        let _now = Date.now();
        let ts = await redis.hget("chat_cd", address);
        ts = Number(ts || 0);
        if (ts - _now > 30000) {
            return;
        } else {
            let _tmp = _now > ts ? _now : ts;
            _tmp = _tmp + 5000;
            await redis.hset("chat_cd", address, _tmp);
        }

        //verifyMessage
        if (data.addr != "TFXshAocC6ctfTYDdvtb3iK6jGcYVtcBLF" && _now > 1547463600000) {
            let signPass = await tronUtil.verifyMessage(data.addr, data.sign);
            // console.log("signpass",signPass);
            if (signPass == null || signPass === false) {
                return socket.emit('chat_info', code.MESSAGE_TYPE_ERROR);
            }
        }

        let msg = data.msg;

        if (!_.isString(msg)) {
            return socket.emit('chat_info', code.MESSAGE_TYPE_ERROR);
        }
        if (_.isEmpty(msg)) {
            return socket.emit('chat_info', code.MESSAGE_IS_EMPTY);
        }
        if (msg.length > 200) {
            return socket.emit('chat_info', code.MESSAGE_IS_TOO_LONG);
        }

        msg = banWord(msg);

        let type = data.type || 'all';
        if (_.filter(LAN_SUPPORT, function (lan) { return lan === type }) == null) {
            return socket.emit('chat_info', code.MESSAGE_TYPE_ERROR);
        }

        let now = parseInt(Date.now() / 1000);

        let manager_info = JSON.parse(await redis.hget("manager", address));
        //管理员
        if (manager_info != null) {
            let arr = msg.split('@@');
            if (arr.length != 2) {
                return;
            }
            let pwd = arr[1];
            if (pwd !== manager_info.pwd) {
                return;
            }
            msg = arr[0];
            let chatInfo = createChatInfo(manager_info.name, manager_info.name, 99, msg, type, now);

            chatInfo.img = manager_info.img || 10000;
            broadcast('chat_info', chatInfo);
            addToRedisQueue(LASTEST_CHAT_QUEUE_KEY + type, JSON.stringify(chatInfo), LASTEST_CHAT_QUEUE_CAP);
            return;
        }

        //普通玩家
        let playerInfo = await redis.hgetall(PLAYER_INFO_MAP_KEY + address);
        // loggerDefault.info("chat playerinfo", playerInfo);
        if (playerInfo == null || playerInfo.lv < CHAT_LV_LIMIT) {
            return socket.emit('chat_info', code.LV_IS_TOO_LOW);
        }

        let name = playerInfo.name;
        if (name === "Admin") name = address;
        let chatInfo = createChatInfo(address, playerInfo.name, playerInfo.lv, msg, type, now);
        chatInfo.img = playerInfo.img;

        // console.log("chat_info", chatInfo);
        broadcast('chat_info', chatInfo);
        addToRedisQueue(LASTEST_CHAT_QUEUE_KEY + type, JSON.stringify(chatInfo), LASTEST_CHAT_QUEUE_CAP);
    })

    //聊天
    socket.on('chatVi', async (_data) => {
        let data = {};
        try {
            data = JSON.parse(tronUtil.decrypt(_data));
        } catch (error) {
            return socket.emit('chat_info', code.MESSAGE_TYPE_ERROR);
        }
        loggerDefault.info("event => chat", JSON.stringify(data));

        let address = data.addr;
        if (_.isEmpty(address)) {
            return socket.emit('chat_info', code.ADDRESS_IS_EMPTY);
        }
        //blacklist
        if (await redis.hget("blacklist", address)) {
            return;
        }

        let _now = Date.now();
        let ts = await redis.hget("chat_cd", address);
        ts = Number(ts || 0);
        if (ts - _now > 30000) {
            return;
        } else {
            let _tmp = _now > ts ? _now : ts;
            _tmp = _tmp + 5000;
            await redis.hset("chat_cd", address, _tmp);
        }

        let msg = data.msg;

        let content = msg.content;
        if (!_.isString(content)) {
            return socket.emit('chat_info', code.MESSAGE_TYPE_ERROR);
        }
        if (_.isEmpty(content)) {
            return socket.emit('chat_info', code.MESSAGE_IS_EMPTY);
        }
        if (content.length > 200) {
            return socket.emit('chat_info', code.MESSAGE_IS_TOO_LONG);
        }

        content = banWord(content);

        let type = data.type || 'all';
        if (_.filter(LAN_SUPPORT, function (lan) { return lan === type }) == null) {
            return socket.emit('chat_info', code.MESSAGE_TYPE_ERROR);
        }

        let now = parseInt(Date.now() / 1000);

        if (msg.lv < CHAT_LV_LIMIT) {
            return socket.emit('chat_info', code.LV_IS_TOO_LOW);
        }

        let chatInfo = createChatInfo(address, msg.name, msg.lv, content, type, now);
        chatInfo.img = msg.img;

        console.log("chat_info", chatInfo);
        broadcast('chat_info', chatInfo);
        addToRedisQueue(LASTEST_CHAT_QUEUE_KEY + type, JSON.stringify(chatInfo), LASTEST_CHAT_QUEUE_CAP);
    })

    //登陆
    socket.on('login', async (data) => {
        let _now = _.now();
        if (!_.isEmpty(data.addr)) {
            // loggerDefault.info("event => login", data);
        }
        let address = data.addr;
        if (!_.isEmpty(address) && TronWeb.isAddress(address)) {
            let socket_id = socket.id;
            Map_addr_socket[address] = socket.id;
            Map_socket_addr[socket_id] = address;
            // console.log("player " + address + " come back! socket id = " + socket_id);
            // let _socket = _.findLast(io.sockets.sockets, { id: socket_id });
            // if(!_.isEmpty(_socket)){
            //     console.log("socket is very good!!!");
            //     console.log(_socket);
            // }
        } else {
            address = "";
        }

        let ret = {
            // WEEKLY_RANK : WEEKLY_RANK, TODO
            // RAIN_LIST: await redpacketService.getRainList(),
            RAIN_LIST: [],
            LASTEST_BETS_QUEUE: _.sortBy(appData.getLastestBets(), (item) => { return - item.ts }),
            HIGH_ROLLERS_QUEUE: _.sortBy(appData.getHighRollers(), (item) => { return - item.ts }),
            RARE_WINS_QUEUE: _.sortBy(appData.getRareWins(), (item) => { return - item.ts }),
            TOP_BET_RANK: appData.getTopBetRank(),
            APP_INFO: { BETS_MADE: appData.getBetsMade(), TOTAL_WON: appData.getTotalWon() },
            MENTOR_INFO: await modelLogDice.getMentorInfo(address)
        }

        for (let lan of LAN_SUPPORT) {
            ret[LASTEST_CHAT_QUEUE_KEY + lan] = await getRedisQueue(LASTEST_CHAT_QUEUE_KEY + lan, LASTEST_CHAT_QUEUE_CAP);
        }
        if (!_.isEmpty(address) && TronWeb.isAddress(address)) { //为合法的Tron地址
            //查询玩家名称
            let playerInfo = await appData.getPlayerInfo(address);
            if (playerInfo != null) {
                if (_now - (playerInfo.ts || 0) >= RESET_PLAYER_DATA_INTERVAL) { //登陆时间 - 最后操作时间 > RESET_PLAYER_DATA_INTERVAL,则更新玩家数据
                    playerInfo = await appData.initPlayerInfo(address);
                }
            } else {
                playerInfo = await appData.initPlayerInfo(address);
            }

            if (playerInfo != null) {
                let name = playerInfo.name || "";
                if (_.isEmpty(name)) { //玩家名称为空，则尝试获取玩家名称
                    gameCenter.getAccount(address, (err, res) => {
                        if (err) return;
                        if (res == null) return;
                        // let balance = res.balance;
                        // loggerDefault.info("balance",balance);
                        name = res.account_name || '';
                        // loggerDefault.info("account_name", address, name);
                        if (!_.isEmpty(name)) {
                            appData.updateName(address, name);
                        }
                    });
                }
            }
            //获取玩家最近下注记录
            let MY_BETS = [];
            let logs = await redis.hgetall("player:logs:" + address);
            logs = _.sortBy(logs, function (item) {
                return -item.orderId;
            });
            for (let orderId in logs) {
                let log = JSON.parse(logs[orderId]);
                if (log.bettor != null && log.roll != null) {
                    delete log.random;
                    MY_BETS.push(log);
                }
            }
            ret.MY_BETS = MY_BETS;
        }

        let player_info = await redis.hgetall(PLAYER_INFO_MAP_KEY + address);
        // console.log("player_info",player_info);
        if (player_info == null || _.isEmpty(player_info)) {
            ret.img = 10000;
            ret.lv = 1;
        } else {
            ret.img = player_info.img || 10000;
            ret.lv = player_info.lv || 1
        }
        socket.emit('login_info', ret);

        //补偿订单
        if (!_.isEmpty(address)) {
            gameDice.getOrder(address, null, (err, result) => {
                if (err) {
                    console.error(err);
                    return
                }
                if (result && result.roll === 255) {
                    loggerDefault.warn("!!!补偿订单", result.bettor, result.orderid, result.roll);
                    gameDice.handleOrder({ address: result.bettor, orderId: result.orderid, state: 1 })
                } else {
                    // loggerDefault.info("不用补偿订单", result.bettor, result.orderid, result.roll);
                }
            });

            gameDiceTrc20.getOrder(address, null, (err, result) => {
                if (err) {
                    console.error(err);
                    return
                }
                if (result && result.roll === 255) {
                    loggerDefault.warn("!!!补偿trc20订单", result.bettor, result.orderid, result.roll);
                    gameDiceTrc20.handleOrder({ address: result.bettor, orderId: result.orderid, state: 1 })
                } else {
                    // loggerDefault.info("不用补偿订单", result.bettor, result.orderid, result.roll);
                }
            });

            gameDiceTrc10.getOrder(address, null, (err, result) => {
                if (err) {
                    console.error(err);
                    return
                }
                if (result && result.roll === 255) {
                    loggerDefault.warn("!!!补偿trc10订单", result.bettor, result.orderid, result.roll);
                    gameDiceTrc10.handleOrder({ address: result.bettor, orderId: result.orderid, state: 1 })
                } else {
                    // loggerDefault.info("不用补偿订单", result.bettor, result.orderid, result.roll);
                }
            });
        }
    });

    socket.on('get_dice_log', async (data) => {
        // console.log("get_dice_log", data);
        let { address, tokenType } = data;
        if (_.isEmpty(address) || !TronWeb.isAddress(address)) return;
        //获取玩家最近下注记录
        // console.log("get_dice_log", address);
        let ret = {};
        let MY_BETS = [];
        let logs = [];
        if (tokenType === "trc20") {
            logs = await redis.hgetall("player:logs:trc20:" + address);
        } else if (tokenType === "trc10") {
            logs = await redis.hgetall("player:logs:erc10:" + address);
        } else {
            tokenType = "trx";
            logs = await redis.hgetall("player:logs:" + address);
        }
        logs = _.sortBy(logs, function (item) {
            return -item.orderId;
        });
        for (let orderId in logs) {
            let log = JSON.parse(logs[orderId]);
            if (log.bettor != null && log.roll != null) {
                delete log.random;
                MY_BETS.push(log);
            }
        }
        ret.MY_BETS = MY_BETS;
        ret.tokenType = tokenType;
        socket.emit('dice_logs', ret);
    });

    socket.on('get_trc10_Logs', async (data) => {
        let address = data.addr;
        if (_.isEmpty(address) || !TronWeb.isAddress(address)) return;
        //获取玩家最近下注记录
        console.log("get_trc10_Logs", address);
        let ret = {};
        let MY_BETS = [];
        let logs = await redis.hgetall("player:logs:erc10:" + address);
        logs = _.sortBy(logs, function (item) {
            return -item.orderId;
        });
        for (let orderId in logs) {
            let log = JSON.parse(logs[orderId]);
            if (log.bettor != null && log.roll != null) {
                delete log.random;
                MY_BETS.push(log);
            }
        }
        ret.MY_BETS = MY_BETS;
        socket.emit('trc10_logs', ret);
    });

    //查询任务详情
    socket.on('get_tasks', async (data) => {
        // console.log("get_tasks --------->", data.addr);
        returnTaskInfo(data.addr);
    });

    //领取任务奖励
    socket.on('receive_task_award', async (data) => {
        let addr = data.addr;
        let task_id = Number(data.id);
        // console.log("receive_task_award --------->", addr, task_id, TronWeb.isAddress(data.addr), _.isNumber(task_id));
        if (!TronWeb.isAddress(addr) || !_.isNumber(task_id) || _.isNaN(task_id)) return;
        let isOK = true;
        // console.log("receive_task_award --------->", addr, task_id);
        gameDice.taskAward(addr, task_id);
        socket.emit('task_op_ret', { addr: addr, id: task_id, ret: isOK })
        // returnTaskInfo(addr);
    });

    socket.on('set_img', async (data) => {
        if (data == null) return;
        let addr = data.addr;
        let sign = data.sign;
        let img = data.img;
        if (img == null || !_.isNumber(img)) return;
        //### TODO:
        if (_.isEmpty(sign)) return;
        let signPass = await tronUtil.verifyMessage(addr, sign);
        if (signPass == null || signPass === false) return socket.emit('set_img_ret', { result: false });
        //### TODO:
        appData.updateImg(addr, img);
        return socket.emit('set_img_ret', { img: img });
    })
});

function banWord(msg) {
    let x = msg.toLocaleLowerCase();
    let idx = x.indexOf('vegas');
    if (idx > 0) {
        let res = "";
        let arr = x.split('vegas');
        for (let i = 0; i < arr.length; i++) {
            if (i < arr.length - 1) {
                res = res + arr[i] + "***";
            } else {
                res = res + arr[i];
            }
        }
        return res;
    } else {
        return msg;
    }
}

let ts_app_info = 0;
diceEvent.on('bet_info', onDiceResult);
diceTrc20Event.on('bet_info', onDiceResult);
diceTrc10Event.on('bet_info', onDiceResult);

async function onDiceResult(completeDiceLog, appInfo) {
    delete completeDiceLog.random;
    // //单独返还结果至玩家
    // let socket_id = Map_addr_socket[completeDiceLog.bettor];
    // if (!_.isEmpty(socket_id)) {
    //     let socket = _.findLast(io.sockets.sockets, { id: socket_id });
    //     if (socket != null) socket.emit('bet_info', completeDiceLog);
    // }

    // //广播结果(节流)
    // if (completeDiceLog.isHighRoller === true || completeDiceLog.isRareWins === true) {
    broadcast('bet_info', completeDiceLog);
    // } else {
    //     _.delay(gogogo, _.random(1, 999), completeDiceLog);
    // }

    //广播统计(节流)
    let _now = _.now();
    if (_now - ts_app_info > 9999) {
        ts_app_info = _now;
        broadcast('app_info', appInfo);
    }

    //保存记录
    appData.appendToArray(appData.getLastestBets(), completeDiceLog, LASTEST_BETS_QUEUE_CAP); //全员记录
    if (completeDiceLog.isHighRoller === true) appData.appendToArray(appData.getHighRollers(), completeDiceLog, HIGH_ROLLERS_QUEUE_CAP); //高赔付记录
    if (completeDiceLog.isRareWins === true) appData.appendToArray(appData.getRareWins(), completeDiceLog, RARE_WINS_QUEUE_CAP); //险胜记录
    // console.log("appData.getLastestBets()",appData.getLastestBets());
}

let ts_bet_info = 0;
function gogogo(msg) {
    let _now = _.now();
    // if (_now - ts_bet_info > 96) {
    ts_bet_info = _now;
    broadcast('bet_info', msg);
    // } else {
    //     // console.log("igrone msg",msg);
    // }
}

diceEvent.on("activity_info", onActivity);
async function onActivity(msg) {
    // let socket_id = Map_addr_socket[msg.addr];
    // if (!_.isEmpty(socket_id)) {
    //     let socket = _.findLast(io.sockets.sockets, { id: socket_id });
    //     if (!_.isEmpty(socket)) {
    //         socket.emit('activity_info', msg);
    //     }
    // }

    SendMsgToPlayer(msg.addr, "activity_info", msg);
}

appDataEvent.on('top_bet_rank_changed', () => {
    broadcast('rank_info', { rank_type: "TOP_BET", data: appData.getTopBetRank() });
})

////////basice fun /////////////////
function broadcast(method, data) {
    io.emit(method.toString(), data);
}

async function returnTaskInfo(addr) {
    if (!TronWeb.isAddress(addr)) return;
    let socket_id = Map_addr_socket[addr];
    if (_.isEmpty(socket_id)) return;
    let socket = _.findLast(io.sockets.sockets, { id: socket_id });
    if (_.isEmpty(socket)) return;
    let iTaskes = [];

    let tasks_config = config.task.tasks_config;
    // let top_task_id = config.task.top_task_id;
    for (let _id in tasks_config) {
        let cfg = tasks_config[_id];
        let task_round = Number(await redis.hget("app:info", "task_round"));
        let _now = Number(await redis.hget('task:' + addr + ":" + task_round, _id + "_now"));
        if (_now > cfg.need) _now = cfg.need;
        // console.log("_now",_now);
        let _status = Number(await redis.hget('task:' + addr + ":" + task_round, _id + "_status") || 1);
        // console.log("_status",_status);
        let _trx = cfg.trx;
        if (_.isObject(_trx)) {
            let _lv = Number(await redis.hget(PLAYER_INFO_MAP_KEY + addr, "lv"));
            let _award = 0;
            for (let lv in _trx) {
                if (_lv < lv) {
                    break;
                } else {
                    _award = _trx[lv];
                }
            }
            iTaskes.push({ id: _id, need: cfg.need, now: _now, amount: _award, status: _status })
        } else {
            iTaskes.push({ id: _id, need: cfg.need, now: _now, amount: _trx, status: _status })
        }
    }

    // console.log("return_tasks -------->", iTaskes);
    socket.emit('return_tasks', iTaskes);
}

function addToRedisQueue(key, obj, cap) {
    redis.lpush(key, obj, (err, result) => {
        if (err) return;
        redis.ltrim(key, 0, cap - 1);
    });
}

function getRedisQueue(key, cap) {
    return new Promise((resolve, reject) => {
        redis.lrange(key, 0, cap - 1, (err, ret) => {
            if (err) reject(err);
            let data = []
            for (let i = 0; i < ret.length; i++) {
                data.push(JSON.parse(ret[i]));
            }
            resolve(data);
        });
    })
}

//订阅Redis消息
function subscribe() {
    const redisObserver = require('ioredis').createClient(
        {
            host: config.redisConfig.host,
            port: config.redisConfig.port,
            password: config.redisConfig.pwd,
            db: config.redisConfig.db
        }
    );

    redisObserver.subscribe('from_task_app', (err, res) => {
        if (err) {
            loggerError.error(err);
            loggerDefault.info("订阅频道 [from_task_app] 失败");
            process.exit(0);
        }
        loggerDefault.info("订阅频道 [from_task_app] 成功");
    });

    redisObserver.on('message', (channel, message) => {
        loggerDefault.info("channel:" + channel, message);
        message = JSON.parse(message);
        switch (message.event_type) {
            case "task_state_changed":
                SendMsgToPlayer(message.addr, "task_state_changed", message);
                break;
            case "task_reset":
                broadcast('task_reset', { round: message.round || 1 });
                break;
        }
    });

    redisObserver.on('error', (error) => {
        loggerError.error(error);
        loggerDefault.info("无法连接Redis!!!");
        process.exit(0);
    });
}

async function SendMsgToPlayer(addr, eventName, msg) {
    console.log("addr, eventName, msg", addr, eventName, msg);
    if (_.isEmpty(addr) || _.isEmpty(eventName) || _.isEmpty(msg)) return;
    let socket_id = Map_addr_socket[addr];
    console.log("socket_id", socket_id);
    if (!_.isEmpty(socket_id)) {
        let socket = _.findLast(io.sockets.sockets, { id: socket_id });
        if (!_.isEmpty(socket)) {
            console.log("SendMsgToPlayer success");
            socket.emit(eventName, msg);
        }
    }
}