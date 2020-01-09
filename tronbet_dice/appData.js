
const _ = require('lodash')._;
const modelLogDice = require('./src/models/modelLogDice');
const getLv = require('./src/data/exp').getLv;
const parseDataService = require('./src/service/parseDataService');
const createBetLogInfo = parseDataService.createBetLogInfo;

const config = require('./src/configs/config');
const LASTEST_BETS_QUEUE_CAP = config.dice.LASTEST_BETS_QUEUE_CAP;
const HIGH_ROLLERS_QUEUE_CAP = config.dice.HIGH_ROLLERS_QUEUE_CAP;
const RARE_WINS_QUEUE_CAP = config.dice.RARE_WINS_QUEUE_CAP;
const TOP_BET_RANK_CAP = config.dice.TOP_BET_RANK_CAP;
const HIGH_ROLLER_LIMIT = config.dice.HIGH_ROLLER_LIMIT;
const PLAYER_EXPIRE = config.dice.PLAYER_EXPIRE;
const MANAGER_LIST = config.dice.MANAGER_LIST;
const MY_LOGS_CAP = config.dice.MY_LOGS_CAP;

const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('default');
const loggerError = log4js.getLogger('error');

const events = require('events');
const appEvent = new events.EventEmitter();

//from db
let TOP_BET_RANK = [];//投注总额排行榜
let DIALY_BET_RANK = [];//投注日排行榜
let WEEKLY_BET_RANK = [];//投注日排行榜
let ACTIVITY_BET_RANK = [];//投注活动排行榜
let LASTEST_BETS_QUEUE = [];//最近投注记录
let HIGH_ROLLERS_QUEUE = [];//高赔付记录
let RARE_WINS_QUEUE = [];//险胜记录
let BETS_MADE = 0;//下注从次数
let TOTAL_WON = 0;//总赔付
let TOTAL_BET = 0;//总投注
let ALL_PLAYERS_INFO = {};

const redis = require("ioredis").createClient(
    {
        host: config.redisConfig.host,
        port: config.redisConfig.port,
        password: config.redisConfig.pwd,
        db: config.redisConfig.db
    }
);

async function initPlayerInfo(addr) { //登陆时初始化
    let data = await modelLogDice.loadPlayerData(addr);
    if (data == null) {
        data = {
            total: 0,
            name: '',
        }
    };
    let total = Math.floor(data.total / 1e6);
    let name = data.name;
    let img = data.img || 10000;
    if (_.isEmpty(name)) {
        name = await redis.hget("player:info:" + addr, 'name');
    }
    let player_info = {
        addr: addr,//玩家Tron地址
        total: total, //多游戏合计投注总额
        lv: getLv(total), //投注总额计算成等级
        ts: _.now(), //最后操作时间戳 (游戏下注/登陆成功)
        name: name, //玩家Tron用户名
        img: img
    }
    // loggerDefault.info("my info", player_info);

    await redis.del("player:info:" + addr);
    for (let k in player_info) {
        await redis.hset("player:info:" + addr, k, player_info[k]);
    }

    // await redis.expire("player:info:" + addr, PLAYER_EXPIRE);

    // await redis.del("player:logs:" + addr);
    // let logs = await modelLogDice.getPlayerLogs(addr, MY_LOGS_CAP);
    // for (let log of logs) {
    //     let order_id = log.order_id;
    //     let betInfo = createBetLogInfo(order_id, log.addr, name, log.direction, log.number, log.roll,
    //         log.amount_sun / 1e6, log.payout_sun / 1e6);
    //     betInfo.order_state = 2; //!!!重要
    //     betInfo.tx = log.tx_id;
    //     await redis.hset("player:logs:" + addr, order_id, JSON.stringify(betInfo));
    // }
    // await redis.expire("player:logs:" + addr, PLAYER_EXPIRE);

    return player_info;
}

async function getPlayerInfo(addr) {
    let player_info = await redis.hgetall("player:info:" + addr);
    return player_info;
}

async function init() {
    let info_list = await modelLogDice.getAllPlayersAddress();
    let players_count = 0;
    for (let info of info_list) {
        players_count = players_count + 1;
        ALL_PLAYERS_INFO[info.addr] = { addr: info.addr, name: info.name };
    }
    loggerDefault.info("PLAYERS_COUNT", players_count);

    let sInfo = await modelLogDice.getStatisticsInfo();
    if (sInfo == null) {
        BETS_MADE = 0;
        TOTAL_WON = 0;
    } else {
        BETS_MADE = sInfo.all_play_times ? sInfo.all_play_times : 0;
        TOTAL_WON = Math.floor(sInfo.all_payout_sun / 1e6);
    }
    await redis.hset('app:info', 'count', BETS_MADE);
    await redis.hset('app:info', 'total', TOTAL_WON);
    loggerDefault.info("BETS_MADE", BETS_MADE, "TOTAL_WON", TOTAL_WON);

    let logs_TOP_BET_RANK = await modelLogDice.getPlayerRank(TOP_BET_RANK_CAP);
    for (let log of logs_TOP_BET_RANK) {
        let addr = log.addr;
        let val = Math.floor(log.total / 1e6);
        let lv = getLv(val);
        let name = ALL_PLAYERS_INFO[addr] == null ? "" : (ALL_PLAYERS_INFO[addr].name || "");
        let img = log.img || 10000;
        TOP_BET_RANK.push({ addr, name, val, lv, type: 'TOP_BET', img });
    }
    loggerDefault.info("TOP_BET_RANK", TOP_BET_RANK.length);

    let logs_LASTEST_BETS_QUEUE_DB = await modelLogDice.getAllLogs(LASTEST_BETS_QUEUE_CAP);
    for (let log of logs_LASTEST_BETS_QUEUE_DB) {
        let order_id = log.order_id;
        let addr = log.addr;
        let name = ALL_PLAYERS_INFO[addr] == null ? "" : (ALL_PLAYERS_INFO[addr].name || "");
        let betInfo = createBetLogInfo(order_id, addr, name, log.direction, log.number, log.roll,
            log.amount_sun / 1e6, log.payout_sun / 1e6);
        LASTEST_BETS_QUEUE.push(betInfo);
    }
    loggerDefault.info("LASTEST_BETS_QUEUE", LASTEST_BETS_QUEUE.length);

    let logs_HIGH_ROLLERS_QUEUE = await modelLogDice.getHighRollerLogs(HIGH_ROLLER_LIMIT * 1e6, HIGH_ROLLERS_QUEUE_CAP);
    for (let log of logs_HIGH_ROLLERS_QUEUE) {
        let order_id = log.order_id;
        let addr = log.addr;
        let name = ALL_PLAYERS_INFO[addr] == null ? "" : (ALL_PLAYERS_INFO[addr].name || "");
        let betInfo = createBetLogInfo(order_id, addr, name, log.direction, log.number, log.roll,
            log.amount_sun / 1e6, log.payout_sun / 1e6);
        HIGH_ROLLERS_QUEUE.push(betInfo);
    }
    loggerDefault.info("HIGH_ROLLERS_QUEUE", HIGH_ROLLERS_QUEUE.length);

    let logs_RARE_WINS_QUEUE = await modelLogDice.getRareWinsLogs(RARE_WINS_QUEUE_CAP);
    for (let log of logs_RARE_WINS_QUEUE) {
        let order_id = log.order_id;
        let addr = log.addr;
        let name = ALL_PLAYERS_INFO[addr] == null ? "" : (ALL_PLAYERS_INFO[addr].name || "");
        let betInfo = createBetLogInfo(order_id, addr, name, log.direction, log.number, log.roll,
            log.amount_sun / 1e6, log.payout_sun / 1e6);
        RARE_WINS_QUEUE.push(betInfo);
    }
    loggerDefault.info("RARE_WINS_QUEUE", RARE_WINS_QUEUE.length);

    for (let manager of MANAGER_LIST) {
        redis.hset('manager', manager.addr, JSON.stringify(manager));
    }
}

setInterval(async () => {
    let logs_TOP_BET_RANK = await modelLogDice.getPlayerRank(TOP_BET_RANK_CAP);
    TOP_BET_RANK = [];
    for (let log of logs_TOP_BET_RANK) {
        let addr = log.addr;
        let val = Math.floor(log.total / 1e6);
        let lv = getLv(val);
        let name = ALL_PLAYERS_INFO[addr] == null ? "" : (ALL_PLAYERS_INFO[addr].name || "");
        let img = log.img || 10000;
        TOP_BET_RANK.push({ addr, name, val, lv, type: 'TOP_BET', img });
    }
    //** 总统计数据仅在初始化时从db加载 */
    // let sInfo = await modelLogDice.getStatisticsInfo();
    // BETS_MADE = sInfo.all_play_times;
    // TOTAL_WON = Math.floor(sInfo.all_payout_sun/1e6);
    //** 总统计数据仅在初始化时从db加载 */
    appEvent.emit('top_bet_rank_changed');
}, 60000)

module.exports.init = init;
module.exports.appEvent = appEvent;
module.exports.initPlayerInfo = initPlayerInfo;
module.exports.getPlayerInfo = getPlayerInfo;
module.exports.getTopBetRank = () => { return TOP_BET_RANK; };
module.exports.getDialyBetRank = () => { return DIALY_BET_RANK; };
module.exports.getWeeklyBetRank = () => { return WEEKLY_BET_RANK; };
module.exports.getActivityBetRank = () => { return ACTIVITY_BET_RANK; };
module.exports.getLastestBets = () => { return LASTEST_BETS_QUEUE; };
module.exports.getHighRollers = () => { return HIGH_ROLLERS_QUEUE; };
module.exports.getRareWins = () => { return RARE_WINS_QUEUE; };
module.exports.getBetsMade = () => { return BETS_MADE; };
module.exports.getTotalWon = () => { return TOTAL_WON; };
module.exports.getTotalBet = () => { return TOTAL_BET; };
module.exports.appendToArray = appendToArray;
module.exports.updateName = updateName;
module.exports.updateImg = updateImg;

function appendToArray(_queue, _data, _cap) {
    if (!_.isArray(_queue)) {
        return
    }
    _queue.push(_data);
    let length = _queue.length;
    if (length <= _cap) {
        return
    }
    return _queue.splice(0, 1);
}

async function updateName(addr, name) {
    if (_.isEmpty(addr) || _.isEmpty(name)) return;
    let player_info = ALL_PLAYERS_INFO[addr];
    if (player_info != null) {
        player_info.name = name;
    }
    redis.hset("player:info:" + addr, 'name', name);
    await modelLogDice.updateName(addr, name);
}

async function updateImg(addr, img) {
    if (_.isEmpty(addr) || img == null || !_.isNumber(img)) return;
    let player_info = ALL_PLAYERS_INFO[addr];
    if (player_info != null) {
        player_info.img = img;
    }
    redis.hset("player:info:" + addr, 'img', img);
    await modelLogDice.updateImg(addr, img);
}

//每日12点获取当前所有玩家下注总额进行快照
//每分钟再获取当前所有玩家下注总额与快照点总额比较得到增量值记入数据库
//进行排行榜排序
//周排行榜/活动排行榜以每日排行榜数据集统计值进行排序计算