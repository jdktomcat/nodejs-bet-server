const _ = require('lodash')._;
const calculator = require("./calculator");
const { MIN_FEE, ROUND_TYPE, ROUND_TYPE_TOSTRING, PLAYER_STATE, PLAYER_STATE_TOSTRING, OP_TYPE, OP_TYPE_TOSTRING, CARDS_TYPE,
    BLIND_TO_OPERATE, SHOW_DOWN_TYPE, REVENUE_OPTYPE, SHOW_DOWN_TYPE_TOSTRING } = require('../common/commonEnum');
const TO_DO_STATE = { //预设置操作相关
    DISABLED: 0, //不可用
    UNCHECKED: 1, //取消
    THIS_ROUND: 2, //本轮 onRoundEnd => DISABLED/UNCHECKED
    THIS_HAND: 3, //本手 onHandEnd => DISABLED/UNCHECKED
    ALWAYS: 4, //一直
}

class playerInfo {
    constructor(_uid, _uname, _photoIdx, _lv, _seat_no, socket_id) {
        this.uid = _uid; //玩家标识(地址)
        this.uname = _uname; //玩家名称
        this.photoIdx = _photoIdx || 10000; //玩家头像
        this.lv = _lv || 1;
        this.seatNo = _seat_no; //物理座位号
        this.position = ""; //游戏中位置
        this.init_balance = 0; //每手牌开始时带入的筹码总数
        this.handCards = [];
        this.ante = 1; //前注
        this.allBets = []; //本局所有轮次下注
        this.done = false; //是否行动结束
        this.live = true; //是否活牌
        this.count = 0;//本次参与手数，用以判断是否是新入玩家以及数据统计
        this.playerState = PLAYER_STATE.PREPARING; //玩家状态
        this.socket_id = socket_id;
        this.autoBB = false; //是否自动交
        this.sitOutTs = 0; //站起时间戳(buyIn,reBuyIn,seatBackSuccess时置为0)
        this.buyInTs = 0; //买入时间戳
        this.firstBuyInTs = 0; //第一次买入成功时间戳
        this.timeBank = 0; //最近一次使用时间银行时间戳
        this.operateDeadLine = 0; //可操作截止时间（每手清零）
        this.operateSec = 0; //可操作时间
        this.lostTs = 0; //最近输光时间戳

        this.missBB = false; //非常态
        this.justComingBack = false; //本轮刚刚回桌,非常态
        this.callAllIn = false; //非常态
        this.foldAndExitASAP = false; //非常态
        this.show_down_type = null;

        this.todo = {
            toShowLeft: false, //即将秀手牌0(本手牌结束清空)
            toShowRight: false, //即将秀手牌1(本手牌结束清空)

            //toExit: false, //想要立刻离桌(本手牌结束清空)
            //toMuck: true,

            toAutoBB: false, //愿意大盲才上桌(下一手牌开始前清空)
            toSitOut: false, //即将站起(下一手牌开始前清空)
            toSeatBack: false,  //即将回桌(下一手牌开始前清空)
        }

        //sng
        this.robot = false; //是否在SNG中托管
        this.sng_rank = -1; //SNG中当前排名
        this.actionIdx = 0; //SNG中本手牌说话顺序(SB:1,BTN:MAX/99)

        this.thisRoundOp = 0; //本轮操作类型
        this.thisRoundBet = 0; //本轮下注额(增量)
        this.thisRoundBetArray = []; //本轮下注分堆
        this.thisRoundIndex = ROUND_TYPE.INIT; //所在轮次
        this.win = 0; //本手盈利
        this.fee = 0; //本手手续费

        this.playerClock = null; //玩家定时器

        this.totalWin = 0; //总盈利
        this.totalBuyIn = 0; //总买入
        this.totalHands = 0; //总手数
        this.gamesWon = 0; //总赢场数
    }
    complete(payout, feeRate, smallBlind) {
        // console.log("complete", payout, feeRate, smallBlind)
        let init_balance = this.init_balance; //本手起始金额
        let now_balance = this.getBalance(); //当前余额
        let bet_total = init_balance - now_balance; //本手总下注金额
        let win = payout - bet_total; //本手盈利 (+/-);
        let fee = 0;
        //手续费
        // if (payout > 0 && feeRate > 0 && smallBlind > 0) {
        if (payout > 0 && feeRate > 0) {
            fee = Math.floor(payout * feeRate);
            if (fee > 0 && fee < MIN_FEE) fee = MIN_FEE;
            if (fee < 0) fee = 0;
            if (fee > payout) fee = payout;
        }
        this.init_balance = now_balance + payout - fee;

        // console.log("本手带入筹码 = " + init_balance, "结算前筹码余额 = " + now_balance, "下注 = " + bet_total, "赔付 = " + payout, "盈利 = " + win, "手续费 = " + fee, "最新筹码量 = " + this.init_balance);

        this.win = win;
        this.fee = fee;

        //TODO:statistics
        // this.totalGames = this.totalGames + 1;
        this.totalWin = this.totalWin + win; //总盈利
        this.totalHands = this.totalHands + 1; //总手数
        if (win > 0) {
            this.gamesWon = this.gamesWon + 1; //总赢场数
        } else {
            //TODO:测试小数用
            // this.init_balance = this.init_balance + 300000;
        }

        // console.log("player statistics ===>", this.uname, this.position, "totalHands:" + this.totalHands, "totalWin:" + this.totalWin, "win:" + this.win, "payout:" + payout);
        //TODO:statistics

        return { addr: this.uid, amount: win, fee: fee, oldAmount: init_balance, newAmount: this.init_balance, logtype: (win >= 0 ? REVENUE_OPTYPE.WIN : REVENUE_OPTYPE.LOST), bet: bet_total, payout: payout };
        // console.log("player complete ===>", this.position, this.uname, "this.init_balance:" + this.init_balance, "win:" + win, "payout:" + payout);
    }

    clear(_now) {
        // console.log("player clear");
        this.position = ""; //游戏中位置
        this.allBets = []; //本局所有轮次下注
        this.handCards = []; //清空手牌
        this.hitInfo = null; //清空中牌
        if (this.handCards[1] != null) {
            console.log("(this.handCards[1].show", this.handCards[1].show);
        }
        this.done = false; //是否行动结束
        this.live = true; //是否活牌
        this.count = 0;//本次参与手数，用以判断是否是新入玩家以及数据统计
        this.thisRoundOp = 0; //本轮操作类型
        this.thisRoundBet = 0; //本轮下注额(增量)
        this.thisRoundBetArray = []; //本轮下注分堆
        this.thisRoundIndex = ROUND_TYPE.INIT; //所在轮次
        this.operateDeadLine = 0;
        this.operateSec = 0;
        //本手牌结束清空
        this.win = 0;
        this.fee = 0;
        this.todo.toShowLeft = false;
        this.todo.toShowRight = false;
        this.callAllIn = false;
        this.justComingBack = false;
        this.foldAndExitASAP = false;
        this.show_down_type = null;

        this.init_balance = this.getBalance(); //本轮下注剩余金额落地
        let needSitOut = false;
        if (this.init_balance <= 0) {
            needSitOut = true;
            this.lostTs = _now || _.now();
            console.log("余额不足 => 需要站起");
        }
        return needSitOut;
    }
    waitMeBet() {
        if (this.playerClock != null) {
            clearTimeout(this.playerClock);
        }
        this.playerClock = setTimeout(() => {
            GLOBAL_EVENT.emit('player_time_out_bet', this.uid);
        }, 20000);
    }
    onCofirmed(value) { //买入确认
        if (this.playerState === PLAYER_STATE.PREPARING || this.playerState === PLAYER_STATE.CONFIRMING) {
            this.playerState = PLAYER_STATE.WAITING;
        } else if (this.playerState === PLAYER_STATE.LEFT) {
            this.todo.toSeatBack = true;
            this.todo.toSitOut = false;
        }
        this.sitOutTs = 0;
        this.buyInTs = 0;
        this.firstBuyInTs = _.now();
        //statistics
        this.totalBuyIn = this.totalBuyIn + value;
        //
        return true;
    }
    isPlaying() {
        return this.playerState === PLAYER_STATE.PLAYING;
    }
    canAct() {
        //console.log("xgr",this.unamem,this.live,this.done);
        return this.isPlaying() && this.live === true && this.done === false;
    }
    getTotalBet() {
        let value = 0;
        for (let k in this.allBets) {
            value = value + this.allBets[k];
        }
        return value;
    }
    getBalanceExceptRound(_round_idx) {
        let value = 0;
        for (let k in this.allBets) {
            if (k !== _round_idx) value = value + this.allBets[k];
        }
        return this.init_balance - value;
    }
    getBalance() {
        // console.log("getBalance",this.position,this.uname,"dd",this.init_balance,this.getTotalBet());
        return this.init_balance - this.getTotalBet();
    }
    getLastestBet() {
        return this.thisRoundBet;
    }
    autoBet(_table_id, _no, _round_index, _op, new_value, _round_bet_array = []) {
        let availableBalance = this.getBalanceExceptRound(_round_index); //本轮可用余额（排除本轮已下注额）
        if (new_value > availableBalance) new_value = availableBalance;

        this.thisRoundIndex = _round_index;
        this.thisRoundOp = BLIND_TO_OPERATE[_op];
        //console.log("autoBet -", _table_id, _no, _round_index, _op, new_value);
        if (this.thisRoundOp === OP_TYPE.ALLIN) {
            this.live = true;
            this.done = true;
        }
        this.thisRoundBet = new_value;
        this.allBets[_round_index] = new_value;
        this.thisRoundBetArray = [new_value];
        let max_bet = _round_bet_array[0] || 0;
        if (new_value > max_bet) _round_bet_array[0] = new_value;

        return { log: this.toLog(_round_index), round_bet: new_value, bet: new_value };
    }
    doBet(_table_id, _no, _round_index, _to_value, _round_bet_array = [], sysFold) {
        // console.log("doBet -",_table_id, _no, _round_index, _to_value, _round_bet_array);
        if (_to_value < 0) {
            throw new Error("doBet param is error!!!_table_id, _no, _round_index, _to_value, _round_bet_array =",
                _table_id, _no, _round_index, _to_value, _round_bet_array);
        }

        let new_value = _to_value;
        let old_val = this.allBets[_round_index] || 0;//该玩家本轮已下注额
        if (new_value < old_val) new_value = old_val;

        let availableBalance = this.getBalanceExceptRound(_round_index); //可用余额（排除本轮已下注额）
        // console.log("availableBalance", availableBalance, "init_balance", this.init_balance);

        //避免allin时剩余小于1个trx的余额
        let yu = availableBalance + old_val - new_value;
        if (yu > 0 && yu < 1e6) {
            new_value = availableBalance + old_val;
            console.log("自动补够最大下注金额");
        }
        //避免allin时剩余小于1个trx的余额

        if (new_value > availableBalance + old_val) new_value = availableBalance + old_val;

        if (new_value < 0) new_value = 0;

        //console.log("new_value -", new_value, old_val);

        let max_bet = 0; //根据本轮所有玩家下注分堆计算最大已下注额
        for (let i = 0; i < _round_bet_array.length; i++) {
            max_bet = max_bet + _round_bet_array[i];
        }

        //计算操作类型
        let _op = OP_TYPE.WAIT;
        if (sysFold === true) {
            _op = OP_TYPE.FOLD
        } else {
            if (new_value === 0) {
                if (max_bet === 0) {
                    _op = OP_TYPE.CHECK;
                } else {
                    _op = OP_TYPE.FOLD;
                }
            } else {
                if (new_value === max_bet) {
                    if (new_value === old_val) { //CHECK行为不一定为0，比如大盲位check
                        _op = OP_TYPE.CHECK;
                    } else {
                        _op = OP_TYPE.CALL;
                    }
                } else if (new_value < max_bet) {
                    _op = OP_TYPE.FOLD;
                    if (new_value > old_val && new_value < (availableBalance + old_val)) { //***比上次下注金额大，没有allin，但是确低于其他玩家的下注（通常是call的筹码不足，比如包含小数）
                        console.log("--------------------!!!!!! Player do bet new / old value", new_value, old_val);
                        new_value = old_val;
                        if (new_value < 0) new_value = 0;
                    }
                } else if (new_value > max_bet) {
                    if (max_bet === 0) {
                        _op = OP_TYPE.BET;
                    } else {
                        _op = OP_TYPE.RAISE;
                    }
                }
                if (new_value >= availableBalance + old_val) _op = OP_TYPE.ALLIN;
            }
        }
        if (_op === OP_TYPE.FOLD) {
            this.done = true;
            this.live = false;
        } else if (_op === OP_TYPE.ALLIN) {
            this.done = true;
            this.live = true;
        }

        //console.log("doBet",this.done,this.live);
        //计算下注分堆
        let roundBetArray = [];
        let num = new_value;
        let grougIdx = 0;
        while (num > 0) {
            let sub_bet = _round_bet_array[grougIdx];
            if (sub_bet != null) {
                if (num >= sub_bet) {
                    roundBetArray.push(sub_bet);
                    num = num - sub_bet;
                    grougIdx++;
                } else {
                    roundBetArray.push(num);
                    num = 0;
                }
            } else {
                roundBetArray.push(num);
                _round_bet_array.push(num);
                num = 0;
            }
        }

        this.thisRoundIndex = _round_index;
        this.thisRoundOp = _op;
        this.thisRoundBet = new_value - old_val;
        this.allBets[_round_index] = new_value;
        this.thisRoundBetArray = roundBetArray;
        //console.log("new_value",this.thisRoundBet,new_value,this.thisRoundOp);
        return { log: this.toLog(_round_index), round_bet: new_value, bet: this.thisRoundBet };
    }
    returnBet(value) {
        let idx = this.allBets.length - 1;
        let _val = this.allBets[idx] - value;
        // console.log("returnBet = ", value, "really bet = " + _val);
        if (_val < 0) _val = 0;
        this.allBets[idx] = _val;
    }
    onRoundEnd(_table_id, _no, _round_index) {
        this.thisRoundIndex = _round_index + 1;
        if (this.thisRoundOp != OP_TYPE.FOLD) this.thisRoundOp = OP_TYPE.WAIT;
        this.thisRoundBetArray = [];
        this.thisRoundBet = 0;
    }
    onGameEnd() {
        this.thisRoundIndex = ROUND_TYPE.INIT;
        this.thisRoundOp = OP_TYPE.WAIT;
        this.thisRoundBetArray = [];
        this.thisRoundBet = 0;
        this.done = true;
        this.live = false;
        if (this.wait_to_sit_out) {
            this.sitting = true;
        }
        if (this.init_balance <= 0) {
            return true;
        } else {
            return false;
        }
    }
    betLogs() {
        let betHistory = " all_rounds_bet=[";
        for (let i = 0; i < this.allBets.length; i++) {
            betHistory = betHistory + ROUND_TYPE_TOSTRING(i).en + ":" + this.allBets[i] + ";";
        }
        return betHistory + "]";
    }
    stateToString() {
        // if (this.thisRoundOp === 0) return " (wait to act)"
        // let str = " (" + OP_TYPE_TOSTRING(this.thisRoundOp).en + " " + this.thisRoundBet + " to " + this.allBets[this.thisRoundIndex];
        // str = str + " live:" + this.live;
        // str = str + " done:" + this.done + ")";
        // return str;

        let position = _.isEmpty(this.position) ? "--" : this.position;
        let nickName = this.uname;
        if (nickName.length > 16) {
            nickName = nickName.substring(0, 5) + "..." + nickName.substring(nickName.length - 5, nickName.length);
        }
        return this.seatNo.toString().padEnd(6)
            + (position + "(" + nickName + ")").padEnd(22)
            + (this.init_balance / 1e6 + "TRX").padEnd(14)
            + PLAYER_STATE_TOSTRING(this.playerState).en.padEnd(14)
            + (this.todo.toSitOut.toString() + "/" + this.todo.toSeatBack.toString() + "/" + this.todo.toAutoBB.toString()).padEnd(30)
            + (this.handCards.length > 0 ? (calculator.transfer(this.handCards) + "show:" + this.handCards[0].show + "/" + this.handCards[1].show) : "")
            + (this.hitInfo != null ? (" " + calculator.pokersToString(this.hitInfo)) : "");
    }
    thisRoundBetArrayToString() {
        let str = " this_round_bet_array=[";
        for (let i = 0; i < this.thisRoundBetArray.length; i++) {
            str = str + this.thisRoundBetArray[i] + ",";
        }
        return str + "]";
    }
    toLog(_round_idx) {
        // let preStr = _table_id == null ? "" : ("[" + _table_id + "-" + (_no == null ? 0 : _no) + "] ");
        // return preStr + ROUND_TYPE_TOSTRING(this.thisRoundIndex).en + " (" + this.position + ")" + this.uname + " balance=" + this.init_balance + "-->" + this.getBalance() + " total_bet=" + this.getTotalBet()
        //     + this.stateToString() + this.betLogs() + this.thisRoundBetArrayToString();
        return {
            roundIndex: _round_idx,
            seatNo: this.seatNo,
            position: this.position,
            uname: this.uname,
            initBalance: this.init_balance,
            nowBalance: this.getBalance(),
            totalBet: this.getTotalBet(),
            opType: this.thisRoundOp,
            opBet: this.thisRoundBet,
            roundBet: this.allBets[this.thisRoundIndex],
            betArray: this.thisRoundBetArray,
            lastBet: this.allBets[this.thisRoundIndex] - this.thisRoundBet,
            timeBank: this.timeBank
        }

        // return gameMessage.play_log(this);
    }
    playerShowCards(show_type, hitInfo) {
        let _cards = [];
        let _hitCards = [];
        let _hitType = CARDS_TYPE.FOLD;
        let _score = 0;
        if (show_type === SHOW_DOWN_TYPE.ALL_IN) { //allin 秀两张
            this.handCards[0].show = true;
            this.handCards[1].show = true;
            _cards[0] = this.handCards[0];
            _cards[1] = this.handCards[1];
            _cards[0].idx = 0;
            _cards[1].idx = 1;
            _cards[0].show = true;
            _cards[1].show = true;
            _hitCards = hitInfo.hitCards;
            _hitType = hitInfo.type;
            _score = hitInfo.score;
        } else if (show_type === SHOW_DOWN_TYPE.SHOW_DOWN) { //摊牌 秀两张
            this.handCards[0].show = true;
            this.handCards[1].show = true;
            _cards[0] = this.handCards[0];
            _cards[1] = this.handCards[1];
            _cards[0].idx = 0;
            _cards[1].idx = 1;
            _cards[0].show = true;
            _cards[1].show = true;
            _hitCards = hitInfo.hitCards;
            _hitType = hitInfo.type;
            _score = hitInfo.score;
        } else if (show_type === SHOW_DOWN_TYPE.MUCK) { //摊牌 秀两张
            this.handCards[0].show = false;
            this.handCards[1].show = false;
        } else if (show_type === SHOW_DOWN_TYPE.SHOW_POKER) { //主动秀牌 秀任意张
            if (this.todo.toShowLeft === true) {
                this.handCards[0].show = true;
                _cards.push(this.handCards[0]);
            }
            if (this.todo.toShowRight === true) {
                this.handCards[1].show = true;
                _cards.push(this.handCards[1]);
            }
        }
        this.hitInfo = hitInfo;
        this.show_down_type = show_type;
        return {
            seatNo: this.seatNo,
            position: this.position,
            uname: this.uname,
            cards: _cards,
            hitCards: _hitCards,
            hitType: _hitType,
            score: _score,
            show_down_type: show_type,
            reson: SHOW_DOWN_TYPE_TOSTRING(show_type).en,
        }
    }
    isActionComplete(round_index, max_bet) { //本轮是否下注完成
        if (this.playerState !== PLAYER_STATE.PLAYING) return true;
        if (this.done === true) return true;
        let op = this.thisRoundOp;
        if (op === OP_TYPE.FOLD || op === OP_TYPE.ALLIN || op === OP_TYPE.ANTE) return true;
        if (op === OP_TYPE.WAIT || op === OP_TYPE.SB || op === OP_TYPE.BB || op === OP_TYPE.STRADDLE || op === OP_TYPE.MISSBB) return false;
        //console.log("bvxcbx", this.allBets[round_index], op)
        if ((op === OP_TYPE.CHECK || op === OP_TYPE.CALL || op === OP_TYPE.RAISE || op === OP_TYPE.BET) && this.allBets[round_index] < max_bet) {
            return false;
        }
        return true;
    }
    onInitBegin(_position) {
        this.position = _position;
        if (this.payBB === false) {
            joinBBPosition();
        } else {
            joinAnyPosition();
        }
    }
    joinBBPosition() {
        if (this.position !== BB) return;
        this.player.doBet(_table_id, _table_no, 0, ante, 0, []);
        this.player.playerState = PLAYER_STATE.PLAYING;
    }
    joinAnyPosition() {
        if (this.position === BB) {
            this.joinBBPosition();
            return;
        }
        this.player.doBet(_table_id, _table_no, 0, ante, 0, []);
        this.player.playerState = PLAYER_STATE.PLAYING;
    }
    //行动中数据统计,如3BET,抵抗3BET
    //行动后数据统计，如胜率，ALLIN胜率
    addBalance(val, maxBuyIn) {
        let newBalance = this.init_balance + val;
        if (newBalance <= maxBuyIn) {
            this.init_balance = newBalance;
            return 0;
        } else {
            this.init_balance = maxBuyIn;
            return (newBalance - maxBuyIn)
        }
    }
    //获取时间银行
    getTimeBankCountDown(reset_cd) {
        if (reset_cd == null || !_.isNumber(reset_cd)) return -1;
        let _tb = this.timeBank || 0;
        let _count_down = reset_cd - (_.now() - _tb);
        if (_count_down < 0) _count_down = 0;
        return _count_down;
    }
    //更新时间银行
    useTimeBank(cd, operate_ts) {
        if (cd == null || !_.isNumber(cd) || operate_ts == null || !_.isNumber(operate_ts)) return 0;
        let _now = _.now();
        if (this.timeBank + cd < _now) {
            this.timeBank = _now;
            this.operateDeadLine = _now + operate_ts;
            return operate_ts;
        } else {
            return 0;
        }
    }
    //当前剩余操作时间
    getOperateSec() {
        return this.operateDeadLine - _.now();
    }
    getStatisticsInfo() {
        return {
            photoIdx: this.photoIdx,
            uid: this.uid,
            uname: this.uname,
            buyIn: this.totalBuyIn,
            win: this.init_balance - this.totalBuyIn,
            balance: this.init_balance,
            lostTs: this.lostTs,

            totalHands: this.totalHands,
            gamesWon: this.gamesWon,
            lastScore: this.lastScore || 0,
            actionIdx: this.actionIdx
        }
    }
}

module.exports = playerInfo;