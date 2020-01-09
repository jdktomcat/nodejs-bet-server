const _ = require('lodash')._;
const {
    TABLE_STATE, TABLE_STATE_TOSTRING, BIGBLIND_TYPE,
    ROUND_TYPE, ROUND_TYPE_TOSTRING,
    PLAYER_STATE, PLAYER_STATE_TOSTRING,
    PLAYER_MESSAGE_TYPE, MESSAGE_FROM_TYPE,
    OP_TYPE, OP_TYPE_TOSTRING,
    GAME_TYPE, GAME_TYPE_TYPE_TOSTRING,
    CARDS_TYPE, CARDS_TYPE_TOSTRING, JACKPOT_RATE, BB_LV_RATE,
    SHOW_DOWN_TYPE, POSITION_NAME } = require('../common/commonEnum');
const events = require('events');

const Pokers = require('./dealCardsMachine');
const calculator = require("./calculator");
const potHelper = require('./potHelper');
const gameMessage = require('./gameMessage');
const bignumber = require('bignumber.js');

const roundInfo = require('./roundInfo');
const seatInfo = require('./seatInfo');
const playerInfo = require('./playerInfo');
const potInfo = require('./potInfo');
const chatInfo = require('./chatInfo');

const config = require('../configs/config');
const log4js = require('../configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const commonEnum = require('../common/commonEnum');
const LinkedList = require('../common/LinkedList');
const stringUtil = require('../common/stringUtil');

const tableSchema = require('../models/poker_table');
const dbService = require('../service/dbService');
const logService = require('../service/logService');

const sng_config = require('./sng/sngConfig');

const GLOBAL_EVENT = commonEnum.GLOBAL_EVENT;
const PAYIN_STATE = commonEnum.PAYIN_STATE;
const REVENUE_OPTYPE = commonEnum.REVENUE_OPTYPE;
const SENDBACK_OPTYPE = commonEnum.SENDBACK_OPTYPE;
const LOBBY_STATE = commonEnum.LOBBY_STATE;

const BEGIN_BLOCK_NUMBER = config.tronConfig.beginBlockNumber;
const getUnixTimeStamp = stringUtil.getUnixTimeStamp;
const assert = stringUtil.assert;

const DEFAULT_TIME_BANK_RESET_CD = 900000; //时间银行重置CD(毫秒)
const DEFAULT_TIME_BANK_OPERATE_SEC = 60000; //时间银行执行时限(毫秒)
const DEFAULT_OPERATE_SEC = 20000; //正常操作执行实现(毫秒)
const DEFAULT_LEFT_MAX = 180000; //站起最长时限(毫秒)
const DEFAULT_BUYIN_DURATION = 150000; //买入等待时间(毫秒)
const SNG_RESET_CD = config.sngConfig.SNG_RESET_CD; //SNG 牌桌重置CD(毫秒)
const SNG_BB_LV_CD = config.sngConfig.SNG_BB_LV_CD; //SNG 升盲CD(毫秒)

const NEED_SAVE_LOG_LIST = {
    "table_begin": true,
    "round_begin": true,
    "player_log": true,
    "return_bet": true,
    "round_end": true,
    "show_cards": true,
    "simple_cards_log": true,
    "show_down": true,
    "table_end": true,
}

let LobbyInstance = null;

function setLobby(ins) {
    LobbyInstance = ins;
}

const FUN_PRINT = {
    "seat_log": gameMessage.print_seat_log,
    "table_begin": gameMessage.print_table_begin,
    "round_begin": gameMessage.print_round_begin,
    "player_log": gameMessage.print_player_log,
    "return_bet": gameMessage.print_return_bet_log,
    "round_end": gameMessage.print_round_end,
    "next_actor": gameMessage.print_next_actor,
    "show_cards": gameMessage.print_show_cards,
    "show_down": gameMessage.print_show_down,
    "table_end": gameMessage.print_table_end,
    "all_info": gameMessage.print_all_info,
    "simple_cards_log": gameMessage.print_simple_cards_log,
}

class tableInfo extends events {
    constructor(options = {}) {
        super();
        this.on('action_complete', () => {
            let t = setTimeout(() => {
                clearTimeout(t);
                this.onRoundEnd();
            }, 600)
        });
        this.on('round_end', (round_index) => {
            let t = setTimeout(() => {
                clearTimeout(t);
                this.gotoNextRound(round_index);
            }, 600)
        });
        this.on('action_time_out', (uid) => {
            let player = this.getPlayerByUID(uid);
            if (player != null) {
                gameMessage.info(this.tableId, this.no, "===> action_time_out " + player.position + "(" + player.uname + ") = " + player.uid + "; had_bet = " + (player.allBets[this.roundInfo.roundIndex] || 0));
                this.playerBet(uid, 0);
                if (this.gameType !== GAME_TYPE.SNG) { //sng
                    if (player.getBalance() > 0 && this.roundInfo.roundMaxBet > (player.allBets[this.roundInfo.roundIndex] || 0)) { // balance > 0 => 非allin 且 下注额< 当前轮次最大下注额
                        this.sitOutNextHand(player.uid);
                    }
                } else {
                    if (player.getBalance() > 0 && this.roundInfo.roundMaxBet > (player.allBets[this.roundInfo.roundIndex] || 0)) { // balance > 0 => 非allin 且 下注额< 当前轮次最大下注额
                        player.robot = true;
                        let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
                        this.boradcastMsg(_seat_log);
                    }
                }
            }
        })

        //info
        this.gameType = options.gameType || GAME_TYPE.SNG; //sng
        this.tableId = options.tableId || 901001;
        this.no = options.no || 0;
        this.tableName = options.tableName || ("#" + this.tableId);
        this.chatLogs = [];
        this.history = [];
        this.tableState = TABLE_STATE.WAITING;
        this.pokersMgr = null;
        this.allPlayers = {};
        this.output = true;
        this.endEarly = false;

        this.config = {
            ante: options.ante || 0 * 1e6,
            smallBlind: options.smallBlind || 2 * 1e6,
            bigBlind: options.bigBlind || 4 * 1e6,
            straddle: options.straddle || 0 * 1e6,
            // minPlayers: options.minPlayers || 2,
            minPlayers: options.maxPlayers || 9, //sng
            maxPlayers: options.maxPlayers || 9,
            // minBuyIn: options.minBuyIn || 160 * 1e6,
            minBuyIn: options.maxBuyIn || 160 * 1e6, //sng
            maxBuyIn: options.maxBuyIn || 400 * 1e6,
            feeRate: 0, //options.feeRate || 0, //SNG游戏过程中不抽成
            enableAante: options.enableAante || true,
            enableStraddle: options.enableStraddle || true,
            enableInsurance: options.enableInsurance || false,
            enable27: options.enable27 || false,
            enableDoubleCompare: options.enableDoubleCompare || false,
            startTs: 0,
            endTs: 0,
            enableKickOut: true, //开启自动踢人
            high_score_mode: false, //高分模式(测试用)
        }

        this.statistics = {
            table_buy_in: 0,
            table_withdrawl: 0,
            table_fee: 0,
        }

        //杯赛(cup)配置处理
        // if (this.tableId === config.cupConfig.tableId) {
        //     this.gameType = GAME_TYPE.CUP;
        //     this.config.startTs = config.cupConfig.startTs || (_.now() + 30000);
        //     this.config.endTs = config.cupConfig.endTs || (this.gameInfo.startTs + 7200000);
        //     this.config.enableKickOut = false;
        //     this.config.feeRate = 0;
        // }

        // //现金局配置处理
        // if (this.gameType === GAME_TYPE.CASH) {
        //     if (config.cashConfig != null) {
        //         this.config.endTs = config.cashConfig.endTs || 0;
        //         if (config.cashConfig.feeRate != null && config.cashConfig.feeRate > 0) this.config.feeRate = config.cashConfig.feeRate;
        //         if (config.cashConfig.minPlayers != null && config.cashConfig.minPlayers > 0) this.config.minPlayers = config.cashConfig.minPlayers;
        //         if (config.cashConfig.high_score_mode != null && config.cashConfig.high_score_mode === true) this.config.high_score_mode = config.cashConfig.high_score_mode;
        //     }
        // }

        let _basic_sb = options.smallBlind || 2 * 1e6;
        let _basic_bb = _basic_sb * 2;
        if (this.gameType === GAME_TYPE.SNG) {
            if (config.sngConfig.feeRate != null) {
                let blind_idx = _.findIndex(BIGBLIND_TYPE, (o) => {
                    return o === _basic_bb;
                })
                this.config.feeRate = config.sngConfig.feeRate[blind_idx] || 0;
            } else {
                this.config.feeRate = 0;
            }
        }

        this.sng = {
            basic_sb: _basic_sb, //基础盲注
            cd: SNG_BB_LV_CD, //升盲间隔

            next_bb_ts: 0, //下次升盲时间戳
            lv: 0, //当前盲注级别
            result: {}, //赛果
        }

        //gameMessage.info(this.tableId, this.no, "===> high_score_mode " + this.config.high_score_mode);

        //每局游戏变化数据
        this.gameInfo = {
            sbSeatNo: 0,//本局小盲所在的物理座位号
            bbSeatNo: 0,//本局大盲所在的物理座位号
            btnSeatNo: -1, //本局庄位所在的物理座位号 $$用以切换下一手按钮位置
            communityCards: [],  //公牌
            gameResult: [], //本局胜利者信息
            showCards: [],
            lastestAttackerPosition: "",
            initCountPlayers: 0,
        }
        //每轮游戏变化数据
        this.roundInfo = new roundInfo();

        // 充值订单信息
        this.unConfirmedOrder = {};      // 未确认充值订单
        this.confirmedOrder = {};        // 已确认充值订单, 可以下一局给玩家(如果里面有3局未给玩家的,就退回)
        this.clearCompleted = false;     // 维护时的清桌状态

        let allSeats = new LinkedList(new seatInfo(0));
        for (let _seatNo = 1; _seatNo < this.config.maxPlayers; _seatNo++) {
            allSeats.insert(new seatInfo(_seatNo));
        }
        this.allSeats = allSeats;
        this.pot = new potInfo(this.config.maxPlayers);

        this.tableClock = setInterval(() => {
            if (this.tableState != TABLE_STATE.STOP) {
                this.click();
            } else {
                if (this.gameType === GAME_TYPE.SNG && this.tableRestartTs != null && _.now() > this.tableRestartTs) {
                    gameMessage.info(this.tableId, this.no, "重开SNG !!!!!!!!!!!!!!");
                    this.tableState = TABLE_STATE.WAITING;
                    this.tableRestartTs = 0;

                    this.sng.next_bb_ts = 0; //下次升盲时间戳
                    this.sng.lv = 0; //当盲注级别
                    this.sng.total_m = 0; //本场SNG总买入筹码量
                    this.sng.result = {};//赛果

                    let cfg = sng_config.blind_lv[this.sng.lv];
                    this.config.smallBlind = this.sng.basic_sb * cfg.sb;
                    if (this.config.smallBlind % 1e6 > 0) this.config.smallBlind = this.config.smallBlind + (1e6 - this.config.smallBlind % 1e6);
                    this.config.bigBlind = this.config.smallBlind * 2;
                    this.broadcastTableInfo();
                    let rank_info = this.getRankInfo();
                    this.sendRankInfo(rank_info, null, false); //重开=>推送排行榜数据
                }
            }
        }, 1000);
    }
    broadcastTableInfo() {
        //发送玩家信息
        let _table_begin_log = gameMessage.table_info(this);
        //向其他观战玩家广播信息
        _table_begin_log.data.yourSeatNo = -1;
        _table_begin_log.data.yourHandCards = [];
        _table_begin_log.data.yourTodo = {};
        this.boradcastMsgExcept(_table_begin_log, {});
    }
    load(_config) { //从mongodb加载配置项 SNG:重启时全部重置配置，不需要加载
        // if (_config == null) return;
        // this.config = _config;
        // let _now = _.now();
        // if (this.config.startTs === 0 && this.config.endTs === 0) {
        //     this.tableState = TABLE_STATE.PAUSE;
        // } else {
        //     if (_now < this.config.startTs) {
        //         this.tableState = TABLE_STATE.WAITING;
        //     } else if (_now >= this.config.startTs && _now <= this.config.endTs) {
        //         this.tableState = TABLE_STATE.PAUSE;
        //     } else if (_now > this.config.endTs) {
        //         this.tableState = TABLE_STATE.STOP;
        //     }
        // }
    }
    click() {
        let now = _.now();
        if (this.tableState === TABLE_STATE.WAITING) {
            // let startCountDown = Math.floor((this.config.startTs - now) / 1000);
            // if (startCountDown < 0) {
            //     startCountDown = 0;
            //     if (this.canBegin() === true) {
            //         this.start();
            //     }
            // } else {
            if (this.gameType === GAME_TYPE.CUP && config.cupConfig.cupGame === true) {
                let startCountDown = Math.floor((this.config.startTs - now) / 1000);
                if (startCountDown < 0) startCountDown = 0;
                if (startCountDown % 30 === 0) {
                    gameMessage.info(this.tableId, this.no, "===> 杯赛开始倒计时:" + startCountDown + "秒");
                }
                if (this.canBegin() === true) {
                    this.start();
                }
            }
            // }
        } else if (this.tableState === TABLE_STATE.CLEARING) {
            gameMessage.info(this.tableId, this.no, ">>> >>> >>> TABLE_STATE.CLEARING ts = " + this.clearTs);
            if (this.clearTs != null && (now - this.clearTs) > 15000 && this.canBegin() === true) {
                gameMessage.info(this.tableId, this.no, ">>> TABLE_STATE.CLEARING TIMEOUT >>> restart");
                this.start();
            }
        } else if (this.tableState === TABLE_STATE.PAUSE || this.tableState === TABLE_STATE.STOP) {
            if (this.gameType === GAME_TYPE.CUP) {
                // if (this.config.endTs > 0 && _.now() > this.config.endTs) {
                //     this.tableState = TABLE_STATE.STOP;
                //     gameMessage.info(this.tableId, this.no, " ===> 牌桌暂停中 => 提前关闭");
                //     this.gameover();
                // }
            }
        }
        if (this.config.enableKickOut === true) {
            this.allSeats.findAll(null, (o) => {
                let player = o.data.player;
                if (player != null) {
                    if (player.playerState === PLAYER_STATE.LEFT) {
                        //参考CASH
                    } else if (player.playerState === PLAYER_STATE.CONFIRMING) {
                        if (player.buyInTs > 0 && (now - player.buyInTs > DEFAULT_BUYIN_DURATION)) { //买入超时
                            gameMessage.info(this.tableId, this.no, "===> 买入超时>>踢出" + player.position + "(" + player.uname + ")");
                            // this.playerExit(player.uid);
                            this.kickOut(player); //SNG
                        } else {
                            // gameMessage.info(this.tableId,this.no,"===> 等待买入 => 即将超时" + player.position +","+ player.uname +","+ (now - player.buyInTs) +","+ DEFAULT_BUYIN_DURATION);
                        }
                    }
                }
            })
        }
        this.upgradeBlindLV(now);
    }
    upgradeBlindLV(_now) {
        if (this.tableState !== TABLE_STATE.WAITING && this.tableState !== TABLE_STATE.STOP && this.sng.next_bb_ts > 0 && _now > this.sng.next_bb_ts) {
            let _lv = this.sng.lv + 1;
            if (_lv > sng_config.blind_lv.length - 1) _lv = sng_config.blind_lv.length - 1;
            this.sng.lv = _lv; //实际盲注级别升级 + 1
            this.sng.next_bb_ts = this.sng.next_bb_ts + this.sng.cd; //更新下次升盲时间

            let blind_info = this.getBlindInfo();
            let next_lv = blind_info.next_lv;
            let next_sb = blind_info.next_sb;
            let next_bb = blind_info.next_bb;
            gameMessage.info(this.tableId, this.no, "即将升盲 SB/BB =>" + (next_sb / 1e6) + "/" + (next_bb / 1e6) + " next_blind_lv = " + next_lv);
            this.boradcastMsg({
                type: "next_bb_info",
                data: {
                    tableId: this.tableId,
                    no: this.no,
                    cur_lv: this.sng.lv,
                    next_lv: this.sng.lv + 1,
                    next_sb: blind_info.next_sb,
                    next_bb: blind_info.next_bb,
                    sngts: blind_info.sngts,
                    sngmts: blind_info.sngmts,
                }
            });
        }
        return this.sng.lv || 0;
    }
    getBlindInfo() {
        let _cur_lv = this.sng.lv;
        let _next_lv = _cur_lv + 1;
        if (_next_lv > sng_config.blind_lv.length - 1) _next_lv = sng_config.blind_lv.length - 1;
        let cfg = sng_config.blind_lv[_next_lv];
        let next_sb = this.sng.basic_sb * cfg.sb;
        if (next_sb % 1e6 > 0) next_sb = next_sb + (1e6 - next_sb % 1e6);
        let next_bb = next_sb * 2;

        let ts = this.sng.next_bb_ts - _.now(); //下次涨盲倒计时
        return { next_lv: _next_lv, next_sb, next_bb, sngts: ts > 0 ? ts : 0, sngmts: this.sng.cd }
    }
    boradcastMsg(msg) {
        if (_.isEmpty(msg)) return;
        GLOBAL_EVENT.emit('room', this.tableId, { title: 'table_aj', content: msg });
        if (NEED_SAVE_LOG_LIST[msg.type] === true) this.saveLogs(msg);
        if (this.output === false) return;
        let fn = FUN_PRINT[msg.type];
        if (fn) fn(msg.data);
    }
    boradcastMsgExcept(msg, sockMap = {}) {
        if (_.isEmpty(msg)) return;
        GLOBAL_EVENT.emit('roomNotin', this.tableId, sockMap, { title: 'table_aj', content: msg });
        if (NEED_SAVE_LOG_LIST[msg.type] === true) this.saveLogs(msg);
        if (this.output === false) return;
        let fn = FUN_PRINT[msg.type];
        if (fn) fn(msg.data);
    }
    sendMsg(socket_id, msg) {
        if (_.isEmpty(socket_id) || _.isEmpty(msg)) return;
        GLOBAL_EVENT.emit('sock', socket_id, 'table_aj', msg);
        if (this.output === false) return;
        let fn = FUN_PRINT[msg.type];
        if (fn) fn(msg.data);
    }
    sendHistoryList(socket_id, msg) {
        GLOBAL_EVENT.emit('sock', socket_id, 'table_history_list', msg);
    }
    boradcastHistoryOne(msg) {
        GLOBAL_EVENT.emit('room', this.tableId, { title: 'table_history_list_one', content: msg });
    }
    sendHistoryDetail(socket_id, msg) {
        GLOBAL_EVENT.emit('sock', socket_id, 'table_history_detail', msg);
    }
    sendChatLogs(socket_id, msg) {
        GLOBAL_EVENT.emit('sock', socket_id, 'all_chat_logs', msg);
    }
    sendTableAllInfo(socket_id, msg) {
        if (_.isEmpty(socket_id) || _.isEmpty(msg)) return;
        GLOBAL_EVENT.emit('sock', socket_id, 'table_all_info', msg);
    }
    sendRankInfoToSocket(socket_id, msg) {
        if (_.isEmpty(socket_id) || _.isEmpty(msg)) return;
        GLOBAL_EVENT.emit('sock', socket_id, 'table_rank', msg);
    }
    boradcastRankInfo(msg) {
        GLOBAL_EVENT.emit('room', this.tableId, { title: 'table_rank', content: msg });
    }
    sendGodCards(socket_id, msg) {
        if (_.isEmpty(socket_id) || _.isEmpty(msg)) return;
        GLOBAL_EVENT.emit('sock', socket_id, 'god_cards', msg);
    }
    getTableInfo(socket_id, uid) {
        let _now = _.now();
        let isTablePlaying = this.tableState === TABLE_STATE.PLAYING;

        let resetTs = 0;
        if (this.gameType === GAME_TYPE.SNG && this.tableState === TABLE_STATE.STOP && this.tableRestartTs != null && this.tableRestartTs > _now) {
            resetTs = this.tableRestartTs - _now;
        }

        let youself = null;
        let curActor = null;
        youself = this.getPlayerByUID(uid);
        if (isTablePlaying === true) {
            curActor = this.getPlayerByUID(this.roundInfo.curActorUid);
        }

        let _players_info = [];
        this.allSeats.findAll(null, (o) => {
            let _p = o.data.player;
            if (_p != null) {
                let _opType = OP_TYPE.WAIT;
                let _bet = 0;
                let _betArray = [];
                let _cards = [];
                if (_p.handCards != null) {
                    let _left_card = _p.handCards[0];
                    if (_left_card != null && _left_card.show === true) { // ==> 可能allin提前结束
                        _cards.push(_left_card);
                    }
                    let _right_card = _p.handCards[1];
                    if (_right_card != null && _right_card.show === true) { // ==> 可能allin提前结束
                        _cards.push(_right_card);
                    }
                }
                if (isTablePlaying === true) {
                    _opType = _p.thisRoundOp;
                    _bet = _p.allBets[this.roundInfo.roundIndex] || 0;
                    _betArray = _p.thisRoundBetArray;
                }

                let exitCountDown = _now - _p.sitOutTs;
                if (exitCountDown < 0) exitCountDown = 0;

                _players_info.push({
                    seatNo: _p.seatNo, position: _p.position, uname: _p.uname, uid: _p.uid, photoIdx: _p.photoIdx, lv: _p.lv, playerState: _p.playerState, balance: _p.getBalance(), //必填
                    opType: _opType, bet: _bet, betArray: _betArray, //游戏中才显示
                    showCards: _cards, //根据秀牌状态或者提前结束情况(allin)
                    exitCountDown: exitCountDown,
                    //sng
                    robot: _p.robot,
                    sng_rank: _p.sng_rank,
                });
            } else {
                _players_info.push({ seatNo: o.data.seatNo })
            }
        })

        let blind_info = this.getBlindInfo();
        gameMessage.info(this.tableId, this.no, "结算预览 ===> ");
        let sng_award_info = this.calcSNGAward(this.config.maxBuyIn * this.config.maxPlayers); //根据买入要求 * 最大游戏人数 => 理论奖池金额

        let all_info = {
            type: "all_info",
            data: {
                gameType: this.gameType,
                tableId: this.tableId,
                no: this.no,
                round: this.roundInfo.roundIndex,
                ante: this.config.ante,
                sb: this.config.smallBlind,
                bb: this.config.bigBlind,
                btn: this.tableState === TABLE_STATE.PLAYING ? this.gameInfo.btnSeatNo : -1,
                tableState: this.tableState,
                straddle: this.config.straddle,
                now: _.now(),//当前时间戳
                communityCards: this.gameInfo.communityCards,
                playersInfo: _players_info,
                pot: this.pot.pot,
                // pots: this.pot.sidePots,
                yourSeatNo: youself == null ? -1 : youself.seatNo,
                yourHandCards: youself == null ? [] : youself.handCards,
                yourTodo: youself == null ? {} : youself.todo,
                currentTalker: curActor == null ? {} : { seatNo: curActor.seatNo, timeBank: curActor.getTimeBankCountDown(DEFAULT_TIME_BANK_RESET_CD), ms: curActor.operateSec, countDown: curActor.getOperateSec() },

                aj: _.find(config.cupConfig.addrVIPs, (o) => { return o === uid }) != null ? true : false, //裁判员
                blizzard: _.find(config.cupConfig.addrGMs, (o) => { return o === uid }) != null ? true : false, //管理员

                sngts: blind_info.sngts,
                sngmts: blind_info.sngmts,
                next_sb: blind_info.next_sb,
                next_bb: blind_info.next_bb,

                sng_total_buyin: sng_award_info.sng_total_buyin,//SNG总买入
                sng_winners_count: sng_award_info.sng_winners_count,//钱圈人数
                sng_first_val: sng_award_info.sng_first_val, //第一名奖励
                sng_sec_val: sng_award_info.sng_sec_val, //第二名奖励
                sng_third_val: sng_award_info.sng_third_val, //第三名奖励
                sng_fee_rate: sng_award_info.sng_fee_rate, //手续费率

                resetTs: resetTs, //STOP状态重置为WAITING倒计时
            }
        }

        let all_info_communityCards = all_info.data.communityCards;
        for (let i = 0; i < all_info_communityCards.length; i++) {
            all_info_communityCards[i].idx = i;
        }

        let _pots = [];
        for (let i = 0; i < this.pot.sidePots.length; i++) {
            if (this.pot.sidePots[i].value > 0) {
                _pots.push(this.pot.sidePots[i]);
            }
        }
        all_info.data.pots = _pots;

        if (this.roundInfo.roundIndex >= ROUND_TYPE.SHOWDOWN) {
            let showdown_info = [];
            let gameResult = this.gameInfo.gameResult;
            for (let uid in gameResult) {
                let p = gameResult[uid];
                showdown_info.push({ seatNo: p.seatNo, value: p.value });
            }
            all_info.data.showdown = {
                winners: showdown_info
            }
        }
        this.sendTableAllInfo(socket_id, all_info);

        //推送历史记录
        this.getHistoryList(socket_id, this.tableId, 50);
        //推送聊天记录
        this.getAllChat(socket_id);
        //推送排行榜
        let lastest_rank_info = this.sng.result;
        if (lastest_rank_info != null) {
            this.sendRankInfo(lastest_rank_info, socket_id, false); //向单个玩家推送排行榜数据
        }
    };

    getStatisticsInfo(show = true) {
        let hotMoney = this.statistics.table_buy_in - this.statistics.table_withdrawl - this.statistics.table_fee;
        if (show === true) {
            gameMessage.info(this.tableId, this.no, "");
            gameMessage.info(this.tableId, this.no, "statistics_info ===> hotMoney = " + hotMoney / 1e6 + "TRX table_buy_in = " + this.statistics.table_buy_in / 1e6 + "TRX table_withdrawl = " + this.statistics.table_withdrawl / 1e6 + "TRX table_fee = " + this.statistics.table_fee / 1e6 + " TRX")
            gameMessage.info(this.tableId, this.no, "");
        }
        return hotMoney;
    }
    canBegin() {
        this.getStatisticsInfo();
        if (LobbyInstance.lobbyState == LOBBY_STATE.STOP) {
            this.tableState = TABLE_STATE.STOP;
            return false;
        }
        if (this.tableState == TABLE_STATE.STOP) {
            return false;
        }

        let _now = _.now();
        if (this.config.startTs > 0 && _now < this.config.startTs) {
            return false;
        }
        if (this.config.endTs > 0 && _now > this.config.endTs) {
            return false;
        }

        return true;
    }
    gameover() {
        gameMessage.info(this.tableId, this.no, "\r\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< gameover -> GAMEOVER (SHOW RANK) >>>>>>>>>>>>>>>>>>>>>>>>>>>>>> \r\n");
        let rank_info = this.getRankInfo(); //广播排行榜数据(比赛结束)
        gameMessage.info(this.tableId, this.no, "gameover ===> 正式结算 ===> ");
        let sng_award_info = this.calcSNGAward(this.config.maxBuyIn * this.config.maxPlayers);
        this.setSNGAward(rank_info, sng_award_info);
        this.sendRankInfo(rank_info, null, true);
    }
    checkCountPlayer() {
        let count_players_playing = this.getCountPlayersByState(PLAYER_STATE.PLAYING);
        let count_players_waiting = this.getCountPlayersByState(PLAYER_STATE.WAITING);
        let count_players_backing = this.getCountBackingPlayers();
        gameMessage.info(this.tableId, this.no,
            "===> 游戏中玩家数 = " + count_players_playing
            + "; 等待中玩家数 = " + count_players_waiting
            + "; 返桌中玩家数 = " + count_players_backing
        )
        let total_players = count_players_playing + count_players_waiting + count_players_backing;
        if (total_players === 1) { //SNG
            gameMessage.info(this.tableId, this.no, "===> 玩家 < " + this.config.minPlayers + "人 ==> !!!!!!!!! 游戏结束 !!!!!!!!!");
            this.tableState = TABLE_STATE.STOP;
            this.onStop();
            return { gameContiune: false, total_players, count_players_playing, count_players_waiting, count_players_backing };
        }
        return { gameContiune: true, total_players, count_players_playing, count_players_waiting, count_players_backing };
    }
    onPause() {
        gameMessage.info(this.tableId, this.no, "<<< GAME PAUSE >>>");
        let t = setTimeout(() => {
            clearTimeout(t);
            if (this.tableState === TABLE_STATE.PAUSE) {
                gameMessage.info(this.tableId, this.no, "===> Table is pause =>every one sit out!");
                this.allSeats.findAll(null, (o) => {
                    let player = o.data.player;
                    if (player != null && player.playerState === PLAYER_STATE.PLAYING) { //游戏暂停一段时间后，当前留桌的玩家直接站起，以准备踢出
                        player.todo.toSitOut = true;
                        this.sitOut(player);
                    }
                });
            }
        }, DEFAULT_LEFT_MAX);
    }
    onStop() {
        gameMessage.info(this.tableId, this.no, "<<< GAME OVER >>>");
        if (this.tableState === TABLE_STATE.PAUSE) {
            let t = setTimeout(() => {
                clearTimeout(t);
                gameMessage.info(this.tableId, this.no, "===> Table is pause =>every one sit out!");
                this.allSeats.findAll(null, (o) => {
                    let player = o.data.player;
                    if (player != null && player.playerState === PLAYER_STATE.PLAYING) { //游戏暂停一段时间后，当前留桌的玩家直接站起，以准备踢出
                        player.todo.toSitOut = true;
                        this.sitOut(player);
                    }
                });
            }, DEFAULT_LEFT_MAX);
        }
        else if (this.gameType === GAME_TYPE.SNG) {
            let rank_info = this.getRankInfo();
            let isGameOver = false;
            if (this.tableState === TABLE_STATE.STOP) {
                gameMessage.info(this.tableId, this.no, "\r\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< onStop --> GAMEOVER (SHOW RANK) >>>>>>>>>>>>>>>>>>>>>>>>>>>>>> \r\n");
                gameMessage.info(this.tableId, this.no, "onStop ===> 正式结算 ===> ");
                let sng_award_info = this.calcSNGAward(this.config.maxBuyIn * this.config.maxPlayers);
                this.setSNGAward(rank_info, sng_award_info);

                logService.saveSNGLogs(rank_info);

                isGameOver = true;

                this.tableRestartTs = _.now() + SNG_RESET_CD; //SNG

                //抽水结果 => 总奖池/彩池
                let fee = sng_award_info.sng_fee;
                if (fee > 0) {
                    //
                    console.log("奖池增加 -->", fee / 1e6);
                    LobbyInstance.addTotalFee(fee);
                    this.onJackpotChanged();
                }

                //kickout all
                this.allSeats.findAll(null, (o) => {
                    let player = o.data.player;
                    if (player != null) this.kickOut(player);
                });
            }
            // console.log("WTFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", rank_info, this.gameType, GAME_TYPE.SNG, this.tableState, TABLE_STATE.STOP);
            this.sendRankInfo(rank_info, null, isGameOver); //游戏结束，结算完毕 => 推送排行榜数据
            this.sng.result = rank_info;
            this.broadcastTableInfo();
        }
    }
    start(restart) {
        if (this.canBegin() === false) {
            gameMessage.info(this.tableId, this.no, "===> 大厅已停/牌桌开始结束时间不匹配");
            return;
        }

        //下车,上车
        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.PLAYING && player.todo.toSitOut === true) {
                this.sitOut(player);
            }
        });

        let checkBetweenSBAndBB = false; //是否需要判断玩家是否坐在大小盲之间

        let _count_players_playing = this.getCountPlayersByState(PLAYER_STATE.PLAYING);

        let lastSBSeatNo = this.gameInfo.sbSeatNo;
        let lastBBSeatNo = this.gameInfo.bbSeatNo;
        let lastSBSeat = this.getNodeBySeatNo(lastSBSeatNo);
        let lastBBSeat = this.getNodeBySeatNo(lastBBSeatNo);

        if (lastSBSeatNo === lastBBSeatNo) { //上轮仅仅两位玩家在游戏，本轮仅互换位置，此时无需判断大小盲之间是否可坐
            gameMessage.info(this.tableId, this.no, "===> 上轮仅仅两位玩家在游戏，本轮仅互换位置，此时无需判断大小盲之间是否可坐");
            checkBetweenSBAndBB = false;
        } else if (_count_players_playing < 2) { //上轮留下的游戏中玩家人数>=2人时才判断大小盲之间是否可坐下
            gameMessage.info(this.tableId, this.no, "===> 上轮留下的游戏中玩家人数>2人时才判断大小盲之间是否可坐下 sb_seat_no = " + lastSBSeatNo + " bb_seat_no = " + lastBBSeatNo);
            checkBetweenSBAndBB = false;
        } else {
            gameMessage.info(this.tableId, this.no, "===> 判断大小盲之间是否可坐下");
            checkBetweenSBAndBB = true;
        }

        ///
        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.LEFT && player.todo.toSeatBack === true && player.getBalance() > 0) { //回桌
                if (checkBetweenSBAndBB === true) { //检查是否坐在大小盲之间
                    let seatBetweenSBAndBB = this.allSeats.findFromTo(lastSBSeat, lastBBSeat, (o) => {
                        return o.data.player != null && o.data.player.uid === player.uid;
                    })
                    if (seatBetweenSBAndBB == null) { //没有坐在上轮的大小盲之间
                        player.justComingBack = true;
                        this.comeBack(player);
                    } else { //坐在了上轮的大小盲之间
                        gameMessage.info(this.tableId, this.no, "===> 坐在上轮大小盲之间暂时无法回桌 name = " + player.uname + " uid = " + player.uid);
                    }
                } else {
                    player.justComingBack = true;
                    this.comeBack(player);
                }
            }
        });
        ///

        //玩家计数
        let { gameContiune, total_players, count_players_playing, count_players_waiting } = this.checkCountPlayer();
        if (gameContiune === false) return;

        //sng 升盲判断
        let _now = _.now();
        let _now_blind_lv = this.upgradeBlindLV(_now);
        let cfg = sng_config.blind_lv[_now_blind_lv];
        this.config.smallBlind = this.sng.basic_sb * cfg.sb;
        if (this.config.smallBlind % 1e6 > 0) this.config.smallBlind = this.config.smallBlind + (1e6 - this.config.smallBlind % 1e6);
        this.config.bigBlind = this.config.smallBlind * 2;
        if (_now_blind_lv === 0 && this.sng.next_bb_ts === 0) this.sng.next_bb_ts = _now + this.sng.cd;
        gameMessage.info(this.tableId, this.no, "当前盲注级别 = " + (this.config.smallBlind / 1e6) + "/" + (this.config.bigBlind / 1e6));
        //

        let nextBTNSeat = null;
        let nextSBSeat = null;
        let nextBBSeat = null;

        if (total_players === 2) {
            gameMessage.info(this.tableId, this.no, "...> total_players = 2");
            this.allSeats.findAll(null, (o) => {
                let _player = o.data.player;
                if (_player != null && _player.playerState === PLAYER_STATE.WAITING && _player.getBalance() > 0) {
                    _player.playerState = PLAYER_STATE.PLAYING;
                }
            });
            let preBtnSeat = this.getNodeBySeatNo(this.gameInfo.btnSeatNo); //maybe null
            nextBTNSeat = this.moveBtn(preBtnSeat); //第一移动BTN
            nextSBSeat = nextBTNSeat; //SB即为BTN
            nextBBSeat = this.moveBigBlind(nextSBSeat, nextBTNSeat);
        } else if (count_players_playing === 2 && count_players_waiting === 1) { //特殊情况=>两人在玩,新来1个且仅仅1个玩家
            gameMessage.info(this.tableId, this.no, "...> total_players = 2 + 1");
            gameMessage.info(this.tableId, this.no, "...> 特殊情况=>两人在玩,新来1个且仅仅1个玩家");
            nextBBSeat = this.allSeats.findAll(null, (o) => {
                let _player = o.data.player;
                if (_player != null && _player.playerState === PLAYER_STATE.WAITING && _player.getBalance() > 0) {
                    _player.playerState = PLAYER_STATE.PLAYING;
                    _player.position = "BB";
                    return true
                }
            })
            nextBTNSeat = this.allSeats.findNextNode(nextBBSeat, (o) => {
                let _player = o.data.player;
                if (_player != null && _player.playerState === PLAYER_STATE.PLAYING && _player.getBalance() > 0) {
                    // _player.playerState = PLAYER_STATE.PLAYING;
                    _player.position = "BTN";
                    return true
                }
            })
            nextSBSeat = this.allSeats.findNextNode(nextBTNSeat, (o) => {
                let _player = o.data.player;
                if (_player != null && _player.playerState === PLAYER_STATE.PLAYING && _player.getBalance() > 0) {
                    // _player.playerState = PLAYER_STATE.PLAYING;
                    _player.position = "SB";
                    return true
                }
            })
        } else { //正常流程
            gameMessage.info(this.tableId, this.no, "===> total_players >= 3");
            let preBtnSeat = this.getNodeBySeatNo(this.gameInfo.btnSeatNo); //maybe null
            nextBTNSeat = this.moveBtn(preBtnSeat); //第一移动BTN
            nextSBSeat = this.moveSmallBlind(nextBTNSeat); //第二移动SB
            nextBBSeat = this.moveBigBlind(nextSBSeat, nextBTNSeat);

            //TODO:cancel =>测试用，指定玩家余额
            //nextSBSeat.data.player.init_balance = 1380100000;
            //nextBBSeat.data.player.init_balance = 2000000000;
            //nextBTNSeat.data.player.init_balance = 3750450000;
            //

            let needPay4MissBB = (this.tableState === TABLE_STATE.WAITING || this.tableState === TABLE_STATE.PAUSE) ? false : true; //WAITING => PLAYING 第一次开桌，当前有效玩家全部直接上桌
            if (needPay4MissBB === false) {
                gameMessage.info(this.tableId, this.no, "tableState => WAITING => PLAYING => 第一次开桌，当前有效玩家全部直接上桌")
            }
            this.moveAutoBB(nextBBSeat, nextBTNSeat, needPay4MissBB);
        }

        if (nextBTNSeat != null) {
            nextBTNSeat.data.player.actionIdx = 99;
            this.gameInfo.btnSeatNo = nextBTNSeat.data.player.seatNo;
        }
        if (nextSBSeat != null) {
            nextBTNSeat.data.player.actionIdx = 1;
            this.gameInfo.sbSeatNo = nextSBSeat.data.player.seatNo;
        }
        if (nextBBSeat != null) {
            nextBTNSeat.data.player.actionIdx = 2;
            this.gameInfo.bbSeatNo = nextBBSeat.data.player.seatNo;
        }

        //SNG 筹码统一为10000
        // nextBTNSeat.data.player.init_balance = 10000000000;
        // nextBBSeat.data.player.init_balance = 10000000000;
        // nextBTNSeat.data.player.init_balance = 10000000000;

        //牌桌开始游戏
        let init_table_state = this.tableState;
        if (restart == null || restart === false) {
            this.no = this.no + 1;
        }
        this.tableState = TABLE_STATE.PLAYING;
        if (init_table_state === TABLE_STATE.WAITING) { //从waiting状态开始启动牌桌
            let rank_info = this.getRankInfo();
            this.sendRankInfo(rank_info, null, false); //开启游戏 => 推送排行榜数据
        }

        //生成位置
        this.newPosition();

        //洗牌
        let high_score_mode = this.gameType === GAME_TYPE.CASH ? config.cashConfig.high_score_mode : false;
        this.pokersMgr = new Pokers(high_score_mode);

        //发手牌!!!
        this.sendHandCards();
        //发手牌!!!

        //检查位置*
        if (this.checkPositon() === false) {
            gameMessage.info(this.tableId, this.no, "xxx> start --> checkPositon --> currnet position is invalid!");
            let _c = setTimeout(() => {
                clearTimeout(_c);
                this.clear();
                let restart = true;
                this.start(restart);
            }, 100);
            gameMessage.print_table_info(this);
            loggerDefault.error("checkPositon => restart!!!");
            return;
        }
        //检查位置*

        //发送玩家信息
        let _table_begin_log = gameMessage.table_info(this);
        let exceptSocketMap = {};
        let playing_money = 0;
        let no_playing_money = 0;
        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null) {
                exceptSocketMap[player.socket_id] = true;
                if (player.playerState === PLAYER_STATE.PLAYING) {
                    playing_money = playing_money + player.init_balance;

                    //成功上桌 => 做一些清理工作
                    player.todo.toSitOut = false; //所有参与本手游戏的玩家都取消 【站起】 相关操作
                    player.todo.toSeatBack = false; //所有参与本手游戏的玩家都取消 【回桌】 相关操作
                    player.todo.toAutoBB = false; //所有参与本手游戏的玩家都取消 【自动补盲】 相关操作
                    player.sitOutTs = 0; //刚上桌成功不存在站起时限
                    player.buyInTs = 0; //刚上桌成功不存在买入等待时限
                } else {
                    if (player.init_balance > 0) no_playing_money = no_playing_money + player.init_balance;
                }
                //向桌上玩家(无论游戏状态)单独推送玩家信息
                _table_begin_log.data.yourSeatNo = player.seatNo;
                _table_begin_log.data.yourHandCards = player.handCards;
                _table_begin_log.data.yourTodo = player.todo;
                this.sendMsg(player.socket_id, _table_begin_log);
            }
        })

        //向其他观战玩家广播信息
        _table_begin_log.data.yourSeatNo = -1;
        _table_begin_log.data.yourHandCards = [];
        _table_begin_log.data.yourTodo = {};
        this.boradcastMsgExcept(_table_begin_log, exceptSocketMap);

        this.gameInfo.initCountPlayers = total_players;
        //打印牌桌状态
        gameMessage.info(this.tableId, this.no, "<<< @ " + this.tableId + " # " + this.no + " start >>> playing_money = " + playing_money / 1e6 + "TRX no_playing_money = " + no_playing_money / 1e6 + "TRX");
        gameMessage.print_table_info(this);
        let hot_money = this.getStatisticsInfo(false);
        if (playing_money + no_playing_money !== hot_money) {
            this.getStatisticsInfo();
            gameMessage.error(this.tableId, this.no, "[ERROR]WTF!!! Show me the money!!! playing_money(" + playing_money / 1e6 + "TRX) + no_playing_money(" + no_playing_money / 1e6 + "TRX) !== hot_money(" + hot_money / 1e6 + "TRX)");
        }

        //开始游戏
        let t = setTimeout(() => {
            clearTimeout(t);
            this.gotoNextRound();
        }, 1000);
    };
    newPosition() {
        let count = this.getCountPlayersByState(PLAYER_STATE.PLAYING);
        if (count <= 3) return; //小于3个人特殊位置，按照既定位置即可
        let POSITION_NAME_ARR = POSITION_NAME[count];

        let btn = this.getPlayerByPosition("BTN");
        let idx = 0;
        this.allSeats.findNextNode(btn, (o) => {
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.PLAYING) {
                player.position = POSITION_NAME_ARR[idx];
                idx++;
                player.actionIdx = idx;
            }
        })
    }
    init() {
        this.onRoundBegin(ROUND_TYPE.INIT, []);
        //自动下前注!!!
        let ante = this.config.ante || 0;
        if (ante > 0) {
            this.autoAnte();
        } else {
            this.emit('action_complete', this.roundInfo.roundIndex);
        }
        //自动下前注!!!
    };
    preFlop() {
        this.onRoundBegin(ROUND_TYPE.PRE_FLOP, []);

        //自动下盲注!!!
        let isAllDone = this.autoBlind();
        if (isAllDone === true) {
            this.emit('action_complete', this.roundInfo.roundIndex);
            return true
        }
        //自动下盲注!!!

        let firstActor = this.getFirstActor();
        this.waitActor(firstActor);
    };
    checkPositon() {
        let bbSeat = this.getPlayerByPosition("BB", false);
        if (bbSeat == null) {
            loggerDefault.error("checkPositon-->bbSeat is null")
            gameMessage.info(this.tableId, this.no, "checkPositon-->bbSeat is null");
            return false;
        }
        let nextOfBBSeat = this.getNextPosition(bbSeat, true);
        if (nextOfBBSeat == null) {
            loggerDefault.error("checkPositon-->next positon of bbSeat is null");
            gameMessage.info(this.tableId, this.no, "checkPositon-->next positon of bbSeat is null");
            return false;
        }
        let btnSeat = this.getPlayerByPosition("BTN", false);
        if (btnSeat == null) {
            loggerDefault.error("checkPositon-->btnSeat is null");
            gameMessage.info(this.tableId, this.no, "checkPositon-->btnSeat is null");
            return false;
        }
        let nextOfBTNSeat = this.getNextPosition(btnSeat, true);
        if (nextOfBTNSeat == null) {
            loggerDefault.error("checkPositon-->next position of btnSeat is null");
            gameMessage.info(this.tableId, this.no, "checkPositon-->next position of btnSeat is null");
            return false;
        }
        return true;
    }
    getFirstActor() { //从bb后查找第一个非straddle玩家
        let bbSeat = this.getPlayerByPosition("BB", false);
        let nextOfBBSeat = this.getNextPosition(bbSeat, true);
        // while (nextOfBBSeat.data.player.thisRoundOp === OP_TYPE.STRADDLE) {
        //     nextOfBBSeat = this.getNextPosition(nextOfBBSeat, true);
        // }
        if (nextOfBBSeat == null) {
            this.checkPositon();
        }
        return nextOfBBSeat.data.player;
    }
    getRoundFirstActor() {
        let btnSeat = this.getPlayerByPosition("BTN", false);
        let nextOfBtnSeat = this.getNextPosition(btnSeat, true);
        if (nextOfBtnSeat == null) {
            gameMessage.info(this.tableId, this.no, "getRoundFirstActor --> WTTTTTTTTTFFFFFFFFFFFFFFFFF");
            this.gotoNextRound();
            return null;
        }
        if (nextOfBtnSeat == null) {
            this.checkPositon();
        }
        return nextOfBtnSeat.data.player;
    }
    getNextActor(position) {
        let lastest_node = this.getPlayerByPosition(position, false);
        return this.allSeats.findNextNode(lastest_node, (o) => {
            let player = o.data.player;
            if (player != null && player.canAct() === true) {
                return true;
            }
        });
    }
    waitActor(actor, operateSec) {
        if (actor == null) return;

        //立刻设置当前行动者*
        this.roundInfo.curActorUid = actor.uid;

        if (actor.foldAndExitASAP === true) { //尽快离桌=>马上fold
            this.playerBet(actor.uid, 0);
            return;
        }
        if (actor.robot === true) {
            this.playerBet(actor.uid, 0);
            return;
        }

        if (this.clock != null) clearTimeout(this.clock);

        let _next_actor_log = gameMessage.next_actor(this.tableId, this.no, actor.toLog(this.roundInfo.roundIndex));
        let _log_data = _next_actor_log.data.player;
        _log_data.timeBank = actor.getTimeBankCountDown(DEFAULT_TIME_BANK_RESET_CD);
        operateSec = operateSec || DEFAULT_OPERATE_SEC;
        _log_data.ms = operateSec;
        this.boradcastMsg(_next_actor_log);

        actor.operateDeadLine = _.now() + operateSec;
        actor.operateSec = operateSec;
        this.clock = setTimeout(() => {
            this.emit('action_time_out', actor.uid);
        }, operateSec);
    }
    flop() {
        //切牌
        let burnCard = this.pokersMgr.takeCards(1);
        // gameMessage.info(this.tableId,this.no,"切牌>>>");

        //发三张翻牌
        let flop_cards = this.pokersMgr.takeCards(3);
        flop_cards[0].idx = 0;
        flop_cards[1].idx = 1;
        flop_cards[2].idx = 2;
        this.gameInfo.communityCards = flop_cards;

        this.onRoundBegin(ROUND_TYPE.FLOP, flop_cards);

        let countCompleted = this.getCountCompleted();
        if (countCompleted < 2) {
            let x = setTimeout(() => {
                clearTimeout(x);
                // this.emit("round_end", this.roundInfo.roundIndex);
                this.emit("action_complete");
            }, 1000);
            return;
        }

        let round_first_player = this.getRoundFirstActor();
        this.waitActor(round_first_player);
    };
    turn() {
        //切牌
        let burnCard = this.pokersMgr.takeCards(1);
        // gameMessage.info(this.tableId,this.no,"切牌>>>");

        //发一张转牌
        let turn_card = this.pokersMgr.takeCards(1);
        turn_card[0].idx = 3;
        this.gameInfo.communityCards.push(turn_card[0]);

        this.onRoundBegin(ROUND_TYPE.TURN, turn_card);

        let countCompleted = this.getCountCompleted();
        if (countCompleted < 2) {
            let x = setTimeout(() => {
                clearTimeout(x);
                // this.emit("round_end", this.roundInfo.roundIndex);
                this.emit("action_complete");
            }, 1000);
            return;
        }

        let round_first_player = this.getRoundFirstActor();
        this.waitActor(round_first_player);
    };
    river() {
        //切牌
        let burnCard = this.pokersMgr.takeCards(1);
        // gameMessage.info(this.tableId,this.no,"切牌>>>");

        //发一张河牌
        let river_card = this.pokersMgr.takeCards(1);
        river_card[0].idx = 4;
        this.gameInfo.communityCards.push(river_card[0]);

        //荷官操作完毕
        this.onRoundBegin(ROUND_TYPE.RIVER, river_card);

        let countCompleted = this.getCountCompleted();
        if (countCompleted < 2) {
            let x = setTimeout(() => {
                clearTimeout(x);
                // this.emit("round_end", this.roundInfo.roundIndex);
                this.emit("action_complete");
            }, 1000);
            return;
        }

        let round_first_player = this.getRoundFirstActor();
        this.waitActor(round_first_player);
    };
    tableShowCards(just_show_volunteer) {
        let score = 0;
        let showdown_begin_at_position = this.gameInfo.lastestAttackerPosition;
        if (_.isEmpty(showdown_begin_at_position)) {
            if (this.gameInfo.initCountPlayers === 2) {
                showdown_begin_at_position = "BB";
                gameMessage.info(this.tableId, this.no, "===> 两人桌，无最后激进者，从BB开始秀牌");
            } else {
                showdown_begin_at_position = "SB";
                gameMessage.info(this.tableId, this.no, "===> 多人桌，无最后激进者，从SB开始秀牌");
            }
        }
        let _seat = this.getPlayerByPosition(showdown_begin_at_position); //从最后激进者开始秀牌
        if (_seat != null && _seat.data.player != null) {
            gameMessage.info(this.tableId, this.no, "===> 最后激进者 = " + showdown_begin_at_position + "(" + _seat.data.player.uname + ")");
        } else {
            gameMessage.info(this.tableId, this.no, "===> 无法找到最后激进者 --> " + showdown_begin_at_position);
        }

        let _cards_info = [];
        let resultMap = {};
        this.allSeats.findAllFromMe(_seat, (o) => {
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.PLAYING && player.handCards != null) {
                let hitInfo = calculator.calc(player.handCards, this.gameInfo.communityCards);
                if (just_show_volunteer === true) {
                    if (
                        (player.handCards[0].show !== true && player.todo.toShowLeft === true)
                        || (player.handCards[1].show !== true && player.todo.toShowRight === true)
                    ) {
                        gameMessage.info(this.tableId, this.no, "===> 玩家主动秀牌 " + player.position + "(" + player.uname + ") show:" + player.todo.toShowLeft + "/" + player.todo.toShowRight);
                        _cards_info.push(player.playerShowCards(SHOW_DOWN_TYPE.SHOW_POKER, hitInfo));
                    }
                } else {
                    if (player.thisRoundOp === OP_TYPE.ALLIN || player.callAllIn === true) {
                        if (this.endEarly === true) {
                            _cards_info.push(player.playerShowCards(SHOW_DOWN_TYPE.ALL_IN, hitInfo));
                        } else {
                            gameMessage.info(this.tableId, this.no, "===> SHOWNDOWN ===> ALLIN ===> ?");
                            if (hitInfo.score >= score) {
                                score = hitInfo.score;
                                gameMessage.info(this.tableId, this.no, "===> SHOWNDOWN ===> ALLIN ===> SHOW_DOWN");
                                _cards_info.push(player.playerShowCards(SHOW_DOWN_TYPE.SHOW_DOWN, hitInfo));
                            } else {
                                gameMessage.info(this.tableId, this.no, "===> SHOWNDOWN ===> ALLIN ===> MUCK");
                                _cards_info.push(player.playerShowCards(SHOW_DOWN_TYPE.MUCK, hitInfo));
                            }
                        }
                    } else if (player.thisRoundOp === OP_TYPE.FOLD) {
                        _cards_info.push(player.playerShowCards(SHOW_DOWN_TYPE.FOLD, hitInfo));
                    } else if (hitInfo.score >= score) {
                        score = hitInfo.score;
                        _cards_info.push(player.playerShowCards(SHOW_DOWN_TYPE.SHOW_DOWN, hitInfo));
                    } else {
                        _cards_info.push(player.playerShowCards(SHOW_DOWN_TYPE.MUCK, hitInfo));
                    }
                    // if (
                    //     (player.handCards[0].show !== true && player.todo.toShowLeft === true)
                    //     || (player.handCards[1].show !== true && player.todo.toShowRight === true)
                    // ) {
                    //     gameMessage.info(this.tableId, this.no, "===> 玩家主动秀牌 ---------->" + player.position + "(" + player.uname + ") show:" + player.todo.toShowLeft + "/" + player.todo.toShowRight);
                    //     _cards_info.push(player.playerShowCards(SHOW_DOWN_TYPE.SHOW_POKER, hitInfo));
                    // }
                }
                if (player.thisRoundOp !== OP_TYPE.FOLD && player.live === true) {
                    resultMap[player.uid] = { uid: player.uid, uname: player.uname, score: hitInfo.score, value: 0, needTwoHandCards: hitInfo.needTwoHandCards, hitType: hitInfo.type, hitCards: hitInfo.hitCards }
                    player.lastScore = hitInfo.score; //sng
                } else {
                    player.lastScore = 0; //sng
                }
            }
        })

        let _show_cards_logs = gameMessage.show_cards_log(this.tableId, this.no, _cards_info);
        this.boradcastMsg(_show_cards_logs);
        return resultMap;
    }
    showdown(just_show_volunteer) {
        if (this.roundInfo.roundIndex !== ROUND_TYPE.SHOWDOWN) this.roundInfo.roundIndex = ROUND_TYPE.SHOWDOWN;
        this.onRoundBegin(ROUND_TYPE.SHOWDOWN, []);

        let resultMap = this.tableShowCards(just_show_volunteer);
        this.pot.calcResult(resultMap);

        // payout
        let gameResult = [];
        let sidePots = this.pot.sidePots;
        for (let i = 0; i < sidePots.length; i++) {
            let pot = sidePots[i];
            if (pot.value <= 0) break;
            let winners = pot.winners;
            for (let j = 0; j < winners.length; j++) {
                let _winner = winners[j];
                let uid = _winner.uid;
                let value = _winner.value;
                let player = this.getPlayerByUID(uid);
                if (player == null) continue;
                _winner.seatNo = player.seatNo;
                //statistics
                let _x = gameResult[uid];
                if (_x == null) {
                    _x = { seatNo: player.seatNo, value: value }
                    gameResult[uid] = _x;
                } else {
                    gameResult[uid].value = gameResult[uid].value + value;
                }
            }
        }

        let db_logs = [];
        let _table_id = this.tableId;
        let _no = this.no;
        this.allSeats.findAll(null, (o) => {
            let _p = o.data.player;
            if (_p != null && _p.playerState === PLAYER_STATE.PLAYING) {
                let _val = gameResult[_p.uid] == null ? 0 : gameResult[_p.uid].value;

                let ret = _p.complete(_val, 0, this.config.smallBlind); //SNG 游戏中不抽水 => feeRate = 0;
                // let ret = _p.complete(_val, this.config.feeRate, this.config.smallBlind);
                ret.tableId = _table_id;
                ret.no = _no;

                // //抽水结果 => 总奖池/彩池
                // let fee = ret.fee;
                // if (fee > 0) {
                //     LobbyInstance.addTotalFee(fee);
                //     this.onJackpotChanged();
                // }
                db_logs.push(ret);

                if (_p.handCards != null && _p.handCards.length >= 2) {
                    let leftCard = _p.handCards[0];
                    let rightCard = _p.handCards[1];

                    if (leftCard.show !== true && _p.todo.toShowLeft === true) {
                        let _simple_cards_log = gameMessage.simple_cards_log(this.tableId, this.no, _p.seatNo, leftCard);
                        this.boradcastMsg(_simple_cards_log);
                    }

                    if (rightCard.show !== true && _p.todo.toShowRight === true) {
                        let _simple_cards_log = gameMessage.simple_cards_log(this.tableId, this.no, _p.seatNo, rightCard);
                        this.boradcastMsg(_simple_cards_log);
                    }
                }
            }
        })

        //jackpot
        if (this.gameInfo.communityCards.length >= 5 && this.getCountLive() >= 2) {
            let sortedPlayersByScore = _.orderBy(resultMap, ['score'], ['desc']);
            for (let x = 0; x < sortedPlayersByScore.length; x++) {
                let _p = sortedPlayersByScore[x];
                let hitType = _p.hitType;
                let hitCards = _p.hitCards;
                let needTwoHandCards = _p.needTwoHandCards || false;
                let jack_pot_rate = JACKPOT_RATE(hitType);
                // let bb_lv_rate = BB_LV_RATE(this.config.bigBlind);
                let bb_lv_rate = BB_LV_RATE((this.sng.basic_sb || 2e6) * 2);
                gameMessage.info(this.tableId, this.no, "player hit jackpot? jack_pot_rate = " + jack_pot_rate + " bb_lv_rate = " + bb_lv_rate + " needTwoHandCards " + needTwoHandCards + " hitCards = " + hitCards.length);
                if (jack_pot_rate > 0 && needTwoHandCards === true && hitCards.length >= 5) { //胜出,可奖励牌型,手持两牌,牌数>=5
                    let _hit_hex = "0x";
                    for (let i = 0; i < 5; i++) {
                        let _card = hitCards[i];
                        let color = "1";
                        switch (_card.style) {
                            case 's':
                                color = "1";
                                break;
                            case 'h':
                                color = "2";
                                break;
                            case 'c':
                                color = "3";
                                break;
                            case 'd':
                                color = "4";
                                break;
                        }
                        _hit_hex = _hit_hex + color + _card.point.toString(16);
                    }
                    if (_hit_hex.length !== 12) {
                        gameMessage.error(this.tableId, this.no, "hitCards error" + _hit_hex);
                    } else {
                        gameMessage.info(this.tableId, this.no, "中奖啦！！！" + _p.uid + " 命中 = " + CARDS_TYPE_TOSTRING(hitType).en + " cards_hex = " + _hit_hex);
                        let jackpot_val = LobbyInstance.getCanWinJackpot(hitType, this.config.bigBlind);
                        let _msg = { tableId: this.tableId, no: this.no, uname: _p.uname, uid: _p.uid, cards_hex: _hit_hex, cards_type: hitType, jackpot_val: jackpot_val }
                        this.sendJackpotMessage(JSON.stringify(_msg));
                        LobbyInstance.winJackpot(_p.uid, this.tableId, this.no, _hit_hex, hitType, this.config.bigBlind);
                    }
                }
            }
        } else {
            gameMessage.info(this.tableId, this.no, "提前结束！无需判断Jackpot!");
        }
        //jackpot

        logService.addRevenueArrayLog(db_logs);
        logService.saveStatisticsLogs(db_logs); //保存有效下注,赔付等信息,用以挖矿

        this.gameInfo.gameResult = gameResult;
        let show_down_log = gameMessage.show_down(this.tableId, this.no, this.pot.sidePots, this.pot.pot, this.pot.lastPot);
        this.boradcastMsg(show_down_log);

        this.saveHistory();
        this.stop();
    }
    saveHistory() {
        let result = []
        this.allSeats.findAll(null, (o) => {
            let _player = o.data.player;
            if (_player != null && _player.playerState === PLAYER_STATE.PLAYING) {
                let ret = {
                    position: _player.position,
                    seatNo: _player.seatNo,
                    uid: _player.uid,
                    uname: _player.uname,
                    cards: _player.handCards,
                    show_down_type: _player.show_down_type,
                    win: _player.win,
                    fee: _player.fee,
                    toShowLeft: _player.todo.toShowLeft,
                    toShowRight: _player.todo.toShowRight,
                };
                result.push(ret);
            }
        })
        result = _.sortBy(result, (o) => { return -o.win });
        let _log = {
            type: "gameResult",
            pot: this.pot.pot,
            countPlayers: this.getCountLive(),
            communityCards: this.gameInfo.communityCards,
            result: result,
        }
        this.saveLogs(_log);

        gameMessage.info(this.tableId, this.no, "------------------------ SAVE HISTORY ------------------------");
        let _champion = result[0];
        let _table_history_list = [];
        let _cards = [];
        // if (this.endEarly === true) {
        if (_champion != null && _champion.cards != null && _champion.cards[0] != null && _champion.cards[0].show === true) { _cards.push(_champion.cards[0]) }
        if (_champion != null && _champion.cards != null && _champion.cards[1] != null && _champion.cards[1].show === true) { _cards.push(_champion.cards[1]) }
        // } else {
        //     _cards = _champion.cards;
        // }
        if (_champion != null) {
            gameMessage.info(this.tableId, this.no, "===> champion => " + _champion.position + "(" + _champion.uname
                + "); seat_no = " + _champion.seatNo + "; uid = " + _champion.uid + "; win = " + (_champion.win / 1e6) + "TRX; fee = " + (_champion.fee / 1e6) + "TRX");
        }
        let _history_title = {
            gameId: this.tableId + "-" + this.no,
            tableId: this.tableId, //index查询
            no: this.no,
            championCards: _cards,
            communityCards: this.gameInfo.communityCards,
            champion: _champion == null ? "" : _champion.uname,
            pot: this.pot.pot
        }
        _table_history_list.push(_history_title);

        dbService.saveHistoryList(_history_title);
        this.boradcastHistoryOne(_table_history_list); //全房间广播本手结果

        let _save_obj = {
            gameId: this.tableId + "-" + this.no,
            logs: this.history
        }
        dbService.saveHistoryDetail(_save_obj);
    }
    getHistoryList(socket_id, tableId, count) {
        dbService.getHistoryList(tableId, count, (res, err) => {
            if (res != null && err == null) {
                this.sendHistoryList(socket_id, res);
            }
        });
    }
    getAllChat(socket_id) {
        this.sendChatLogs(socket_id, this.chatLogs);
    }
    async getHistoryDetail(socket_id, reqUid, tableId, no) {
        let _save_obj = await dbService.getHistoryDetail(tableId, no);
        if (_save_obj == null) return;
        let _logs = _save_obj.logs;
        let ret = gameMessage.to_simple_history(_logs, reqUid);
        if (ret == null) return;
        this.sendHistoryDetail(socket_id, ret);
    }
    stop() {
        let t = setTimeout(() => {
            clearTimeout(t);
            this.clear();

            //特殊情况：先加钱再踢走
            this.dealConfirmedOrders();
            //
            if (this.tableState === TABLE_STATE.STOP) {
                // this.gameover();
            } else {
                let q = setTimeout(() => {
                    clearTimeout(q);
                    this.start();
                }, 1000);
            }

            let rank_info = this.getRankInfo();
            this.sng.result = rank_info;
            this.sendRankInfo(rank_info, null, false); //单局结束推送排行榜
        }, 5000);
    };
    saveLogs(_log) {
        this.history.push(_log);
    }
    clear() {
        let _now = _.now();
        this.tableState = TABLE_STATE.CLEARING;
        this.clearTs = _.now(); //标识清理时间，以防清理超时！！！*
        gameMessage.print_table_info(this);
        this.history = [];
        this.pot.clear();
        this.roundInfo.clear();
        this.endEarly = false;

        this.gameInfo.initCountPlayers = 0;
        this.gameInfo.communityCards = [];
        this.gameInfo.gameResult = [];
        this.gameInfo.lastestAttackerPosition = "";

        let all_money = 0;
        let all_fee = 0;
        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.PLAYING) {
                all_fee = all_fee + player.fee;
                let foldAndExitASAP = player.foldAndExitASAP
                let needSitOut = player.clear(_now);
                if (needSitOut === true) {
                    this.sitOutNextHand(player.uid);
                }
                all_money = all_money + player.init_balance;
                if (foldAndExitASAP === true) { //避免踢出后，人数不足，无法正确判断牌桌状态CanBegin,tableState为clearing*
                    this.kickOut(player);
                }
            }
        })

        this.statistics.table_fee = this.statistics.table_fee + all_fee;

        let _table_end_log = gameMessage.table_end(this.tableId, this.no, this.tableState, all_money, all_fee, this.config.endTs);
        this.boradcastMsg(_table_end_log);

        this.checkCountPlayer();

        if (this.config.endTs > 0 && _.now() > this.config.endTs) {
            this.tableState = TABLE_STATE.STOP;
        }

        dbService.saveTable(this.tableId, this.toDocument());
    }
    canSeat(seatNo) {
        let seat = this.allSeats[seatNo];
        if (seat == null || seat.player != null) return false;
        return true;
    }
    getSeat(_seatNo) {
        let node = this.allSeats.find((o) => {
            return o.data.seatNo === _seatNo;
        });
        if (node == null) return null;
        return node.data;
    }
    getNodeBySeatNo(_seatNo) {
        return this.allSeats.find((o) => {
            return o.data.seatNo === _seatNo;
        });
    }
    getPlayerByUID(uid) {
        let obj = this.allSeats.findAll(null, (o) => {
            let _player = o.data.player;
            return (_player != null && _player.uid === uid);
        });
        if (obj != null) return obj.data.player;
        return null;
    }
    getPlayerByUName(uname) {
        let obj = this.allSeats.findAll(null, (o) => {
            let _player = o.data.player;
            return (_player != null && _player.uname === uname);
        });
        if (obj != null) return obj.data.player;
        return null;
    }
    moveBtn(pre_btn_seat) {
        let new_btn_seat = this.allSeats.findAll(pre_btn_seat, (o) => { //优先上轮游戏玩家中最靠近BTN位的玩家成为BTN
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.PLAYING && player.getBalance() > 0 && player.justComingBack === false) {
                return true;
            }
        })
        if (new_btn_seat == null) { //上轮玩家全部离桌则以最靠近上一次BTN位的新上玩家为BTN
            new_btn_seat = this.allSeats.findAll(pre_btn_seat, (o) => {
                let player = o.data.player;
                if (player != null && player.playerState === PLAYER_STATE.WAITING && player.getBalance() > 0) {
                    return true;
                }
            })
        }
        if (new_btn_seat != null) {
            new_btn_seat.data.player.playerState = PLAYER_STATE.PLAYING;
            new_btn_seat.data.player.position = "BTN";
        }
        return new_btn_seat;
    }
    moveSmallBlind(new_btn_seat) {
        let new_sb_seat = this.allSeats.findNextNode(new_btn_seat, (o) => {
            let player = o.data.player;
            if (player != null && (player.playerState === PLAYER_STATE.PLAYING) && player.getBalance() > 0) {
                return true;
            }
        })
        if (new_sb_seat == null) {
            new_sb_seat = this.allSeats.findNextNode(new_btn_seat, (o) => {
                let player = o.data.player;
                if (player != null && player.playerState === PLAYER_STATE.WAITING && player.getBalance() > 0) {
                    return true;
                }
            })
        }
        if (new_sb_seat != null) {
            new_sb_seat.data.player.playerState = PLAYER_STATE.PLAYING;
            new_sb_seat.data.player.position = "SB";
        }
        return new_sb_seat;
    }
    moveBigBlind(new_sb_seat, new_btn_seat) {
        let new_bb_seat = this.allSeats.findFromTo(new_sb_seat, new_btn_seat, (o) => { //从当前SB与BTN之间查找大盲
            let player = o.data.player;
            if (player != null) {
                if (player.playerState === PLAYER_STATE.LEFT) {  //错过大盲
                    player.missBB = true;
                }
                if ((player.playerState === PLAYER_STATE.PLAYING || player.playerState === PLAYER_STATE.WAITING) && player.getBalance() > 0) {  //顺延大盲
                    return true;
                }
                return false;
            }
        })
        if (new_bb_seat == null) {
            new_bb_seat = this.allSeats.findFromTo(new_sb_seat, new_btn_seat, (o) => {
                let player = o.data.player;
                if (player != null && player.playerState === PLAYER_STATE.WAITING && player.getBalance() > 0) {
                    return true;
                }
            })
        }
        if (new_bb_seat != null) {
            new_bb_seat.data.player.playerState = PLAYER_STATE.PLAYING;
            new_bb_seat.data.player.position = "BB";
        }
        return new_bb_seat;
    }
    moveAutoBB(new_bb_seat, new_btn_seat, needPay4MissBB = false) {
        this.allSeats.findFromTo(new_bb_seat, new_btn_seat, (o) => { //从当前BB与BTN之间查找补盲上桌
            let player = o.data.player;
            if (player != null) {
                if (player.playerState === PLAYER_STATE.WAITING && player.getBalance() > 0) {
                    if (needPay4MissBB === false) {
                        gameMessage.info(this.tableId, this.no, "===> 直接上桌 uanme = " + player.uname + "; uid = " + player.uid + "; seat_no = " + player.seatNo);
                        player.playerState = PLAYER_STATE.PLAYING;
                    } else if (needPay4MissBB === true && player.todo.toAutoBB === true) {  //需要补盲且愿意补大盲
                        gameMessage.info(this.tableId, this.no, "===> 补盲上桌 uanme = " + player.uname + "; uid = " + player.uid + "; seat_no = " + player.seatNo);
                        player.missBB = true;
                        player.playerState = PLAYER_STATE.PLAYING;
                    }
                }
            }
        })
    }
    sendHandCards() {
        let count_livers = this.getCountPlayersByState(PLAYER_STATE.PLAYING);
        let allHandCards = this.pokersMgr.dealCards(count_livers, 2);
        gameMessage.info(this.tableId, this.no, "===> deal hand cards to " + count_livers + " players, first send to position after btn");
        let btnSeat = this.getPlayerByPosition("BTN");
        let idx = 0;
        this.allSeats.findAll(btnSeat, (o) => {
            let _player = o.data.player;
            if (_player != null && _player.playerState === PLAYER_STATE.PLAYING) {
                _player.handCards[0] = { idx: 0, style: allHandCards[idx][0].style, point: allHandCards[idx][0].point, show: false };
                _player.handCards[1] = { idx: 1, style: allHandCards[idx][1].style, point: allHandCards[idx][1].point, show: false };
                idx = idx + 1;
            }
        })
    }
    autoAnte() {
        gameMessage.info(this.tableId, this.no, "===> autoAnte");
        let array_ante_logs = [];
        let isAllDone = false;
        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.PLAYING) {
                isAllDone = this.playerAutoBet(player.uid, "ANTE", array_ante_logs);
            }
        })
        if (isAllDone === true) {
            let _play_log = gameMessage.player_log(this.tableId, this.no, this.roundInfo.roundIndex, array_ante_logs, this.pot.pot + this.roundInfo.roundTotalBet);
            this.boradcastMsg(_play_log);
            this.emit('action_complete', this.roundInfo.roundIndex);
        }
    }
    autoBlind() {
        gameMessage.info(this.tableId, this.no, "===> autoBlind");
        let blind_logs = [];
        let isAllDone = false;
        if (this.gameInfo.initCountPlayers === 2) { //两人桌,BTN交小盲
            gameMessage.info(this.tableId, this.no, "===> autoBlind from BTN");
            gameMessage.info(this.tableId, this.no, "===> 两人桌,BTN交小盲");
            let btnPlayer = this.getPlayerByPosition("BTN").data.player;
            isAllDone = this.playerAutoBet(btnPlayer.uid, "SB", blind_logs);
            let bbPlayer = this.getPlayerByPosition("BB").data.player;
            isAllDone = this.playerAutoBet(bbPlayer.uid, "BB", blind_logs);
            if (isAllDone === false) {
                if (btnPlayer.getBalance() <= 0 || bbPlayer.getBalance() <= 0) {
                    isAllDone = true;
                }
            }
        } else {
            gameMessage.info(this.tableId, this.no, "===> autoBlind from SB");
            let _seat = this.getPlayerByPosition("BTN", true);
            this.allSeats.findNextNode(_seat, (o) => {
                let player = o.data.player;
                if (player != null && player.playerState === PLAYER_STATE.PLAYING) {
                    if (player.missBB === true) {
                        player.missBB = false;
                        isAllDone = this.playerAutoBet(player.uid, "MISSBB", blind_logs);
                    } else {
                        isAllDone = this.playerAutoBet(player.uid, player.position, blind_logs);
                    }
                }
            })
        }
        let _play_log = gameMessage.player_log(this.tableId, this.no, this.roundInfo.roundIndex, blind_logs, this.pot.pot + this.roundInfo.roundTotalBet);
        this.boradcastMsg(_play_log);
        return isAllDone;
    }
    playerBet(uid, value, sysFold) {
        if (value > 0 && this.roundInfo.roundIndex === ROUND_TYPE.PRE_FLOP && this.roundInfo.roundMaxBet === 0) {
            this.roundInfo.roundMaxBet = this.config.bigBlind; //初始设置翻前圈最大下注是大盲,避免大盲筹码不够时，call只需要很少筹码
        }
        let curActor = this.getPlayerByUID(this.roundInfo.curActorUid);
        if (curActor == null || curActor.uid !== uid) {
            gameMessage.info(this.tableId, this.no, "xxx> This is not your turn! uid = " + uid + " value = " + value + " this.roundInfo.curActorUid = " + this.roundInfo.curActorUid);
            return false;
        } else {
            this.roundInfo.curActorUid = ""; //*
        }
        if (this.tableState !== TABLE_STATE.PLAYING) {
            gameMessage.info(this.tableId, this.no, "cancel playerBet --> table is not playing");
            return;
        }
        let player = this.getPlayerByUID(uid);
        if (player != null) {
            let { log, round_bet, bet } = player.doBet(this.tableId, this.no, this.roundInfo.roundIndex, value, this.roundInfo.roundBetGroup, sysFold);
            this.onPlayerBet(round_bet, bet, player.position);
            log.auto = false;
            log.roundPot = this.roundInfo.roundTotalBet;
            log.totalPot = this.pot.pot + this.roundInfo.roundTotalBet;
            let _player_log = gameMessage.player_log(this.tableId, this.no, this.roundInfo.roundIndex, [log], this.pot.pot + this.roundInfo.roundTotalBet);
            this.boradcastMsg(_player_log);
        }
        let isOnlyOneLive = this.isOnlyOneLive(); //是否只剩一家活牌
        if (isOnlyOneLive === true) {
            this.emit('action_complete', this.roundInfo.roundIndex);
            return true;
        }

        let isAllDone = this.isActionDone(); //是否全部玩家都行动完毕

        if (isAllDone === true) {
            this.emit('action_complete', this.roundInfo.roundIndex);
            return true;
        } else {
            let nextSeat = this.getNextActor(player.position);
            this.waitActor(nextSeat.data.player);
            return false;
        }
    }
    getAutoBet(op) {
        switch (op) {
            case "ANTE": //前注
                4294967296000000
                return this.config.ante;
            case "SB": //小盲
                return this.config.smallBlind;
            case "BB": //大盲
                return this.config.bigBlind;
            case "STRADDLE": //抓盲
                return this.config.straddle;
            case "MISSBB": //补盲
                return this.config.bigBlind;
        }
    }
    playerAutoBet(uid, op, arrLogs) {
        if (this.tableState !== TABLE_STATE.PLAYING) {
            gameMessage.info(this.tableId, this.no, "cancel playerAutoBet --> table is not playing");
            return;
        }
        let player = this.getPlayerByUID(uid);
        let op_value = this.getAutoBet(op); //SNG
        if (player != null && op_value != null && op_value > 0) {
            if (player.init_balance <= op_value) {
                op = "ALLIN";
            }
            let { log, round_bet, bet } = player.autoBet(this.tableId, this.no, this.roundInfo.roundIndex, op, op_value, this.roundInfo.roundBetGroup);
            this.onPlayerBet(round_bet, bet, player.position);
            log.auto = true;
            log.roundPot = this.roundInfo.roundTotalBet;
            log.totalPot = this.pot.pot + this.roundInfo.roundTotalBet;
            if (arrLogs != null && _.isArray(arrLogs)) arrLogs.push(log);
        }
        return this.isActionDone();
    }
    //下注
    onPlayerBet(round_bet, bet, position) {
        if (this.clock != null) clearTimeout(this.clock);
        this.roundInfo.roundTotalBet = this.roundInfo.roundTotalBet + bet;
        if (round_bet > this.roundInfo.roundMaxBet) {
            this.roundInfo.roundMaxBet = round_bet;
            this.gameInfo.lastestAttackerPosition = position;
        }
    }
    getNextPlayer(uid) {
        let player = this.getPlayerByUID(uid);
        let seat = this.getNodeBySeatNo(player.seatNo);
        let nextPlayer = seat.next;
        return nextPlayer;
    }
    getPlayerByPosition(position, isLive) {
        return this.allSeats.findAll(null, (o) => {
            let _player = o.data.player;
            if (_player == null) return false;
            return _player.position === position && (isLive == null || isLive === false || _player.canAct());
        });
    }
    getNextPosition(node, isLive) {
        if (node == null || node.data.player == null) return null;
        let position = node.data.player.position;
        let seat = this.allSeats.findNextNode(node, (o) => {
            let _player = o.data.player;
            if (_player == null) return false;
            return _player.position !== position && (isLive == null || isLive === false || _player.canAct());
        });
        return seat;
    }
    isActionDone() {
        let waitingPlayer = this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null && player.isActionComplete(this.roundInfo.roundIndex, this.roundInfo.roundMaxBet) === false) {
                return true;
            }
        });
        return waitingPlayer === null ? true : false;
    }
    isOnlyOneLive() {
        let count_livers = 0;
        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.PLAYING && player.live === true) {
                count_livers = count_livers + 1;
            }
        })
        if (count_livers === 1) {
            return true;
        } else {
            return false;
        }
    }

    onPlayerBuyIn(uid, uname, photoIdx, seatNo, value) {//买入
        if (!this.canSeat(seatNo)) return false;
        this.allSeats[seatNo] = new Player(uid, uname, photoIdx, value)
    }

    //行动圈开始
    onRoundBegin(round_index, community_cards) {
        if (this.tableState !== TABLE_STATE.PLAYING) {
            gameMessage.info(this.tableId, this.no, "cancel onRoundBegin --> table is not playing");
            return;
        }
        let count_live = this.getCountLive(PLAYER_STATE.PLAYING);
        let _round_begin_log = gameMessage.round_begin_log(this.tableId, this.no, round_index, community_cards, count_live, this.pot.pot + this.roundInfo.roundTotalBet, this.pot.lastPot);
        this.boradcastMsg(_round_begin_log);
    }
    //行动圈结束
    onRoundEnd() {
        if (this.tableState !== TABLE_STATE.PLAYING) {
            gameMessage.info(this.tableId, this.no, "cancel onRoundEnd --> table is not playing");
            return;
        }
        let round_idx = this.roundInfo.roundIndex;
        //底池处理 / 玩家数据清理
        let round_total = 0;
        let count_live = 0;
        let count_move = 0;

        this.roundInfo.roundBetGroup = [];
        this.roundInfo.roundMaxBet = 0;
        this.roundInfo.roundTotalBet = 0;
        this.roundInfo.curActorUid = "";

        if (this.roundInfo.roundIndex != ROUND_TYPE.RIVER) { //非河牌圈,则本圈结束时清理最后激进者
            this.gameInfo.lastestAttackerPosition = "";
        }

        let bet_players = [];

        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.PLAYING) {
                let round_bet = player.allBets[round_idx];
                round_total = round_total + round_bet;

                if (round_bet != null && round_bet > 0) {
                    bet_players.push({ uid: player.uid, lastestBet: round_bet, opType: player.thisRoundOp });
                }
                player.onRoundEnd();
                if (player.live === true) count_live = count_live + 1;
                if (player.done === false) count_move = count_move + 1;
            }
        })

        //底池处理
        let pot_info = potHelper.dividePot(bet_players);
        let _returnInfo = null;
        if (pot_info.returnInfo != null && pot_info.returnInfo.length > 0) {
            let uid = pot_info.returnInfo[0].returnPlayer;
            let value = pot_info.returnInfo[0].returnValue;
            let player = this.getPlayerByUID(uid);
            player.returnBet(value);
            _returnInfo = { value: value, seatNo: player.seatNo, nowBalance: player.getBalance() }
        }

        this.pot.onRoundEnd(pot_info);
        gameMessage.info(this.tableId, this.no, "--------------------------------------------------------");
        //返还筹码
        if (_returnInfo != null) {
            let _return_bet_log = gameMessage.return_bet_log(this.tableId, this.no, _returnInfo);
            this.boradcastMsg(_return_bet_log);
            let t = setTimeout(() => {
                clearTimeout(t);
                let _round_end_log = gameMessage.round_end_log(this.tableId, this.no, this.roundInfo.roundIndex, count_live, count_move, this.pot.pot, this.roundInfo.roundTotalBet, this.pot.lastPot, this.pot.sidePots);
                this.boradcastMsg(_round_end_log);

                //底池处理
                if (count_live === 1) { //其他玩家全部fold
                    gameMessage.info(this.tableId, this.no, "===> 提前结束(有返回多余筹码)=>其他玩家全部fold");
                    let just_show_volunteer = true;
                    this.endEarly = true;
                    let n = setTimeout(() => {
                        clearTimeout(n);
                        this.showdown(just_show_volunteer);
                    }, 1200)
                } else if (count_live >= 1 && count_move <= 1) {
                    gameMessage.info(this.tableId, this.no, "===> 提前结束(有返回多余筹码)=>活牌>1; 可行动人数为1(用部分筹码 call all in) / 可行动人数为0（全部筹码 call all in)");
                    this.allSeats.findAll(null, (o) => {
                        let _p = o.data.player;
                        if (_p != null && _p.playerState === PLAYER_STATE.PLAYING && _p.live === true) {
                            _p.callAllIn = true;
                        }
                    })
                    let just_show_volunteer = false;
                    if (this.roundInfo.roundIndex != ROUND_TYPE.RIVER && this.endEarly === false) {
                        this.endEarly = true;
                        this.tableShowCards(just_show_volunteer); //仅仅allin的那一轮秀牌，之后的轮次忽略秀牌
                    }
                    this.emit("round_end", this.roundInfo.roundIndex);
                } else {
                    this.emit("round_end", this.roundInfo.roundIndex);
                }
            }, 1000);
        } else {
            let _round_end_log = gameMessage.round_end_log(this.tableId, this.no, this.roundInfo.roundIndex, count_live, count_move, this.pot.pot, this.roundInfo.roundTotalBet, this.pot.lastPot, this.pot.sidePots);
            this.boradcastMsg(_round_end_log);

            //底池处理
            if (count_live === 1) { //其他玩家全部fold
                gameMessage.info(this.tableId, this.no, "===> 提前结束(无多余筹码)=>其他玩家全部fold");
                let just_show_volunteer = true;
                this.endEarly = true;
                let t = setTimeout(() => {
                    clearTimeout(t);
                    this.showdown(just_show_volunteer);
                }, 1200)
            } else if (count_live >= 1 && count_move <= 1) {
                gameMessage.info(this.tableId, this.no, "===> 提前结束(无多余筹码)=>活牌>1,可行动人数为1(用部分筹码 call all in) / 可行动人数为0（全部筹码 call all in)");
                this.allSeats.findAll(null, (o) => {
                    let _p = o.data.player;
                    if (_p != null && _p.playerState === PLAYER_STATE.PLAYING && _p.live === true) {
                        _p.callAllIn = true;
                    }
                })
                let just_show_volunteer = false;
                if (this.roundInfo.roundIndex != ROUND_TYPE.RIVER && this.endEarly === false) {
                    this.endEarly = true;
                    this.tableShowCards(just_show_volunteer); //仅仅allin的那一轮秀牌，之后的轮次忽略秀牌
                }
                this.emit("round_end", this.roundInfo.roundIndex);
            } else {
                this.emit("round_end", this.roundInfo.roundIndex);
            }
        }
    }
    showCardsAllIn() {
        gameMessage.info(this.tableId, this.no, ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> all in cards");
        let _show_down_logs = [];
        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null && player.live === true) { //无论是否发牌结束，直接提前秀牌
                _show_down_logs.push(player.playerShowCards(SHOW_DOWN_TYPE.ALL_IN));
            }
        })
        this.boradcastMsg(_show_down_logs);
    }
    //进入下一圈
    gotoNextRound(init_rounde_index) {
        let roundIndex = init_rounde_index == null ? this.roundInfo.roundIndex : init_rounde_index + 1;
        this.roundInfo.roundIndex = roundIndex;
        switch (roundIndex) {
            case 0:
                this.init();
                break;
            case 1:
                this.preFlop();
                break;
            case 2:
                this.flop();
                break;
            case 3:
                this.turn();
                break;
            case 4:
                this.river();
                break;
            case 5:
                let t = setTimeout(() => {
                    clearTimeout(t);
                    this.showdown();
                }, 600); //摊牌圈延迟多600ms
                break;
            case 6:
                this.stop();
            //     break;
        }
    }
    //坐下
    sitDown(seatNo, uid, uname, photoIdx, socket, lv) {
        let seat = this.getSeat(seatNo);
        if (seat != null && seat.player != null) {
            gameMessage.info(this.tableId, this.no, "sitDown => 该座位已经有人 uid = " + uid + "; seat_no = " + seat);
            return -1;
        }

        if (this.config.maxPlayers <= this.getPlayersCount()) {
            gameMessage.info(this.tableId, this.no, "sitDown => 人数达到上限 " + this.config.maxPlayers);
            return -1;
        }

        let new_player = new playerInfo(uid, uname, photoIdx, lv, seatNo, socket);
        seat.player = new_player;
        this.allPlayers[uid] = new_player;

        new_player.playerState = PLAYER_STATE.CONFIRMING;

        new_player.buyInTs = _.now();
        let _seat_log = gameMessage.seatLog(this.tableId, this.no, seatNo, new_player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
        this.boradcastMsg(_seat_log);
        return seatNo;
    }

    sitDownQuiet(seatNo, uid, uname, photoIdx, lv, balance, totalBuyIn) {
        let seat = this.getSeat(seatNo);
        if (seat != null && seat.player != null) {
            gameMessage.info(this.tableId, this.no, "sitDownQuiet => 该座位已经有人 uid = " + uid + "; seat_no = " + seat);
            return -1;
        }

        let new_player = new playerInfo(uid, uname, photoIdx, lv, seatNo, 'AAAAAAAAAAAAAAAAAAAA');
        seat.player = new_player;
        this.allPlayers[uid] = new_player;

        new_player.playerState = PLAYER_STATE.LEFT; //避免被踢,注释掉
        new_player.todo.toSitOut = true; //避免被踢,注释掉
        new_player.todo.toSeatBack = false; //避免被踢,注释掉
        // new_player.buyInTs = _.now(); //避免被踢,注释掉
        new_player.init_balance = balance;
        new_player.totalBuyIn = totalBuyIn;
    }

    // 重入
    reSitDown(addr, ipAddr, socket) {
        let player = this.getPlayerByUID(addr);
        if (player == null || player.seatNo < 0) { return; }
        player.socket_id = socket.id;
        player.ipAddr = ipAddr;

        this.getTableInfo(socket.id, addr);
    }

    //仅服务端测试用
    buyIn(uid, value) {
        let player = this.getPlayerByUID(uid);
        if (player == null) {
            gameMessage.info(this.tableId, this.no, "buyIn --> 无法找到该玩家 uid = " + uid);
            return;
        }

        let seat = this.getSeat(player.seatNo);
        //测试用
        player.init_balance = value;
        //
        let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
        this.boradcastMsg(_seat_log);

        this.playerConfirm(uid, value);
    }
    //确认玩家入金 从链上获取数据触发
    playerConfirm(uid, value) {
        let player = this.getPlayerByUID(uid);
        if (player == null) {
            gameMessage.info(this.tableId, this.no, "playerConfirm --> 找不到玩家 --> uid = " + uid + " --> 无法入账");
            if (this.allPlayers[uid] != null) {
                gameMessage.info(this.tableId, this.no, "playerConfirm --> 在this.allPlayers所有玩家列表中找到玩家 --> uid = " + uid + " --> 尝试退款！");
            }
            return;
        }

        player.onCofirmed(value);

        this.statistics.table_buy_in = this.statistics.table_buy_in + value;
        gameMessage.info(this.tableId, this.no, "===> table_buy_in => + " + this.statistics.table_buy_in / 1e6 + "TRX");

        this.getStatisticsInfo();

        let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
        this.boradcastMsg(_seat_log);
        gameMessage.info(this.tableId, this.no, "------playerConfirm---- uid = " + uid + "; table_state = " + this.tableState);
        this.coldStart();

        return _seat_log;
    }
    coldStart() {
        gameMessage.info(this.tableId, this.no, "coldStart => 当前牌桌状态 = " + TABLE_STATE_TOSTRING(this.tableState).zh);
        if (this.tableState === TABLE_STATE.WAITING || this.tableState === TABLE_STATE.PAUSE) {
            let waitingPlayer = this.getCountPlayersByState(PLAYER_STATE.WAITING);
            let playingPlayer = this.getCountPlayersByState(PLAYER_STATE.PLAYING);
            let comingBackPlayer = this.getCountBackingPlayers();
            gameMessage.info(this.tableId, this.no, "waitingPlayer + playingPlayer + comingBackPlayer = " +
                (waitingPlayer + playingPlayer + comingBackPlayer)
                + "; waitingPlayer = " + waitingPlayer
                + "; playingPlayer = " + playingPlayer
                + "; comingBackPlayer = " + comingBackPlayer);
            if ((waitingPlayer + playingPlayer + comingBackPlayer) >= this.config.minPlayers) {
                this.start();
            }
        }
    }
    getCountCompleted() { //完成行动的人数
        let count = 0;
        this.allSeats.findAll(null, (o) => {
            // if (o.data.player != null && o.data.player.done === false) count = count + 1;
            if (o.data.player != null && o.data.player.canAct() === true && o.data.player.callAllIn !== true) count = count + 1;
        });
        return count;
    }
    getPlayersCount() {
        let count = 0;
        this.allSeats.findAll(null, (o) => {
            if (o.data.player != null) count = count + 1;
        });
        return count;
    }
    getCountPlayersByState(player_state) {
        let count = 0;
        this.allSeats.findAll(null, (o) => {
            if (o.data.player != null && o.data.player.playerState === player_state) {
                count = count + 1;
            }
        });
        return count;
    }
    getCountBackingPlayers() {
        let count = 0;
        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.LEFT && player.todo.toSeatBack === true && player.getBalance() > 0) count = count + 1;
        });
        return count;
    }
    //获取活牌数量
    getCountLive() {
        let count = 0;
        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null && player.playerState === PLAYER_STATE.PLAYING && player.live === true) count = count + 1;
        });
        return count;
    }
    count() {
        let count_seat_full = 0; //桌上总人数
        let count_seat_empty = 0;//桌上空座总数
        let count_player_waiting = 0; //正在游戏人数
        let count_player_playing = 0; //正在游戏人数
        let count_player_left = 0; //正在游戏人数
        let count_player_confirming = 0; //正在游戏人数
        let count_player_left = 0; //离座人数
        let count_round_moved = 0; //本轮已行动人数
        let count_round_completed = 0; //本轮已行动人数
        let count_hand_moved = 0; //本手已行动人数
        let count_hand_completed = 0; //本手已行动结束人数
        let count_live = 0; //本手游戏剩余活牌数
        this.allSeats.findAll(null, (o) => {
            let player = o.data.player;
            if (player != null) {
                count_seat_full = count_seat_full + 1;
                let playerState = player.playerState;
                switch (playerState) {
                    case PLAYER_STATE.WAITING:  //等待上桌
                        count_player_waiting = count_player_waiting + 1;
                        break;
                    case PLAYER_STATE.PLAYING: //游戏中
                        count_player_playing = count_player_playing + 1;
                        if (player.hadRoundMoved() === true) count_round_moved = count_round_moved + 1;
                        if (player.hadRoundCompleted() === true) count_round_completed = count_round_completed + 1;
                        if (player.hadHandMoved() === true) count_hand_moved = count_hand_moved + 1;
                        if (player.hadHandCompleted() === true) count_hand_completed = count_hand_completed + 1;
                        if (player.isLive() === true) count_live = count_live + 1;
                        break;
                    case PLAYER_STATE.LEFT: //已离开
                        count_player_left = count_player_left + 1;
                        break;
                    case PLAYER_STATE.CONFIRMING: //买入确认中
                        count_player_confirming = count_player_confirming + 1;
                        break;
                }

            } else {
                count_seat_empty = count_seat_empty + 1;
            }
        })
    }
    //站起
    sitOutNextHand(uid) {
        let player = this.getPlayerByUID(uid);
        if (player == null) return null;
        if (player.todo.toSitOut === false) { //正常情况 => 正在游戏，申请站起
            player.todo.toSitOut = true;
            player.todo.toSeatBack = false;
        }
        let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
        this.boradcastMsg(_seat_log);
        gameMessage.info(this.tableId, this.no, "===> sitOutNextHand => 即将站起 seat_no = " + player.seatNo + "; " + player.position + "(" + player.uname + ") playerState = " + PLAYER_STATE_TOSTRING(player.playerState).en);
    }
    //回桌
    backSeatNextHand(uid) {
        let player = this.getPlayerByUID(uid);
        if (player == null) return null;

        if (this.tableState !== TABLE_STATE.PLAYING && this.tableState !== TABLE_STATE.CLEARING) {
            gameMessage.info(this.tableId, this.no, "===> backSeatNextHand => 当前牌桌不能返回 seat_no = " + player.seatNo + "; " + player.position + "(" + player.uname + ") playerState = " + PLAYER_STATE_TOSTRING(player.playerState).en);
            return;
        }

        if (player.getBalance() <= 0) return null;
        if (player.todo.toSeatBack === false) { //正常情况 => 正在游戏，申请站起
            player.todo.toSeatBack = true;
            player.todo.toSitOut = false;
            this.coldStart();
        }
        let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
        this.boradcastMsg(_seat_log);
        gameMessage.info(this.tableId, this.no, "===> backSeatNextHand => 即将回桌 seat_no = " + player.seatNo + "; " + player.position + "(" + player.uname + ") playerState = " + PLAYER_STATE_TOSTRING(player.playerState).en);
    }
    //SNG回桌
    killRobot(uid) {
        let player = this.getPlayerByUID(uid);
        if (player == null) return null;
        if (player.getBalance() <= 0) return null;
        if (player.robot === true) { //正常情况 => 正在游戏，申请站起
            player.robot = false;
        }
        let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
        this.boradcastMsg(_seat_log);
        gameMessage.info(this.tableId, this.no, "===> killRobot => 即将回桌 seat_no = " + player.seatNo + "; " + player.position + "(" + player.uname + ") playerState = " + PLAYER_STATE_TOSTRING(player.playerState).en);
    }
    //正式站起
    sitOut(player) {
        if (player != null && player.playerState === PLAYER_STATE.PLAYING && player.todo.toSitOut === true) {
            player.playerState = PLAYER_STATE.LEFT;
            player.sitOutTs = _.now();
            player.todo.toSitOut = true;
            player.todo.toSeatBack = false;
            let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
            this.boradcastMsg(_seat_log);
            gameMessage.info(this.tableId, this.no, "===> sitOut => 站起成功! seat_no = " + player.seatNo + "; " + player.position + "(" + player.uname + "); 余额 = " + player.getBalance());
        }
    }
    //正式回桌
    comeBack(player) {
        if (player != null && player.playerState === PLAYER_STATE.LEFT && player.todo.toSeatBack === true) {
            player.playerState = PLAYER_STATE.PLAYING;
            player.sitOutTs = 0;
            player.todo.toSitOut = false;
            player.todo.toSeatBack = false;
            let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
            this.boradcastMsg(_seat_log);
            gameMessage.info(this.tableId, this.no, "===> comeBack => 回桌成功! seat_no = " + player.seatNo + "; " + player.position + "(" + player.uname + "); 是否错过大盲 = " + (player.missBB === true ? "是" : "否"));
        }
    }
    kickOut(player) {
        if (player == null) return;
        let seat = this.getSeat(player.seatNo);
        seat.player = null;
        gameMessage.info(this.tableId, this.no, "kickOut ==> uid = " + player.uid + " uname = " + player.uname);
        // 离桌&保存
        delete this.allPlayers[player.uid];
        dbService.saveTable(this.tableId, { allPlayers: this.toDocPlayers() });

        // 提款
        let balance = player.getBalance();
        player.init_balance = 0;

        this.statistics.table_withdrawl = this.statistics.table_withdrawl + balance;
        gameMessage.info(this.tableId, this.no, "===> table_withdrawl => - " + this.statistics.table_withdrawl / 1e6 + "TRX");
        this.getStatisticsInfo();

        let playerCnt = this.getPlayersCount();
        if (balance > 0) {
            if (LobbyInstance != null) LobbyInstance.kickOut(player.uid, this.tableId, this.no, balance, playerCnt, balance, 0);
        } else {
            if (LobbyInstance != null) LobbyInstance.kickOut(player.uid, this.tableId, this.no, 0, playerCnt, 0, 0);
        }

        let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, null, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
        this.boradcastMsg(_seat_log);

        gameMessage.info(this.tableId, this.no, "!!!!!!!!!!!! kick_out --> seat_no = " + seat.seatNo + "; " + player.position + "(" + player.uname + ")" + "; uid = " + player.uid);
    }
    //直接离桌
    playerExit(uid) { //SNG
        if (this.gameType !== GAME_TYPE.SNG) return;
        gameMessage.info(this.tableId, this.no, ">>>>>>>>>>>>>>>>>>尝试离座 uid = " + uid);
        let player = this.getPlayerByUID(uid);
        if (player == null) return null;
        //当前未上桌
        if (this.tableState === TABLE_STATE.WAITING || this.tableState === TABLE_STATE.STOP || this.tableState === TABLE_STATE.PAUSE) {
            gameMessage.info(this.tableId, this.no, "===> SNG未开始 => 立刻退桌 uid = " + uid + " name = " + player.uname);
            this.kickOut(player);
        } else {
            gameMessage.info(this.tableId, this.no, "===> SNG已开始 => 直到游戏结束无法强制退桌 uid = " + uid + " name = " + player.uname);
        }
    }
    waitingForBB(uid) {
        gameMessage.info(this.tableId, this.no, "===> 等待大盲，取消自动补盲 uid = " + uid);
        let player = this.getPlayerByUID(uid);
        if (player == null) return null;
        if (player.playerState === PLAYER_STATE.WAITING && player.todo.toAutoBB === true) {
            player.todo.toAutoBB = false;
            let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
            this.boradcastMsg(_seat_log);
            gameMessage.info(this.tableId, this.no, "===> 等待大盲，取消自动补盲 seat_no = " + player.seatNo + "; name = " + player.uname);
        }
    }
    cancelWaitingForBB(uid) {
        gameMessage.info(this.tableId, this.no, "===> 不等大盲，开启自动补盲 uid = " + uid);
        let player = this.getPlayerByUID(uid);
        if (player == null) return null;
        if (player.playerState === PLAYER_STATE.WAITING && player.todo.toAutoBB === false) {
            player.todo.toAutoBB = true;
            let _seat_log = gameMessage.seatLog(this.tableId, this.no, player.seatNo, player, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
            this.boradcastMsg(_seat_log);
            gameMessage.info(this.tableId, this.no, "===> 不等大盲，开启自动补盲 seat_no = " + player.seatNo + "; name = " + player.uname);
        }
    }
    showPoker(uid, idx) {
        let player = this.getPlayerByUID(uid);
        if (player == null || (idx !== 0 && idx !== 1)) return;
        if (idx === 0) {
            let leftCard = player.handCards[0];
            player.todo.toShowLeft = true;
            //若是showdown阶段可以直接秀牌
            if (this.roundInfo.roundIndex >= ROUND_TYPE.SHOWDOWN && leftCard.show !== true) {
                gameMessage.info(this.tableId, this.no, "===> [最后]秀牌 ===> " + player.position + "(" + player.uname + ") SHOW LEFT CARD");
                leftCard.show = true;
                let _simple_cards_log = gameMessage.simple_cards_log(this.tableId, this.no, player.seatNo, leftCard);
                this.boradcastMsg(_simple_cards_log);
            }
        }
        if (idx === 1) {
            let rightCard = player.handCards[1];
            player.todo.toShowRight = true;
            //若是showdown阶段可以直接秀牌
            if (this.roundInfo.roundIndex >= ROUND_TYPE.SHOWDOWN && rightCard.show !== true) {
                gameMessage.info(this.tableId, this.no, "===> [最后]秀牌 ===> " + player.position + "(" + player.uname + ") SHOW RIGHT CARD");
                rightCard.show = true;
                let _simple_cards_log = gameMessage.simple_cards_log(this.tableId, this.no, player.seatNo, rightCard);
                this.boradcastMsg(_simple_cards_log);
            }
        }
    }
    hidePoker(uid, idx) {
        let player = this.getPlayerByUID(uid);
        if (player == null || (idx !== 0 && idx !== 1)) return;
        if (idx === 0) player.todo.toShowLeft = false;
        if (idx === 1) player.todo.toShowRight = false;
    }
    timeMachine(uid) {
        let curActor = this.getPlayerByUID(this.roundInfo.curActorUid);
        if (curActor == null || curActor.uid !== uid) return;
        let _now = _.now();
        let operateSec = curActor.useTimeBank(DEFAULT_TIME_BANK_RESET_CD, DEFAULT_TIME_BANK_OPERATE_SEC);
        if (operateSec > 0) {
            gameMessage.info(this.tableId, this.no, "===> 使用时间银行 ===> " + curActor.position + "(" + curActor.uname + "); uid = " + uid + "; now = " + _now + "; sec = " + operateSec);
            this.waitActor(curActor, operateSec);
        }
    }
    chat(_from_addr, _to_addr, _content, _content_type) {
        //聊天限流
        let _now = _.now();
        let player = this.getPlayerByUID(_from_addr);
        if (player == null) return;
        let ts = player.chatTs || 0;
        ts = Number(ts || 0);
        if (ts - _now > 30000) {
            return;
        } else {
            let _tmp = _now > ts ? _now : ts;
            _tmp = _tmp + 5000;
            player.chatTs = _tmp;
        }

        let _to_name = _to_addr;
        let _to_lv = 1;
        let _msg_from_type = MESSAGE_FROM_TYPE.USER;
        let _chatInfo = new chatInfo(this.tableId, _from_addr, _to_addr, _content, _content_type, player.uname, player.lv, _to_name, _to_lv, _msg_from_type);
        _chatInfo.toString();
        let chatLogs = this.chatLogs;
        if (chatLogs.length >= 50) chatLogs.splice(0, 1);
        chatLogs.push(_chatInfo);

        GLOBAL_EVENT.emit('room', this.tableId, { title: 'chatInfo', content: _chatInfo });
    }

    chatVIP(_from_addr, _from_name, _from_lv, _to_addr, _content, _content_type) {
        let _to_name = "";
        let _to_lv = 1;
        let _msg_from_type = MESSAGE_FROM_TYPE.VIP;
        let _chatInfo = new chatInfo(this.tableId, _from_addr, _to_addr, _content, _content_type, _from_name, _from_lv, _to_name, _to_lv, _msg_from_type);
        _chatInfo.toString();

        let chatLogs = this.chatLogs;
        if (chatLogs.length >= 50) chatLogs.splice(0, 1);
        chatLogs.push(_chatInfo);

        if (_to_addr === "@all" || _content.indexOf("@all") > -1) {
            GLOBAL_EVENT.emit('broadcast', { title: 'chatInfo', content: _chatInfo });
        } else {
            GLOBAL_EVENT.emit('room', this.tableId, { title: 'chatInfo', content: _chatInfo });
        }
    }

    sendJackpotMessage(_content) {
        let _content_type = PLAYER_MESSAGE_TYPE.TEXT;
        let _from_addr = "SYSTEM";
        let _from_name = "SYSTEM";
        let _from_lv = 99;
        let _to_addr = "";
        let _to_name = "";
        let _to_lv = 1;
        let _msg_from_type = MESSAGE_FROM_TYPE.JACKPOT;
        let _chatInfo = new chatInfo(this.tableId, _from_addr, _to_addr, _content, _content_type, _from_name, _from_lv, _to_name, _to_lv, _msg_from_type);
        _chatInfo.toString();
        // let chatLogs = this.chatLogs;
        // if (chatLogs.length >= 50) chatLogs.splice(0, 1);
        // chatLogs.push(_chatInfo);

        GLOBAL_EVENT.emit('broadcast', { title: 'chatInfo', content: _chatInfo });
    }

    onJackpotChanged() {
        GLOBAL_EVENT.emit('broadcast', { title: 'jackpot', content: LobbyInstance.getJackpot() });
    }

    getRankInfo() {
        let _count_down_to_start = 0;
        let _count_down_to_shutdown = 0;
        if (this.tableState === TABLE_STATE.WAITING) {
            _count_down_to_start = this.config.startTs - _.now();
            _count_down_to_start = _count_down_to_start < 0 ? 0 : _count_down_to_start;
        } else {
            _count_down_to_shutdown = this.config.endTs - _.now();
            _count_down_to_shutdown = _count_down_to_shutdown < 0 ? 0 : _count_down_to_shutdown;
        }
        let ret = {
            startTs: this.config.startTs,
            endTs: this.config.endTs,
            countDownToStart: _count_down_to_start,
            countDown: _count_down_to_shutdown,
            tableId: this.tableId,
            no: this.no,
            table_buyin: this.config.maxBuyIn * this.config.maxPlayers,
            player_buyin: this.config.maxBuyIn,
            tableName: this.tableName,
            rank: []
        }
        let rank = [];
        this.allSeats.findAll(null, (o) => {
            let _player = o.data.player;
            if (_player != null) {
                rank.push(_player.getStatisticsInfo());
            }
        })
        rank = _.sortBy(rank, (o) => { //sng 按淘汰时间从大到小排列，余额从大到小排列
            // return -o.win;
            return - o.balance; //sng 按余额从大到小排名
        }, (o) => {
            return - o.lostTs; //sng 按淘汰时间从晚到早排名
        }, (o) => {
            return - o.lastScore; //sng 按秀牌时分数从大到小排名
        }, (o) => {
            return o.actionIdx; //sng 按秀牌位置从前到后排名（前位位置处于劣势）
        })
        for (let i = 1; i <= rank.length; i++) {
            rank[i - 1].rank = i;
            rank[i - 1].win = 0; //sng 比赛未结束时奖励都为0
            let _p = this.getPlayerByUID(rank[i - 1].uid);
            if (_p != null) {
                _p.sng_rank = i;
            }
        }
        ret.rank = rank;
        return ret;
    }

    sendRankInfo(ret, socket_id, gameover) {
        if (socket_id != null) {
            ret.gameover = gameover || false;
            gameMessage.info(this.tableId, this.no, "sendRankInfo");
            this.sendRankInfoToSocket(socket_id, ret);
        } else {
            ret.gameover = gameover || false;
            gameMessage.info(this.tableId, this.no, "boradcastRankInfo");
            this.boradcastRankInfo(ret);
        }
    }

    calcSNGAward(total_buyin) {
        let fee_rate = this.config.feeRate || 0;
        let _val = new bignumber(total_buyin);
        let payout = _val.times(1 - fee_rate).toNumber();
        let _fee = total_buyin - payout;
        gameMessage.info(this.tableId, this.no, "SNG牌桌 => 桌号:" + this.tableId + "局号:" + this.no + " 买入:" + this.config.maxBuyIn / 1e6 + " 最大人数:" + this.config.maxPlayers);
        gameMessage.info(this.tableId, this.no, "总买入 = " + total_buyin / 1e6 + "; 总赔付 = " + payout / 1e6 + "; 平台手续费 = " + _fee / 1e6 + "(手续费率:" + fee_rate + ")");

        let _rate = sng_config.SNG_AWARD_RATE["palyers_count_" + this.config.maxPlayers] || sng_config.SNG_AWARD_RATE.palyers_count_3; //3人桌只有第一名有奖励

        let _frist_rate = _rate[0] || 1;
        let _sec_rate = _rate[1] || 0;
        let _third_rate = _rate[2] || 0;

        gameMessage.info(this.tableId, this.no, "排名奖励比例 => 第一名:" + _frist_rate + " 第二名:" + _sec_rate + " 第三名:" + _third_rate);

        let _pay_out = new bignumber(payout);
        let first_val = _pay_out.times(_frist_rate).toNumber();
        let sec_val = _pay_out.times(_sec_rate).toNumber();
        let third_val = _pay_out.minus(first_val).minus(sec_val).toNumber();

        //console.log(total_buyin, payout, total_buyin, _frist_rate, _sec_rate, _third_rate, first_val, sec_val, third_val);

        if (first_val < 0) first_val = 0;
        if (sec_val < 0) sec_val = 0;
        if (third_val < 0) third_val = 0;

        let winners_count = 0;
        if (first_val > 0) winners_count = winners_count + 1;
        if (sec_val > 0) winners_count = winners_count + 1;
        if (third_val > 0) winners_count = winners_count + 1;

        let sng_award_info = {
            sng_fee_rate: fee_rate, //手续费率
            sng_fee: _fee, //手续费
            sng_total_buyin: total_buyin,//总买入
            sng_winners_count: winners_count,//钱圈人数
            sng_first_val: first_val,//第一名奖励
            sng_sec_val: sec_val,//第二名奖励
            sng_third_val: third_val,//第三名奖励
        }
        return sng_award_info;
    }

    setSNGAward(rank_info, sng_award_info) {
        let { sng_first_val, sng_sec_val, sng_third_val } = sng_award_info;
        let rank = rank_info.rank;
        if (rank[0] != null) {
            rank[0].balance = sng_first_val;
            rank[0].win = sng_first_val - rank[0].buyIn;
            let _first_player = this.getPlayerByUID(rank[0].uid);
            _first_player.init_balance = sng_first_val;
            gameMessage.info(this.tableId, this.no, "第一名奖励 = " + sng_first_val / 1e6);
        }
        if (rank[1] != null) {
            rank[1].balance = sng_sec_val;
            rank[1].win = sng_sec_val - rank[1].buyIn;
            let _sec_player = this.getPlayerByUID(rank[1].uid);
            _sec_player.init_balance = sng_sec_val;
            gameMessage.info(this.tableId, this.no, "第二名奖励 = " + sng_sec_val / 1e6);
        }
        if (rank[2] != null) {
            rank[2].balance = sng_third_val;
            rank[2].win = sng_third_val - rank[2].buyIn;
            let _third_player = this.getPlayerByUID(rank[2].uid);
            _third_player.init_balance = sng_third_val;
            gameMessage.info(this.tableId, this.no, "第三名奖励 = " + sng_third_val / 1e6);
        }
    }

    adminStart(sec = 10) {
        if (this.gameType === GAME_TYPE.CASH || this.tableState !== TABLE_STATE.WAITING) return;
        gameMessage.info(this.tableId, this.no, "===> 游戏开始时间=>" + sec + "秒后");
        this.config.startTs = _.now() + sec * 1000;
        let rank_info = this.getRankInfo();
        this.sendRankInfo(rank_info, null, false);
    }

    adminStop(sec = 10) {
        if (this.gameType === GAME_TYPE.CASH || this.tableState === TABLE_STATE.STOP) return;
        gameMessage.info(this.tableId, this.no, "===> 游戏结束时间=>" + sec + "秒后");
        this.config.endTs = _.now() + sec * 1000;
        if (this.config.endTs < this.config.startTs) {
            this.config.endTs = this.config.startTs + sec * 1000;
        }
        let rank_info = this.getRankInfo();
        this.sendRankInfo(rank_info, null, false);
    }

    getGodCards(socket_id, seatNo) {
        let seat = this.getNodeBySeatNo(seatNo);
        if (seat.data.player != null) {
            let handCards = seat.data.player.handCards;
            if (handCards != null && handCards.length === 2) {
                let cards = [];
                cards.push({ style: handCards[0].style, point: handCards[0].point, idx: 0 });
                cards.push({ style: handCards[1].style, point: handCards[1].point, idx: 1 });
                let ret = {
                    tableId: this.tableId,
                    seatNo: seatNo,
                    cards: cards
                }
                this.sendGodCards(socket_id, ret);
            }
        }
    }
    /////////////////////w/////////////////////

    // 支付相关
    _sendOrderMsg(order, status) {
        let realPlayer = this.getPlayerByUID(order.addr);
        if (realPlayer != null) {
            GLOBAL_EVENT.emit('player', {
                addr: order.addr,
                title: 'orderstate',
                content: {
                    txID: order.txID,
                    status: status,
                    tableId: order.tableId,
                    trxAmount: order.trxAmount
                }
            });
        }
    }

    async addUnconfirmedOrder(order) {
        if (order.blockId < BEGIN_BLOCK_NUMBER) {
            loggerDefault.warn("太老的订单请求: txID:%s, blockId: %s:%s", order.txID, order.blockId, BEGIN_BLOCK_NUMBER);
            return;
        }
        let txID = order.txID;
        let existOrder = this.unConfirmedOrder[txID];
        if (existOrder != null) {
            loggerDefault.warn("未确订单重复提交, 内存未确认Map已存在: txID:%s, trx<-->trx: %s:%s", txID, order.trxAmount, existOrder.trxAmount);
            return;
        }

        if (this.confirmedOrder[txID] != null) {
            loggerDefault.warn("未确订单重复提交, 内存已确认Map已存在: txID:%s, trx:%s", txID, order.trxAmount);
            return;
        }

        // 在mongodb订单数据表里面查询是否已经完成了本订单
        let existed = await dbService.isTxIDPayed(txID);
        if (existed) {
            loggerDefault.warn("未确订单重复提交, db已存在: txID:%s, trx:%s", txID, order.trxAmount);
            return;
        }

        this.unConfirmedOrder[txID] = order;
        loggerDefault.warn('[收到未确认充值订单], txID:%s, trx:%s', txID, order.trxAmount);
        dbService.saveTable(this.tableId, { unConfirmedOrder: this.unConfirmedOrder });

        // 通知未确认订单到达
        this._sendOrderMsg(order, 'unconfirmed')
    }

    async orderConfirmed(order) {
        let txID = order.txID;
        let existOrder = this.unConfirmedOrder[txID];
        if (existOrder == null) {
            loggerDefault.warn("订单确认找不到原始订单: txID:%s, trx: %s", txID, order.trxAmount);
            return;
        }

        if (this.confirmedOrder[txID] != null) {
            loggerDefault.warn("已确认订单重复提交: txID:%s, trx: %s", txID, order.trxAmount);
            return;
        }

        // 在mongodb订单数据表里面查询是否已经完成了本订单
        let existed = await dbService.isTxIDPayed(txID);
        if (existed) {
            loggerDefault.warn("未确订单重复提交, db已存在: txID:%s, trx:%s", txID, order.trxAmount);
            return;
        }

        let tmNow = getUnixTimeStamp();
        existOrder.confirmTime = tmNow;
        existOrder.confirmNo = this.no;
        existOrder.status = PAYIN_STATE.CONFIRMED;

        let player = this.getPlayerByUID(existOrder.addr);
        let maxBuyIn = this.config.maxBuyIn;
        // 如果本桌正在等待,直接给玩家加上筹码

        if (player != null && player.seatNo >= 0 && commonEnum.PLAYER_CAN_PAY(this.tableState, player.playerState)) {
            await dbService.savePayedTxID(txID);
            let oldBalance = player.init_balance;
            // if (oldBalance < maxBuyIn && LobbyInstance.lobbyState != LOBBY_STATE.STOP) {
            if (oldBalance === 0 && player.firstBuyInTs === 0 && existOrder.trxAmount === this.config.maxBuyIn && LobbyInstance.lobbyState != LOBBY_STATE.STOP) {
                delete this.unConfirmedOrder[txID];
                player.init_balance += existOrder.trxAmount;

                dbService.saveTable(this.tableId, this.toDocument());

                this.playerConfirm(existOrder.addr, existOrder.trxAmount);
                logService.addConfirmLog(existOrder, oldBalance, player.init_balance, 0, player.seatNo, this.no);
                logService.addRevenueLog(existOrder.addr, this.tableId, this.no, player.init_balance - oldBalance, oldBalance, player.init_balance, REVENUE_OPTYPE.PAYIN);


                //  发送订单确认消息
                this._sendOrderMsg(order, 'confirmed');
                loggerDefault.warn('[确认充值订单1], txID:%s, trx:%s, balance:%s->%s, backAmount:%s', txID, existOrder.trxAmount, oldBalance, player.init_balance, 0);
            } else {
                // 如果筹码超限, 或者服务器将要停止, 则发起退款
                delete this.unConfirmedOrder[txID];
                this.confirmedOrder[txID] = existOrder;
                let optype = LobbyInstance.lobbyState == LOBBY_STATE.STOP ? SENDBACK_OPTYPE.SENDBACK_STOP : SENDBACK_OPTYPE.SENDBACK_FULL;
                this.orderSendBack(existOrder, tmNow, optype, true);        // orderSendBack里面会保存两个order
                logService.addConfirmLog(existOrder, oldBalance, oldBalance, existOrder.trxAmount, player.seatNo, this.no);
            }
        } else {
            delete this.unConfirmedOrder[txID];
            this.confirmedOrder[txID] = existOrder;
            if (player != null) {
                dbService.saveTable(this.tableId, { unConfirmedOrder: this.unConfirmedOrder, confirmedOrder: this.confirmedOrder });
                //  发送订单确认消息
                this._sendOrderMsg(order, 'confirmed');
                loggerDefault.warn('[确认充值订单2], 缓存到确认Map, txID:%s, trx:%s', txID, existOrder.trxAmount);
            } else {
                let optype = LobbyInstance.lobbyState == LOBBY_STATE.STOP ? SENDBACK_OPTYPE.SENDBACK_STOP : SENDBACK_OPTYPE.SENDBACK_BLANK;
                this.orderSendBack(existOrder, tmNow, optype, true);        // orderSendBack里面会保存两个order
                logService.addConfirmLog(existOrder, 0, 0, existOrder.trxAmount, 0, this.no);
            }
        }
    }

    async dealConfirmedOrders() {
        let txIDArray = [];
        for (let txID in this.confirmedOrder) {
            txIDArray.push(txID);
        }

        let tmNow = getUnixTimeStamp();
        for (let txID of txIDArray) {
            //
            let order = this.confirmedOrder[txID];
            if (order != null) {
                await this.orderSendBack(order, tmNow, SENDBACK_OPTYPE.SENDBACK_FULL);
                loggerDefault.info('[返回充值订单3], txID:%s, trx:%s', txID, order.trxAmount);
            }
            //


            // let order = this.confirmedOrder[txID];

            // // 如果很长时间没有被认领, 就退回
            // let player = this.getPlayerByUID(order.addr);
            // if (player == null || player.seatNo < 0) {
            //     await this.orderSendBack(order, tmNow, SENDBACK_OPTYPE.SENDBACK_BLANK);
            //     continue;
            // }

            // if (order.BackSending == true) {
            //     continue;
            // }

            // let oldBalance = player.init_balance || 0;
            // let maxBuyIn = this.config.maxBuyIn;
            // if (oldBalance < maxBuyIn && LobbyInstance.lobbyState != LOBBY_STATE.STOP) {
            //     let ret = await dbService.savePayedTxID(txID);
            //     if (ret) {
            //         delete this.confirmedOrder[txID];

            //         let canAddCommon = maxBuyIn - oldBalance;
            //         let canAddCup = maxBuyIn;
            //         if (this.tableId == config.cupConfig.tableId) {
            //             canAddCup = (maxBuyIn * 10) - (player.totalBuyIn || 0);
            //         }
            //         let canAdd = Math.min(canAddCommon, canAddCup);
            //         let backAmount = 0;
            //         if (order.trxAmount > canAdd) {
            //             backAmount = order.trxAmount - canAdd;
            //         }

            //         player.init_balance += (order.trxAmount - backAmount);

            //         await dbService.saveTable(this.tableId, this.toDocument());
            //         if (backAmount > 0) {
            //             this.orderSendBackPartial(player.uid, backAmount);
            //         }

            //         if (backAmount < order.trxAmount) {
            //             this.playerConfirm(order.addr, order.trxAmount - backAmount);
            //             logService.addConfirmLog(order, oldBalance, player.init_balance, backAmount, player.seatNo, this.no);
            //             logService.addRevenueLog(order.addr, this.tableId, this.no, player.init_balance - oldBalance, oldBalance, player.init_balance, REVENUE_OPTYPE.PAYIN);
            //         }
            //         loggerDefault.warn('[确认充值订单3], txID:%s, trx:%s, balance:%s->%s, backAmount:%s', txID, order.trxAmount, oldBalance, player.init_balance, backAmount);
            //     }
            // } else {
            //     let optype = LobbyInstance.lobbyState == LOBBY_STATE.STOP ? SENDBACK_OPTYPE.SENDBACK_STOP : SENDBACK_OPTYPE.SENDBACK_FULL;
            //     this.orderSendBack(order, tmNow, optype, true);
            //     logService.addConfirmLog(order, oldBalance, oldBalance, order.trxAmount, player.seatNo, this.no);
            // }
        }
    }

    orderRollback(order) {
        let txID = order.txID;
        let existOrder = this.unConfirmedOrder[txID];
        if (existOrder == null) {
            loggerDefault.warn("回滚订单时未找到指定的订单: txID:%s, trx:%s", txID, order.trxAmount);
            return;
        }

        delete this.unConfirmedOrder[txID];

        // 在mongodb中保存桌子最新状态
        dbService.saveTable(this.tableId, { unConfirmedOrder: this.unConfirmedOrder });
        this._sendOrderMsg(order, 'rollback');
        loggerDefault.warn('[充值订单回滚], txID:%s, trx:%s', txID, existOrder.trxAmount);
    }

    // 订单全部退回
    async orderSendBack(order, tmNow, optype, force = false) {
        if (order.BackSending) {
            return;
        }
        let timePassed = tmNow - order.confirmTime;
        let roundPassed = this.no - order.confirmNo;
        if (force || ((timePassed >= 300 && roundPassed >= 2) || timePassed >= 600)) {
            // 需根据安全的处理订单退回, 需要正确返回才删除
            order.BackSending = true;
            let ret = await dbService.savePayedTxID(order.txID);
            if (ret) {
                order.BackSending = false;
                delete this.confirmedOrder[order.txID];
                LobbyInstance.sendback(order.addr, order.tableId, this.no, order.trxAmount, optype);
                // 通知确认订单退回
                this._sendOrderMsg(order, 'sendback')
                await dbService.saveTable(this.tableId, { unConfirmedOrder: this.unConfirmedOrder, confirmedOrder: this.confirmedOrder });
                loggerDefault.warn('[充值订单退回], txID:%s, trx:%s', order.txID, order.trxAmount);
            } else {
                order.BackSending = false;
            }
        }
    }

    // 部分退回无需处理订单, 退回操作是在确认订单的时候执行的
    orderSendBackPartial(addr, backAmount) {
        // revenue log会在payout的时候记录
        LobbyInstance.sendback(addr, this.tableId, this.no, backAmount, SENDBACK_OPTYPE.SENDBACK_PART);
    }

    toDocPlayers() {
        let allPlayers = {};
        for (let uid in this.allPlayers) {
            let playerDoc = {};
            let player = this.allPlayers[uid];
            for (let pk in tableSchema.PlayerTemplate) {
                playerDoc[pk] = player[pk];
            }
            allPlayers[uid] = playerDoc;
        }
        return allPlayers;
    }

    toDocument() {
        let doc = {};
        for (let k in tableSchema.TableTemplate) {
            if (k !== 'allPlayers') {
                doc[k] = this[k] || null;
            } else {
                doc.allPlayers = this.toDocPlayers();
            }
        }
        return doc;
    }

    async forceClear() {
        // 查看在桌人员, 有的就踢走
        // 先将数据库里面清空, 再退钱, 防止重复操作
        await dbService.saveTable(this.tableId, { allPlayers: {} });
        let allPlayers = this.allPlayers;
        this.allPlayers = {};

        for (let addr in allPlayers) {
            let player = allPlayers[addr];
            let seatNo = player.seatNo;
            let seat = this.getSeat(seatNo);
            if (seat != null) {
                seat.player = null;
            }

            let balance = player.init_balance;
            player.init_balance = 0;
            if (balance > 0) {
                LobbyInstance.kickOut(player.uid, this.tableId, this.no, balance, 0, balance, 0);
            } else {
                LobbyInstance.kickOut(player.uid, this.tableId, this.no, 0, 0, 0, 0);
            }

            if (seatNo >= 0) {
                let _seatLog = gameMessage.seatLog(this.tableId, this.no, seatNo, null, DEFAULT_LEFT_MAX, DEFAULT_BUYIN_DURATION);
                this.boradcastMsg(_seatLog);
            }
        }
        assert(_.isEmpty(this.allPlayers), true);

        let txIDArray = [];
        for (let txID in this.confirmedOrder) {
            txIDArray.push(txID);
        }
        let tmNow = getUnixTimeStamp();
        await dbService.saveTable(this.tableId, { confirmedOrder: {} });       // 先将数据库里面清空, 再退钱, 防止重复操作
        for (let txID of txIDArray) {
            let order = this.confirmedOrder[txID];
            await this.orderSendBack(order, tmNow, SENDBACK_OPTYPE.SENDBACK_STOP, true);
        }
        assert(_.isEmpty(this.confirmedOrder), true);
    }

    async restTable() {
        if (this.tableState == TABLE_STATE.WAITING) {
            return;
        }

        this.tableState = TABLE_STATE.WAITING;
        await this.forceClear();
        // this.tableState = TABLE_STATE.WAITING;
        this.pot.clear();
        this.roundInfo.clear();
        this.endEarly = false;

        this.gameInfo.communityCards = [];
        this.gameInfo.gameResult = [];

        await dbService.saveTable(this.tableId, this.toDocument());
    }

    async tryCloseTable() {
        if (this.clearCompleted) { throw new Error("WTF"); }
        if (LobbyInstance.lobbyState != LOBBY_STATE.STOP) { throw new Error("WTF"); }
        if (this.tableState != TABLE_STATE.STOP) {
            if (this.tableState == TABLE_STATE.WAITING || this.tableState == TABLE_STATE.PAUSE) {
                this.tableState = TABLE_STATE.STOP;
            } else {
                return;
            }
        }

        await this.forceClear();

        this.clearCompleted = true;
        await dbService.saveTable(this.tableId, this.toDocument());
    }
}

module.exports.tableInfo = tableInfo;
module.exports.setLobby = setLobby;
