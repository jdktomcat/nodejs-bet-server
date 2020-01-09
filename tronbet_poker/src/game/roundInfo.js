const _ = require('lodash')._;

class roundInfo {
    constructor() {
        this.roundIndex = 0; //当前轮次 0=pre_flop翻前
        this.roundMaxBet = 0; //本轮最大下注额
        this.roundTotalBet = 0; //本轮下注金额
        this.lastestAttacker = "SB";
        this.roundBetGroup = []; //本轮下注分堆
        this.ins = 0; //保险池输赢
        this.curActorUid = 0;
    }
    clear() {
        this.roundIndex = 0; //当前轮次 0=pre_flop翻前
        this.roundMaxBet = 0; //本轮最大下注额
        this.roundTotalBet = 0; //本轮下注金额
        this.lastestAttacker = "SB";
        this.roundBetGroup = []; //本轮下注分堆
        this.ins = 0; //保险池输赢
        this.curActorUid = 0;
    }
    onPlayerBet(roundIndex, position, value) {
        // if(this.roundIndex === roundIndex) {
        //     this.roundTotalBet = this.roundTotalBet + value;
        //     if(value > this.roundMaxBet){
        //         this.roundMaxBet = value;
        //         this.lastestAttacker = position;
        //     }
        // }else{
        //     this.roundIndex = roundIndex;
        //     this.roundTotalBet = value;
        //     this.roundMaxBet = value;
        //     this.lastestAttacker = position;
        // }
    }
    onRoundEnd() {
        // this.roundIndex = this.roundIndex + 1;
        // this.roundBetGroup = [];
        // this.roundMaxBet = 0;
        // this.roundTotalBet = 0;
    }
}

module.exports = roundInfo;