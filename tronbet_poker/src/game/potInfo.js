
const _ = require('lodash')._;

function subPotInfo(_idx) {
    return {
        idx: _idx,
        value: 0,
        players: [],
        winners: [],
        payout: [],
        done: false,
    }
}

class potInfo {
    constructor(capacity) {
        this.lastPot = 0;
        this.pot = 0;
        this.sidePots = new Array(capacity - 1);
        for (let _side_pot_index = 0; _side_pot_index < capacity; _side_pot_index++) {
            this.sidePots[_side_pot_index] = subPotInfo(_side_pot_index);
        }
        this.return = [];
    }
    clear() {
        this.lastPot = 0;
        this.pot = 0;
        for (let _side_pot_index = 0; _side_pot_index < this.sidePots.length; _side_pot_index++) {
            this.sidePots[_side_pot_index] = subPotInfo(_side_pot_index);
        }
        this.return = [];
    }
    getCurrentPot() {
        for (let idx = 0; idx < this.sidePots.length; idx++) {
            let _p = this.sidePots[idx];
            if (_p.done === false) {
                return _p;
            }
        }
    }
    onRoundEnd(pot_ret) {
        //TODO:分池要处理返回的分池是不是已经不可加入新筹码
        // console.log("onRoundEnd => pot_ret", pot_ret);
        let pots = pot_ret.pots;
        let value = pot_ret.total;
        if (value > 0) {
            let current_pot = this.getCurrentPot();
            for (let i = 0; i < pots.length; i++) {
                let _p = pots[i];
                if (_p.pot == null || _p.pot <= 0) break;
                current_pot.value = current_pot.value + _p.pot;
                current_pot.players = _p.players;
                current_pot.done = _p.done;
                if (_p.done === true) {
                    current_pot = this.getCurrentPot();
                }
            }
        }
        this.pot = this.pot + value;
        this.lastPot = this.pot;
    }
    calcResult(resultMap) {
        for (let i = 0; i < this.sidePots.length; i++) {
            let side_pot = this.sidePots[i];
            if (side_pot.value <= 0) break;
            // console.log("side_pot.players",side_pot.players);
            // console.log("resultMap",resultMap);
            let max_score = 0; //当前分池中所涉及的玩家的最高分数
            for (let uid of side_pot.players) {
                let result = resultMap[uid];
                if (result == null) continue;
                let player_score = result.score;
                // console.log("uid,max_score",uid,max_score,player_score);
                if (player_score > 0 && player_score > max_score) {
                    max_score = player_score;
                }
            }
            // console.log("max_score",max_score);

            let topScore = _.filter(resultMap, (o) => {
                //_.find(side_pot.players,(uid)=>{return uid === o.uid}) != null * 多个分池时，秀牌的玩家并不一定存在于靠后的分池中
                return o.score === max_score && _.find(side_pot.players, (uid) => { return uid === o.uid }) != null;
            })
            // console.log("topScore",topScore);
            let yu = side_pot.value % topScore.length;
            let win = (side_pot.value - yu) / topScore.length;

            let winners = [];
            for (let i = 0; i < topScore.length; i++) {
                let obj = { uid: topScore[i].uid, score: topScore[i].score, value: win }
                winners.push(obj);
            }
            if (yu > 0) winners[winners.length - 1].value = winners[winners.length - 1].value + yu;
            side_pot.winners = winners;
            // console.log("side_pot.winners",side_pot.winners, side_pot.idx);
        }
        // console.log("calcResult!!!!!!!!!!!!!!!!!!!!!!");
        // for(let i = 0;i<this.sidePots.length;i++){
        //     if(this.sidePots[i].value>0){
        //         let p= this.sidePots[i];
        //         console.log("xvbbbbbb",p.value,p.winners)
        //     }
        // }
    }
}

module.exports = potInfo;