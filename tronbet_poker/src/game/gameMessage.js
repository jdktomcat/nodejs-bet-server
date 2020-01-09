
const _ = require('lodash')._;
const calculator = require('./calculator');
const log4js = require('../configs/log4js.config');
const logGame = log4js.getLogger('game');
const fileHelper = require('../common/fileHelper');
const toMyLog = fileHelper.toMyLog;

const {
    TABLE_STATE, TABLE_STATE_TOSTRING,
    ROUND_TYPE, ROUND_TYPE_TOSTRING,
    CARDS_TYPE_TOSTRING,
    PLAYER_STATE, PLAYER_STATE_TOSTRING,
    OP_TYPE, OP_TYPE_TOSTRING,
    SHOW_DOWN_TYPE, SHOW_DOWN_TYPE_TOSTRING,
    GAME_TYPE, GAME_TYPE_TYPE_TOSTRING
} = require('../common/commonEnum');

module.exports.seatLog = (tableId, no, seatNo, player, sitOutMax, buyInMax) => {
    let ret = {
        type: "seat_log",
        data: {
            tableId: tableId,
            no: no,
            seatNo: seatNo,
            // seatState: player.playerState,
            ts: _.now(),
        }
    }
    if (player != null) {
        let exitCountDown = -1;
        if (sitOutMax != null && buyInMax != null) {
            if (player.sitOutTs > 0) {
                exitCountDown = sitOutMax - (_.now() - player.sitOutTs);
            } else if (player.buyInTs > 0) {
                exitCountDown = buyInMax - (_.now() - player.buyInTs);
            }
            if (exitCountDown < 0) exitCountDown = -1;
        }
        let _data = ret.data;
        _data.uid = player.uid;
        _data.uname = player.uname;
        _data.photoIdx = player.photoIdx;
        _data.lv = player.lv;
        _data.balance = player.getBalance();
        _data.playerState = player.playerState; //confirming waiting
        _data.position = _.isEmpty(player.position) ? "empty" : player.position;
        _data.todo = player.todo
        _data.exitCountDown = exitCountDown;
        _data.robot = player.robot;
        _data.sng_rank = player.sng_rank;
    }
    return ret;
}

module.exports.print_seat_log = (data) => {
    if (data.player == null) return;
    let msg = data.tableId + "-" + data.no + "[seat_log] " + data.uid + "--" + data.uname + "@" + data.position + " 玩家状态:" + PLAYER_STATE_TOSTRING(data.playerState).zh
        + " 待办:" + PLAYER_STATE_TOSTRING(data.seatState).zh + " 余额:" + data.balance / 1e6 + "TRX";
    logGame.info(msg);
    toMyLog(data.tableId, data.no, msg);
}

module.exports.table_info = (table_info) => {
    let _now = _.now();
    let _log = {
        type: "table_begin",
        data: {
            gameType: table_info.gameType,
            tableId: table_info.tableId,
            no: table_info.no,
            tableName: table_info.tableName, // 桌子名
            ante: table_info.config.ANTE,
            sb: table_info.config.smallBlind,
            bb: table_info.config.bigBlind,
            straddle: table_info.config.STRADDLE,
            now: _now,//当前时间戳
            tableState: table_info.tableState,
            countPlayers: table_info.getCountPlayersByState(PLAYER_STATE.PLAYING),
            btn: -1,

            // gps: this.gps || true,
            // ip: this.gps || true,
            // ins: this.gps || false,

            // bb_countdown: this.bb_countdown || 0,//涨盲倒计时*
            // stop_countdown: this.stop_countdown || 0,//游戏结束倒计时*
            // reset_countdown: this.reset_countdown || 0,//游戏重置倒计时*

            // playersInfo: [
            //     { seat: 0 },
            //     { seat: 1 },
            //     { seat: 2, position: "SB", uname: "邓丰", uid: "uid_deng_feng", photoIdx: 27, playerState: "PLAYING", balance: 6000 },
            //     { seat: 3 },
            //     { seat: 4 },
            //     { seat: 5, position: "BB", uname: "西瓜", uid: "uid_xi_gua", photoIdx: 10000, playerState: "PLAYING", balance: 7000 },
            //     { seat: 6 },
            //     { seat: 7 },
            //     { seat: 8, position: "BTN", uname: "Sam", uid: "uid_sam", photoIdx: 27, playerState: "PLAYING", balance: 8000 },
            // ]
        }
    }

    let resetTs = 0;
    if (table_info.gameType === GAME_TYPE.SNG) {
        if (table_info.tableState === TABLE_STATE.STOP && table_info.tableRestartTs != null && table_info.tableRestartTs > _now) {
            resetTs = table_info.tableRestartTs - _now;
        }

        let blind_info = table_info.getBlindInfo();
        let sng_award_info = table_info.calcSNGAward(table_info.config.maxBuyIn * table_info.config.maxPlayers);

        _log.data.sngts = blind_info.sngts;
        _log.data.sngmts = blind_info.sngmts;
        _log.data.next_sb = blind_info.next_sb;
        _log.data.next_bb = blind_info.next_bb;

        _log.data.sng_total_buyin = sng_award_info.sng_total_buyin;//SNG总买入
        _log.data.sng_winners_count = sng_award_info.sng_winners_count;//钱圈人数
        _log.data.sng_first_val = sng_award_info.sng_first_val; //第一名奖励
        _log.data.sng_sec_val = sng_award_info.sng_sec_val; //第二名奖励(可能为0)
        _log.data.sng_third_val = sng_award_info.sng_third_val; //第三名奖励(可能为0)
        _log.data.sng_fee_rate = sng_award_info.sng_fee_rate; //手续费率
    }
    _log.data.resetTs = resetTs;

    let arrLogs = []
    table_info.allSeats.findNextNode(null, (o) => {
        let x = o.data.getPlayerInfo();
        arrLogs.push(x);
        if (table_info.tableState === TABLE_STATE.PLAYING) {
            if (x.position === "BTN") {
                _log.data.btn = x.seatNo;
            }
        }
    });

    _log.data.playersInfo = arrLogs;

    //打印
    //推送
    return _log;
}

module.exports.print_table_info = (table, count_players_playing, count_players_waiting, count_players_backing) => {
    let tableId = table.tableId;
    let no = table.no;
    let msg = tableId + "-" + no + "[table_info] 牌桌状态:" + TABLE_STATE_TOSTRING(table.tableState).zh
        + " 游戏类型:" + GAME_TYPE_TYPE_TOSTRING(table.gameType)
        + " 手续费:" + table.config.feeRate * 100 + "%"
        + " 盲注:" + table.config.smallBlind / 1e6 + "/" + table.config.bigBlind / 1e6
        + ((table.sng != null) ? (" 盲注升级倒计时:" + (table.sng.next_bb_ts - _.now()) / 1e3 + "s") : "")
        + (count_players_playing != null ? ("; 游戏中玩家数 = " + count_players_playing) : "")
        + (count_players_waiting != null ? ("; 等待中玩家数 = " + count_players_waiting) : "")
        + (count_players_backing != null ? ("; 返桌中玩家数 = " + count_players_backing) : "");
    logGame.info(msg);
    toMyLog(tableId, no, msg);

    let output_head = tableId + "-" + no + "[table_info] " +
        "seat".padEnd(6) +
        "position".padEnd(22) +
        "init_balance".padEnd(14) +
        "player_state".padEnd(14) +
        "toSitOut/toSeatBack/toAutoBB".padEnd(30) +
        "cards".padEnd(10);
    logGame.info(output_head);
    toMyLog(tableId, no, output_head);

    table.allSeats.findNextNode(null, (o) => {
        if (o.data.player != null) {
            let _log = tableId + "-" + no + "[table_info] " + o.data.player.stateToString()
            logGame.info(_log);
            toMyLog(tableId, no, _log);
        }
    });
}

module.exports.round_begin_log = (tableId, no, roundIndex, communityCards, countLivers, pot, lastPot) => {
    return {
        type: "round_begin",
        data: {
            tableId,
            no,
            roundIndex,
            round: ROUND_TYPE_TOSTRING(roundIndex).en,
            communityCards,
            pot: pot,
            lastPot: lastPot,
            countLivers,
        }
    }
}

module.exports.print_round_begin = (data) => {
    let _community_cards = calculator.transfer(data.communityCards);
    let msg = data.tableId + "-" + data.no + "[round_begin] <<< ROUND " + ROUND_TYPE_TOSTRING(data.roundIndex).en
        + " BEGIN >>> 公牌 = " + (_.isEmpty(_community_cards) ? "无" : _community_cards) + "; 玩家数 = " + data.countLivers + "; 上轮底池 = " + data.lastPot / 1e6 + "TRX";
    logGame.info(msg);
    toMyLog(data.tableId, data.no, msg);
}

module.exports.player_log = (tableId, no, roundIndex, logs, pot) => {
    let _logs = [];
    for (let i = 0; i < logs.length; i++) {
        _logs.push(logs[i]);
    }
    return {
        type: "player_log",
        data: {
            // logs: [
            //     { seat: 2, position: "SB", init_balance: 6000, round_begin_balance: 6000, now_balance: 5999, op: "ANTE", round_bet: 1, betArray: [1] },
            //     { seat: 5, position: "BB", init_balance: 7000, round_begin_balance: 7000, now_balance: 6999, op: "ANTE", round_bet: 1, betArray: [1] },
            //     { seat: 9, position: "BTN", init_balance: 8000, round_begin_balance: 8000, now_balance: 7999, op: "ANTE", round_bet: 1, betArray: [1] }
            // ],
            tableId,
            no,
            roundIndex,
            logs: _logs,
            pot
        }
    }
}

module.exports.print_player_log = (data) => {
    let logs = data.logs;
    for (let i = 0; i < logs.length; i++) {
        let _log = logs[i];
        let msg = data.tableId + "-" + data.no + "[player_log] " + ROUND_TYPE_TOSTRING(_log.roundIndex).en + " => seat:" + _log.seatNo + " pos:" + _log.position + " name:" + _log.uname
            + " initMoney:" + _log.initBalance / 1e6 + " nowMoney:" + _log.nowBalance / 1e6 + " totalBet:" + _log.totalBet / 1e6 + " opType:"
            + OP_TYPE_TOSTRING(_log.opType).en + " opBet:" + _log.opBet / 1e6 + " roundBet:" + _log.roundBet / 1e6 + " roundPot:"
            + _log.roundPot / 1e6 + " totalPot:" + _log.totalPot / 1e6 + " auto:" + _log.auto;
        logGame.info(msg);
        toMyLog(data.tableId, data.no, msg);
    }
}

module.exports.return_bet_log = (tableId, no, returnInfo) => {
    return {
        type: "return_bet",
        data: {
            tableId,
            no,
            return: returnInfo
        }
    }
}

module.exports.print_return_bet_log = (data) => {
    let msg = data.tableId + "-" + data.no + "[return_bet] return bet:" + data.return.value + " to seat:" + data.return.seatNo + " realy balance = " + data.return.nowBalance;
    logGame.info(msg);
    toMyLog(data.tableId, data.no, msg);
}

module.exports.round_end_log = (tableId, no, roundIndex, countLivers, countCanMoveNextRound, pot, round_total, lastPot, side_pots) => {
    let _side_pots = [];
    for (let i = 0; i < side_pots.length; i++) {
        if (side_pots[i].value > 0) {
            let _obj = side_pots[i];
            _side_pots.push({ idx: i, value: _obj.value, players: _obj.players });
        }
    }
    return {
        type: "round_end",
        data: {
            tableId,
            no,
            roundIndex,
            round: ROUND_TYPE_TOSTRING(roundIndex),
            countLivers,
            countCanMoveNextRound,
            pot,
            round_total,
            lastPot,
            pots: _side_pots
        }
    }
}

module.exports.print_round_end_log = (data) => {
    let msg = data.tableId + "-" + data.no + "[round_end] <<< ROUND " + ROUND_TYPE_TOSTRING(data.roundIndex).en + " END >>> countLivers = " + data.countLivers + " countCanMoveNextRound = " + data.countCanMoveNextRound
        + " pot = " + data.pot / 1e6 + "TRX round_total = " + data.round_total / 1e6 + "TRX last_pot = " + data.lastPot / 1e6 + "TRX; side_pots = " + JSON.stringify(data.pots);
    logGame.info(msg);
    toMyLog(data.tableId, data.no, msg);
}

module.exports.next_actor = (tableId, no, _log) => {
    return {
        type: "next_actor",
        data: {
            tableId,
            no,
            player: _log
        }
    }
}

module.exports.print_next_actor = (data) => {
    // logGame.info(data.tableId + "-" + data.no +"[next_actor] position:" + data.player.position + " uname:" + data.player.uname);
}

module.exports.show_cards_log = (tableId, no, _show_down_logs) => {
    return {
        type: "show_cards",
        data: {
            tableId,
            no,
            players: _show_down_logs
        }
    }
}

module.exports.print_show_cards = (data) => {
    for (let i = 0; i < data.players.length; i++) {
        let _log = data.players[i];
        let msg = data.tableId + "-" + data.no + "[show_cards] " + _log.position + "(" + _log.uname + ")"
            + " hand_cards = " + calculator.transfer(_log.cards)
            + "; hit_cards = " + calculator.transfer(_log.hitCards)
            + "; hit_cards_type = " + CARDS_TYPE_TOSTRING(_log.hitType).zh
            + "; hit_cards_score = " + _log.score
            + "; reson = " + SHOW_DOWN_TYPE_TOSTRING(_log.show_down_type).en;
        logGame.info(msg);
        toMyLog(data.tableId, data.no, msg);
    }
}

module.exports.simple_cards_log = (tableId, no, seatNo, _card) => {
    return {
        type: "simple_cards_log",
        data: {
            tableId,
            no,
            seatNo,
            card: { idx: _card.idx, style: _card.style, point: _card.point },
            show_down_type: SHOW_DOWN_TYPE.SHOW_POKER
        }
    }
}

module.exports.print_simple_cards_log = (data) => {
    let msg = data.tableId + "-" + data.no + "[simple_cards_log] " + " seatNo: " + data.seatNo + " card_idx: " + data.card.idx + " style: " + data.card.style + " point: " + data.card.point + " show_down_type: " + SHOW_DOWN_TYPE_TOSTRING(data.show_down_type).zh;
    logGame.info(msg);
    toMyLog(data.tableId, data.no, msg);
}

module.exports.show_down = (tableId, no, side_pots, pot, lastPot) => {
    let _pots = [];
    for (let i = 0; i < side_pots.length; i++) {
        if (side_pots[i].value <= 0) break;
        _pots.push(side_pots[i]);
    }

    return {
        type: "show_down",
        data: {
            tableId,
            no,
            pot: pot,
            lastPot: lastPot,
            pots: _pots
        }
    }
}

module.exports.print_show_down = (data) => {
    let msg = data.tableId + "-" + data.no + "[showdown]" + " total_pot: " + data.pot;
    logGame.info(msg);
    toMyLog(data.tableId, data.no, msg);
    for (let i = 0; i < data.pots.length; i++) {
        let _side_pot = data.pots[i];
        let _log = data.tableId + "-" + data.no + "[showdown] side_pot_" + _side_pot.idx + " value:" + _side_pot.value + " winners:" + JSON.stringify(_side_pot.winners)
        logGame.info(_log);
        toMyLog(data.tableId, data.no, _log);
    }
}

module.exports.table_end = (tableId, no, tableState, totalBalance, totalFee, endTs) => {
    return {
        type: "table_end",
        data: {
            tableId,
            no,
            tableState,
            totalBalance,
            totalFee,
            endTs,
            ts: _.now()
        }
    }
}

module.exports.print_table_end = (data) => {
    let endCountDown = (data.endTs - _.now()) / 1000;
    if (endCountDown < 0) endCountDown = 0;
    let msg = data.tableId + "-" + data.no
        + "[table_end] 牌桌状态 = " + TABLE_STATE_TOSTRING(data.tableState).zh
        + "; 所有玩家余额汇总 = " + (data.totalBalance / 1e6)
        + "; 本手手续费汇总 = " + (data.totalFee / 1e6)
        + " TRX; 游戏结束倒计时 = " + endCountDown + " 秒\r\n";
    logGame.info(msg);
    toMyLog(data.tableId, data.no, msg);
}

module.exports.to_simple_history = (data, reqUid) => {
    let table_begin_log = _.find(data, (o) => {
        return o.type === "table_begin";
    })
    if (table_begin_log == null) return;
    let gameDetail = {
        gameId: table_begin_log.data.tableId + "-" + table_begin_log.data.no,
        info: { //基本信息
            //基于本手开始数据生成
            tableId: table_begin_log.data.tableId, // 桌子id
            no: table_begin_log.data.no, // 局数id
            tableName: table_begin_log.data.tableName, // 桌子名
            ante: table_begin_log.data.ante, //前注
            sb: table_begin_log.data.sb, // 小盲
            bb: table_begin_log.data.bb, // 大盲
            straddle: table_begin_log.data.straddle, //抓盲
            ts: table_begin_log.data.now, // 时间戳
            countPlayers: table_begin_log.data.countPlayers, //本手牌参与人数

            //基于本手结束数据生成
            communityCards: [], //所有公共牌
            pot: 0, //本手牌最终底池大小
            // result: [],//TODO:牌谱/牌局结果
            //发出查询指令的玩家在本手牌局中的手牌（在result中遍历该玩家手牌）
            myCards: []
        }
    }

    //详细过程
    gameDetail.initRound = getRoundLog(data, ROUND_TYPE.INIT); //前注圈数据
    gameDetail.preflop = getRoundLog(data, ROUND_TYPE.PRE_FLOP); //翻前圈数据
    gameDetail.flop = getRoundLog(data, ROUND_TYPE.FLOP); //翻牌圈数据
    gameDetail.turn = getRoundLog(data, ROUND_TYPE.TURN); //转牌圈数据
    gameDetail.river = getRoundLog(data, ROUND_TYPE.RIVER); //河牌圈数据
    gameDetail.showdown = getShowDwonLog(data, reqUid); //摊牌圈数据

    gameDetail.info.pot = gameDetail.showdown.pot;
    gameDetail.info.communityCards = gameDetail.showdown.communityCards;
    gameDetail.info.myCards = gameDetail.showdown.myCards;

    delete gameDetail.showdown["communityCards"]
    delete gameDetail.showdown["myCards"]

    return gameDetail;
}

module.exports.info = (tableId, no, msg) => {
    if (_.isString(msg) === false) return;
    logGame.info(msg);
    if (tableId == null || no == null) {
        console.log("tableId, no", tableId, no);
        return;
    }
    toMyLog(tableId, no, msg);
}

module.exports.error = (tableId, no, msg) => {
    if (_.isString(msg) === false) return;
    logGame.error(msg);
    if (tableId == null || no == null) {
        console.log("tableId, no", tableId, no);
        return;
    }
    toMyLog(tableId, no, msg);
}

function getRoundLog(data, round_index) {
    let _log_this_round = null;
    let _log_begin = _.find(data, (o) => { return o.type === "round_begin" && o.data.roundIndex === round_index; });
    let _log_end = _.find(data, (o) => { return o.type === "round_end" && o.data.roundIndex === round_index; });
    if (_log_begin != null && _log_end != null) {
        //整合本轮前本轮后信息
        _log_this_round = {
            type: 'roundLog',
            round: ROUND_TYPE_TOSTRING(_log_end.data.roundIndex).en,
            roundIndex: _log_end.data.roundIndex,
            pot: _log_end.data.pot,
            countPlayers: _log_begin.data.countLivers,
            playerLogs: []
        }
        //添加玩家操作信息
        let _playerLogs = _log_this_round.playerLogs;
        let arrLogs = _.filter(data, (o) => {
            return o.type === "player_log" && o.data.roundIndex === _log_this_round.roundIndex;
        })
        if (arrLogs != null && arrLogs.length > 0) {
            for (let i = 0; i < arrLogs.length; i++) {
                let logs = arrLogs[i].data.logs;
                for (let j = 0; j < logs.length; j++) {
                    let _p = logs[j];
                    let _d = {
                        type: 'playerLog',
                        roundIndex: _p.roundIndex,
                        position: _p.position,
                        uname: _p.uname,
                        opName: OP_TYPE_TOSTRING(_p.opType).short,
                        bet: _p.opBet,
                        balance: _p.nowBalance,
                        curPot: _p.totalPot
                    }
                    _playerLogs.push(_d);
                }
            }
        }
    }
    return _log_this_round;
}

function getShowDwonLog(data, reqUid) {
    let gameResult = _.find(data, (o) => { return o.type === "gameResult"; });
    let _result = gameResult.result;
    _result = _.sortBy(_result, (o) => { return -o.win });

    let showdownList = [];
    let myCards = [];
    for (let i = 0; i < _result.length; i++) {
        let obj = _result[i];
        // console.log("obj.show_down_type",obj.show_down_type)
        //i===0 冠军
        if (i === 0 || (obj.show_down_type != null && obj.show_down_type !== SHOW_DOWN_TYPE.MUCK && obj.show_down_type !== SHOW_DOWN_TYPE.FOLD)) {
            let _log = {
                position: obj.position,
                uid: obj.uid,
                uname: obj.uname,
                reson: SHOW_DOWN_TYPE_TOSTRING(obj.show_down_type),
                win: obj.win,
                cards: []
            }
            if (obj.cards[0].show === true) {
                _log.cards.push({ style: obj.cards[0].style, point: obj.cards[0].point });
            }
            if (obj.cards[1].show === true) {
                _log.cards.push({ style: obj.cards[1].style, point: obj.cards[1].point });
            }
            showdownList.push(_log);
        }
        if (obj.uid === reqUid) {
            myCards.push({ style: obj.cards[0].style, point: obj.cards[0].point });
            myCards.push({ style: obj.cards[1].style, point: obj.cards[1].point });
        }
    }
    return {
        type: 'showDown',
        round: ROUND_TYPE_TOSTRING(ROUND_TYPE.SHOWDOWN).en,
        roundIndex: ROUND_TYPE.SHOWDOWN,
        pot: gameResult.pot,
        countPlayers: gameResult.countPlayers,
        playerLogs: showdownList,
        //
        communityCards: gameResult.communityCards || [],
        myCards: myCards
    }
}