//牌桌最大人数枚举
const TABLE_TYPE = [2, 3, 6, 9];

//大盲注级别枚举(BB)
const BIGBLIND_TYPE = [4e6, 10e6, 20e6, 80e6, 300e6];
//最小买入金额枚举(40BB)
const MIN_BUYIN = [160e6, 400e6, 800e6, 3200e6, 12000e6];
//最大买入金额枚举(100BB)
const MAX_BUYIN = [400e6, 1000e6, 2000e6, 8000e6, 30000e6];
//最小抽成数
const MIN_FEE = 1e6;

//全部扑克牌
const ALL_POKERS = [
    { style: 's', point: 14 }, { style: 's', point: 2 }, { style: 's', point: 3 }, { style: 's', point: 4 }, { style: 's', point: 5 }, { style: 's', point: 6 }, { style: 's', point: 7 }, { style: 's', point: 8 }, { style: 's', point: 9 }, { style: 's', point: 10 }, { style: 's', point: 11 }, { style: 's', point: 12 }, { style: 's', point: 13 },
    { style: 'h', point: 14 }, { style: 'h', point: 2 }, { style: 'h', point: 3 }, { style: 'h', point: 4 }, { style: 'h', point: 5 }, { style: 'h', point: 6 }, { style: 'h', point: 7 }, { style: 'h', point: 8 }, { style: 'h', point: 9 }, { style: 'h', point: 10 }, { style: 'h', point: 11 }, { style: 'h', point: 12 }, { style: 'h', point: 13 },
    { style: 'c', point: 14 }, { style: 'c', point: 2 }, { style: 'c', point: 3 }, { style: 'c', point: 4 }, { style: 'c', point: 5 }, { style: 'c', point: 6 }, { style: 'c', point: 7 }, { style: 'c', point: 8 }, { style: 'c', point: 9 }, { style: 'c', point: 10 }, { style: 'c', point: 11 }, { style: 'c', point: 12 }, { style: 'c', point: 13 },
    { style: 'd', point: 14 }, { style: 'd', point: 2 }, { style: 'd', point: 3 }, { style: 'd', point: 4 }, { style: 'd', point: 5 }, { style: 'd', point: 6 }, { style: 'd', point: 7 }, { style: 'd', point: 8 }, { style: 'd', point: 9 }, { style: 'd', point: 10 }, { style: 'd', point: 11 }, { style: 'd', point: 12 }, { style: 'd', point: 13 },
]

//TODO:cancel => 指定洗好的牌（只能2人
const FAKE_ALL_POKERS = [[ // A金刚 VS K金刚
    { style: 's', point: 14 }, { style: 's', point: 13 },
    { style: 'h', point: 14 }, { style: 'h', point: 13 },
    { style: 's', point: 5 }, { style: 'c', point: 14 }, { style: 'c', point: 13 }, { style: 'c', point: 12 },
    { style: 'h', point: 5 }, { style: 'd', point: 14 },
    { style: 'd', point: 5 }, { style: 'd', point: 13 },
], [ // 2金刚 VS 3金刚
    { style: 's', point: 2 }, { style: 's', point: 3 },
    { style: 'h', point: 2 }, { style: 'h', point: 3 },
    { style: 's', point: 5 }, { style: 'd', point: 14 }, { style: 'c', point: 2 }, { style: 'c', point: 3 },
    { style: 'h', point: 5 }, { style: 'd', point: 2 },
    { style: 'd', point: 5 }, { style: 'd', point: 3 },
], [ // A金刚 VS 同花顺
    { style: 's', point: 14 }, { style: 'c', point: 11 },
    { style: 'h', point: 14 }, { style: 'c', point: 10 },
    { style: 's', point: 5 }, { style: 'c', point: 14 }, { style: 'c', point: 13 }, { style: 'c', point: 12 },
    { style: 'h', point: 5 }, { style: 'd', point: 14 },
    { style: 'd', point: 5 }, { style: 'd', point: 2 },
], [ // 皇家同花顺 VS 皇家同花顺
    { style: 's', point: 14 }, { style: 's', point: 9 },
    { style: 's', point: 13 }, { style: 's', point: 8 },
    { style: 's', point: 5 }, { style: 's', point: 12 }, { style: 's', point: 11 }, { style: 's', point: 10 },
    { style: 'h', point: 5 }, { style: 'h', point: 14 },
    { style: 'd', point: 5 }, { style: 'c', point: 14 },
], [ // 同花顺 VS 顺子
    { style: 'c', point: 9 }, { style: 's', point: 14 },
    { style: 'c', point: 8 }, { style: 'h', point: 13 },
    { style: 's', point: 5 }, { style: 'c', point: 12 }, { style: 'c', point: 11 }, { style: 'c', point: 10 },
    { style: 'h', point: 5 }, { style: 'c', point: 14 },
    { style: 'd', point: 5 }, { style: 'd', point: 13 },
]
]
//玩家位置
const POSITION_NAME = {
    2: ["SB", "BB"],
    3: ["SB", "BB", "BTN"],
    4: ["SB", "BB", "UTG", "BTN"],
    5: ["SB", "BB", "UTG", "CO", "BTN"],
    6: ["SB", "BB", "UTG", "HJ", "CO", "BTN"],
    7: ["SB", "BB", "UTG", "MP", "HJ", "CO", "BTN"],
    8: ["SB", "BB", "UTG", "UTG+1", "MP", "HJ", "CO", "BTN"],
    9: ["SB", "BB", "UTG", "UTG+1", "MP1", "MP2", "HJ", "CO", "BTN"],
}

//牌型枚举
const CARDS_TYPE = {
    ROYAL_FLUSH: 10, //皇家同花顺
    STRAIGHT_FLUSH: 9, //同花顺
    FOUR_OF_A_KIND: 8, //金刚
    FULL_HOUSE: 7, //葫芦
    FLUSH: 6, //同花
    STRAIGHT: 5, //顺子
    THREE_OF_A_KIND: 4, //三条
    TWO_PAIRS: 3, //两对
    ONE_PAIR: 2, //一对
    HIGH_CARD: 1, //高牌
    FOLD_OR_MUCK: 0, //弃牌/盖牌
}

//牌型名称
function CARDS_TYPE_TOSTRING(val) {
    switch (val) {
        case CARDS_TYPE.ROYAL_FLUSH:
            return { en: "ROYAL_FLUSH", zh: "皇家同花顺" };
        case CARDS_TYPE.STRAIGHT_FLUSH:
            return { en: "STRAIGHT_FLUSH", zh: "同花顺" };
        case CARDS_TYPE.FOUR_OF_A_KIND:
            return { en: "FOUR_OF_A_KIND", zh: "金刚" };
        case CARDS_TYPE.FULL_HOUSE:
            return { en: "FULL_HOUSE", zh: "葫芦" };
        case CARDS_TYPE.FLUSH:
            return { en: "FLUSH", zh: "同花" };
        case CARDS_TYPE.STRAIGHT:
            return { en: "STRAIGHT", zh: "顺子" };
        case CARDS_TYPE.THREE_OF_A_KIND:
            return { en: "THREE_OF_A_KIND", zh: "三条" };
        case CARDS_TYPE.TWO_PAIRS:
            return { en: "TWO_PAIRS", zh: "两对" };
        case CARDS_TYPE.ONE_PAIR:
            return { en: "ONE_PAIR", zh: "一对" };
        case CARDS_TYPE.HIGH_CARD:
            return { en: "HIGH_CARD", zh: "高牌" };
        case CARDS_TYPE.FOLD_OR_MUCK:
            return { en: "FOLD_OR_MUCK", zh: "弃牌/盖牌" };
        default:
            return { en: "FOLD_OR_MUCK", zh: "弃牌/盖牌" };
    }
}

//扑克花色名称
function CARD_STYLE_TOSTRING(style) {
    switch (style) {
        case 's':
            return '黑桃';
        case 'h':
            return '红桃';
        case 'c':
            return '梅花';
        case 'd':
            return '方片';
    }
}

//座位状态枚举
const SEAT_STATE = {
    EMPTY: 0, //空座位
    BUYIN_CONFIRM: 1, //买入确认中
    WAITING: 2, //等待上桌
    PLAYING: 3, //游戏中
    SITTING_OUT: 4, //从正在游戏变为即将站起
    COMING_BACK: 5, //从已站起变为即将回桌
    LEFT: 6, //已站起
    EXIT_ASAP: 7 //尽快退桌
}

//座位状态名称
function SEAT_STATE_TOSTRING(val) {
    switch (val) {
        case SEAT_STATE.EMPTY:
            return { en: "EMPTY", zh: "空座位" };
        case SEAT_STATE.BUYIN_CONFIRM:
            return { en: "BUYIN_CONFIRM", zh: "买入确认中" };
        case SEAT_STATE.WAITING:
            return { en: "WAITING", zh: "等待上桌" };
        case SEAT_STATE.PLAYING:
            return { en: "PLAYING", zh: "游戏中" };
        case SEAT_STATE.SITTING_OUT:
            return { en: "SITTING_OUT", zh: "即将站起" };
        case SEAT_STATE.COMING_BACK:
            return { en: "COMING_BACK", zh: "即将回桌" };
        case SEAT_STATE.LEFT:
            return { en: "LEFT", zh: "已站起" };
        case SEAT_STATE.EXIT_ASAP:
            return { en: "EXIT_ASAP", zh: "尽快退桌" };
    }
}

//牌桌状态枚举
const TABLE_STATE = {
    WAITING: 100, //等待开始
    PAUSE: 199, //暂停中
    PLAYING: 200, //游戏中
    CLEARING: 300, //结算中
    STOP: 400, //已结束
    // RESETCD: 500, //重置冷却中
    // MERGING: 600, //MTT合并牌桌中
}

//牌桌状态名称
function TABLE_STATE_TOSTRING(val) {
    switch (val) {
        case TABLE_STATE.WAITING:
            return { en: "WAITING", zh: "等待开始" };
        case TABLE_STATE.PAUSE:
            return { en: "PAUSE", zh: "暂停中" };
        case TABLE_STATE.PLAYING:
            return { en: "PLAYING", zh: "游戏中" };
        case TABLE_STATE.CLEARING:
            return { en: "CLEARING", zh: "结算中" };
        case TABLE_STATE.STOP:
            return { en: "STOP", zh: "已结束" };
    }
}

//发牌圈枚举
const ROUND_TYPE = {
    INIT: 0, //前注圈
    PRE_FLOP: 1, //翻前圈
    FLOP: 2, //翻牌圈
    TURN: 3, //转牌圈
    RIVER: 4, //河牌圈
    SHOWDOWN: 5 //摊牌圈
}

//发牌圈名称
function ROUND_TYPE_TOSTRING(val) {
    switch (val) {
        case ROUND_TYPE.INIT:
            return { en: "INIT", zh: "前注圈" };
        case ROUND_TYPE.PRE_FLOP:
            return { en: "PRE_FLOP", zh: "翻前圈" };
        case ROUND_TYPE.FLOP:
            return { en: "FLOP", zh: "翻牌圈" };
        case ROUND_TYPE.TURN:
            return { en: "TURN", zh: "转牌圈" };
        case ROUND_TYPE.RIVER:
            return { en: "RIVER", zh: "河牌圈" };
        case ROUND_TYPE.SHOWDOWN:
            return { en: "SHOWDOWN", zh: "摊牌圈" };
    }
}

//玩家状态枚举
const PLAYER_STATE = {
    // WATCHING: 0, //旁观
    // PREPARING: 1, //准备中
    // CONFIRMING: 2, //买入确认中
    // WAITING: 3, //等待上桌
    // PLAYING: 4, //游戏中
    // LEFT: 5, //已离开

    WAITING: 1, //等待上桌(可以加钱)
    PLAYING: 2, //游戏中(一轮结束之后检测加钱)
    LEFT: 3,    //已离开(可以加钱)

    WATCHING: 4, //旁观
    PREPARING: 5, //准备中(可以加钱)
    CONFIRMING: 6, //买入确认中
}

//玩家状态名称
function PLAYER_STATE_TOSTRING(val) {
    switch (val) {
        case PLAYER_STATE.WATCHING:
            return { en: "WATCHING", zh: "旁观" };
        case PLAYER_STATE.PREPARING:
            return { en: "PREPARING", zh: "准备中" };
        case PLAYER_STATE.CONFIRMING:
            return { en: "CONFIRMING", zh: "买入确认中" };
        case PLAYER_STATE.WAITING:
            return { en: "WAITING", zh: "等待上桌" };
        case PLAYER_STATE.PLAYING:
            return { en: "PLAYING", zh: "游戏中" };
        case PLAYER_STATE.LEFT:
            return { en: "LEFT", zh: "已离开" };
    }
}

// 玩家状态是否可以加钱
function PLAYER_CAN_PAY(tableState, plyaerState) {
    return (plyaerState == PLAYER_STATE.WAITING || plyaerState == PLAYER_STATE.LEFT || plyaerState == PLAYER_STATE.PREPARING || plyaerState == PLAYER_STATE.CONFIRMING) ||
        (tableState == TABLE_STATE.WAITING || tableState == TABLE_STATE.PAUSE || tableState == TABLE_STATE.STOP);
}

//操作类型枚举
const OP_TYPE = {
    // WAIT: 0,
    // ANTE: 1,
    // SB: 2,
    // BB: 3,
    // STRADDLE: 4,
    // MISSBB: 5,
    // CHECK: 6,
    // FOLD: 7,
    // BET: 8,
    // CALL: 9,
    // RAISE: 10,
    // ALLIN: 11,

    // MUCK: 101,
    // SHOWPOKER: 102,
    // TIMEBANK: 103,
    // INS: 104

    WAIT: 0,
    ALLIN: 1,
    CHECK: 2,
    CALL: 3,
    FOLD: 4,
    RAISE: 5,
    SB: 6,
    BB: 7,
    BET: 8,
    ANTE: 12,
    STRADDLE: 13,
    MISSBB: 14,

    MUCK: 101,
    SHOWPOKER: 102,
    TIMEBANK: 103,
    INS: 104
}

//摊牌类型
const SHOW_DOWN_TYPE = {
    ALL_IN: 101, //全下
    SHOW_DOWN: 102, //摊牌
    SHOW_POKER: 103, //秀牌
    MUCK: 104, //盖牌
    FOLD: 105, //弃牌
}

//摊牌类型名称
function SHOW_DOWN_TYPE_TOSTRING(_op) {
    switch (_op) {
        case SHOW_DOWN_TYPE.ALL_IN:
            return { en: "ALL_IN", zh: "全下" };
        case SHOW_DOWN_TYPE.SHOW_DOWN://等待
            return { en: "SHOW_DOWN", zh: "比牌" };
        case SHOW_DOWN_TYPE.MUCK://前注
            return { en: "MUCK", zh: "盖牌" };
        case SHOW_DOWN_TYPE.SHOW_POKER://小盲
            return { en: "SHOW_POKER", zh: "秀牌" };
        case SHOW_DOWN_TYPE.FOLD://大盲
            return { en: "FOLD", zh: "弃牌" };
    }
}

//操作类型名称
function OP_TYPE_TOSTRING(_op) {
    switch (_op) {
        case OP_TYPE.WAIT://等待
            return { en: "WAIT", short: "W", zh: "等待" };
        case OP_TYPE.ANTE://前注
            return { en: "ANTE", short: "AN", zh: "前注" };
        case OP_TYPE.SB://小盲
            return { en: "SB", short: "SB", zh: "小盲" };
        case OP_TYPE.BB://大盲
            return { en: "BB", short: "BB", zh: "大盲" };
        case OP_TYPE.STRADDLE://抓盲
            return { en: "STRADDLE", short: "SE", zh: "抓盲" };
        case OP_TYPE.MISSBB://补盲
            return { en: "MISSBB", short: "EB", zh: "补盲" };
        case OP_TYPE.CHECK://过牌
            return { en: "CHECK", short: "O", zh: "过牌" };
        case OP_TYPE.FOLD://弃牌
            return { en: "FOLD", short: "X", zh: "弃牌" };
        case OP_TYPE.BET://下注
            return { en: "BET", short: "B", zh: "下注" };
        case OP_TYPE.CALL://跟注
            return { en: "CALL", short: "C", zh: "跟注" };
        case OP_TYPE.RAISE://加注
            return { en: "RAISE", short: "R", zh: "加注" };
        case OP_TYPE.ALLIN://全下
            return { en: "ALLIN", short: "A", zh: "全下" };
        case OP_TYPE.MUCK://盖牌
            return { en: "MUCK", short: "M", zh: "盖牌" };
        case OP_TYPE.SHOWPOKER://秀牌
            return { en: "SHOWPOKER", short: "P", zh: "秀牌" };
        case OP_TYPE.TIMEBANK://延时
            return { en: "TIMEBANK", short: "T", zh: "延时" };
        case OP_TYPE.INS://保险
            return { en: "INS", short: "I", zh: "保险" };
        default://未知
            return { en: "UNKOWN", short: "U", zh: "未知" };
    }
}

//盲注类型对应操作类型
const BLIND_TO_OPERATE = {
    "ANTE": OP_TYPE.ANTE, //前注
    "SB": OP_TYPE.SB, //小盲
    "BB": OP_TYPE.BB, //大盲
    "STRADDLE": OP_TYPE.STRADDLE, //抓盲
    "MISSBB": OP_TYPE.MISSBB, //补盲
    "ALLIN": OP_TYPE.ALLIN, //全下
}

//消息类型枚举
const PLAYER_MESSAGE_TYPE = {
    TEXT: 0,
    EMOJI: 1,
    ANIMATION: 2,
    VOICE: 3,
    URL: 4,
}

//消息来源枚举
const MESSAGE_FROM_TYPE = {
    USER: 0,
    VIP: 1,
    JACKPOT: 2,
}

//消息类型名称
function PLAYER_MESSAGE_TYPE_TOSTRING(_msg_type) {
    switch (_msg_type) {
        case PLAYER_MESSAGE_TYPE.TEXT:
            return "TEXT";
        case PLAYER_MESSAGE_TYPE.EMOJI:
            return "EMOJI";
        case PLAYER_MESSAGE_TYPE.ANIMATION:
            return "ANIMATION";
        case PLAYER_MESSAGE_TYPE.VOICE:
            return "VOICE";
        case PLAYER_MESSAGE_TYPE.URL:
            return "URL";
    }
}

//游戏类型枚举
const GAME_TYPE = {
    CASH: 0,
    CUP: 1,
    SNG: 2,
    MTT: 3,
    OMAHA: 4,
    SHORT: 5,
}

const GAME_TYPE_NEED_INIT = [GAME_TYPE.CASH, GAME_TYPE.SNG];


//游戏类型名称
function GAME_TYPE_TYPE_TOSTRING(_msg_type) {
    switch (_msg_type) {
        case GAME_TYPE.CASH:
            return "CASH";
        case GAME_TYPE.CUP:
            return "CUP";
        case GAME_TYPE.SNG:
            return "SNG";
        case GAME_TYPE.MTT:
            return "MTT";
        case GAME_TYPE.OMAHA:
            return "OMAHA";
        case GAME_TYPE.SHORT:
            return "SHORT";
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////
//********************************************************************************************//
////////////////////////////////////////////////////////////////////////////////////////////////

const events = require('events');

//全局事件控制器
const GLOBAL_EVENT = new events.EventEmitter();

//大厅状态
const LOBBY_STATE = {
    OPEN: 0,       //开启
    STOP: 1,       //停止, 等所有牌桌结束游戏, 并且全部退款后, 结束进程(PM2)
}

//每个注类型里牌桌数量
const MAX_TABLE_COUNT = [15, 12, 9];

function VALID_TABLEID(tableId) {
    if (!Number.isInteger(tableId)) {
        return false;
    }

    let blindType = Math.floor((tableId % 10000) / 1000);
    if (blindType < 1 || blindType > BIGBLIND_TYPE.length) {
        return false;
    }

    let tblIndex = tableId % 1000;
    if (tblIndex < 1) {
        return false;
    }

    let tableType = Math.floor(tableId / 100000);
    if (tableType == 2) {
        return (tblIndex <= MAX_TABLE_COUNT[0]);
    } else if (tableType == 6) {
        return (tblIndex <= MAX_TABLE_COUNT[1]);
    } else if (tableType == 9) {
        return (tblIndex <= MAX_TABLE_COUNT[2]);
    } else {
        return false;
    }
}

const PAYIN_STATE = {
    NEW: 0,         // 新建(未确认)
    TABLEKNOW: 1,   // 已通知牌桌(未确认)
    CONFIRMED: 11,   // 已确认
    ROLLBACK: 98,   // 已回滚
    FAILED: 99,     // 已失败
}

const PAYOUT_STATE = {
    NEW: 0,         // 新建(未确认)
    SUBMITED: 1,    // 已提交区块链
    FAILED: 2,      // 已失败(是需要重新提交的)
    CONFIRMED: 11,  // 已确认
    UNSAFE_CONFIRMED: 12,  // 已确认, 但不是通过常规途径的
    STOP: 99        // 因为重试太多次暂停
}

// 实际类似于PAYOUT_STATE
const JACKPOT_STATE = {
    NEW: 0,         // 新建(未确认)
    SUBMITED: 1,    // 已提交区块链
    FAILED: 2,      // 已失败(是需要重新提交的)
    CONFIRMED: 11,  // 已确认
    UNSAFE_CONFIRMED: 12,  // 已确认, 但不是通过常规途径的
    STOP: 99        // 因为重试太多次暂停
}

// 获取特殊牌型可分得奖池的比例
function JACKPOT_RATE(cardsType) {
    switch (cardsType) {
        case CARDS_TYPE.ROYAL_FLUSH:
            return 0.2;
        case CARDS_TYPE.STRAIGHT_FLUSH:
            return 0.02;
        case CARDS_TYPE.FOUR_OF_A_KIND:
            return 0.004;
        default:
            return 0;
    }
}

function BB_LV_RATE(bb_lv) {
    switch (bb_lv) {
        case 4e6:
            return 0.05;
        case 10e6:
            return 0.125;
        case 20e6:
            return 0.25;
        case 80e6:
            return 1;
        case 300e6:
            return 1;
        default:
            return 0.05;
    }
}

const REVENUE_OPTYPE = {
    PAYIN: 0,           // 充入
    WIN: 1,             // 赢得比赛

    PAYOUT: 101,        // 离开牌桌提款
    PAYOUT_INIT: 102,   // 异常关闭后启动时提款
    PAYOUT_UNKONW: 109, // 未记录到的退款

    LOST: 110,          // 输掉比赛

    /*  弃用选项, 或被移动到SENDBACK_OPTYPE  */
    // SENDBACK_FULL: 103, // 因筹码超上限全部退回  
    // SENDBACK_STOP: 104, // 因服务器关闭退回
    // SENDBACK_BLANK: 105,// 因玩家不在桌退回
    // SENDBACK_PART: 106, // 因筹码超上限部分退回  
}

// 提款类型, 跟REVENUE_OPTYPE匹配
const SENDBACK_OPTYPE = {
    SENDBACK_FULL: 201,     // 因筹码超上限全部退回  
    SENDBACK_BLANK: 202,    // 因玩家不在桌退回
    SENDBACK_PART: 203,     // 因筹码超上限部分退回  
    SENDBACK_STOP: 204,     // 因服务器关闭退款
}

module.exports = {
    MIN_FEE,
    TABLE_TYPE,
    BIGBLIND_TYPE,
    MIN_BUYIN,
    MAX_BUYIN,
    ALL_POKERS,
    POSITION_NAME,
    CARDS_TYPE,
    CARDS_TYPE_TOSTRING,
    CARD_STYLE_TOSTRING,
    SEAT_STATE,
    SEAT_STATE_TOSTRING,
    TABLE_STATE,
    TABLE_STATE_TOSTRING,
    ROUND_TYPE,
    ROUND_TYPE_TOSTRING,
    PLAYER_STATE,
    PLAYER_STATE_TOSTRING,
    PLAYER_CAN_PAY,
    OP_TYPE,
    OP_TYPE_TOSTRING,
    SHOW_DOWN_TYPE,
    SHOW_DOWN_TYPE_TOSTRING,
    BLIND_TO_OPERATE,
    PLAYER_MESSAGE_TYPE,
    PLAYER_MESSAGE_TYPE_TOSTRING,
    MESSAGE_FROM_TYPE,
    GAME_TYPE,
    GAME_TYPE_NEED_INIT,
    GAME_TYPE_TYPE_TOSTRING,
    /////////////////////////////////////////////
    GLOBAL_EVENT,
    LOBBY_STATE,
    MAX_TABLE_COUNT,
    VALID_TABLEID,
    PAYIN_STATE,
    PAYOUT_STATE,
    JACKPOT_STATE,
    JACKPOT_RATE,
    BB_LV_RATE,
    REVENUE_OPTYPE,
    SENDBACK_OPTYPE,
    FAKE_ALL_POKERS,
}