const _ = require('lodash')._;
const { OP_TYPE } = require('../common/commonEnum');

function dividePot(allPlayers) {
    let all_pot = [];
    let total = 0;
    let returnInfo = [];

    let ret = _.groupBy(allPlayers, (o) => { return o.opType === OP_TYPE.FOLD });
    let betPlayers = ret['false'];
    let foldedPlayers = ret['true'] || [];
    let group = _.groupBy(betPlayers, (element) => { return element.lastestBet; });

    if (_.size(group) === 1) { //下注额全部一致(注意有可能有人平call allin)
        if (betPlayers.length === 1) { //只有1人未fold
            let potInfo = { pot: 0, players: [] };
            let max_fold_bet = 0;
            for (let i = 0; i < foldedPlayers.length; i++) {
                let obj = foldedPlayers[i];
                potInfo.pot = potInfo.pot + obj.lastestBet;
                if (obj.lastestBet > max_fold_bet) max_fold_bet = obj.lastestBet;
            }
            for (let i = 0; i < betPlayers.length; i++) {
                let obj = betPlayers[i];
                potInfo.players.push(obj.uid);
                if (obj.opType === OP_TYPE.ANTE || obj.opType === OP_TYPE.SB || obj.opType === OP_TYPE.BB || obj.opType === OP_TYPE.STRADDLE || obj.opType === OP_TYPE.MISSBB) { //基础下注直接入池
                    potInfo.pot = potInfo.pot + obj.lastestBet;
                } else {
                    potInfo.pot = potInfo.pot + max_fold_bet;
                    if (obj.lastestBet > max_fold_bet) {
                        returnInfo.push({ returnPlayer: obj.uid, returnValue: obj.lastestBet - max_fold_bet });
                    }
                }
            }
            potInfo.done = false;
            all_pot.push(potInfo);
            total = potInfo.pot;
        } else {
            let potInfo = { pot: 0, players: [] };
            let isNewSidePot = false;
            for (let i = 0; i < allPlayers.length; i++) {
                let obj = allPlayers[i];
                potInfo.pot = potInfo.pot + obj.lastestBet;
                if (obj.opType !== OP_TYPE.FOLD) potInfo.players.push(obj.uid);
                if (obj.opType === OP_TYPE.ALLIN && isNewSidePot === false) isNewSidePot = true;
            }
            if (isNewSidePot === true) {
                potInfo.done = true;
            } else {
                potInfo.done = false;
            }
            all_pot.push(potInfo);
            total = potInfo.pot;
        }
    } else {
        group = _.sortBy(group, (element) => {
            return element[0].lastestBet;
        });
        for (let i = 0; i < group.length; i++) {
            let basicBet = group[i][0].lastestBet;
            let potInfo = { pot: 0, basicBet: basicBet, players: [] };
            for (let j = 0; j < betPlayers.length; j++) {
                if (betPlayers[j].lastestBet > 0) {
                    potInfo.pot = potInfo.pot + basicBet;
                    total = total + basicBet;
                    betPlayers[j].lastestBet = betPlayers[j].lastestBet - basicBet;
                    potInfo.players.push(betPlayers[j].uid);
                }
            }
            if (i === group.length - 1) {
                let keepActionPlayers = 0;
                for (let j = 0; j < betPlayers.length; j++) {
                    if (betPlayers[j].opType != OP_TYPE.FOLD && betPlayers[j].opType != OP_TYPE.ALLIN) {
                        keepActionPlayers = keepActionPlayers + 1;
                    }
                }
                if (keepActionPlayers > 1) {
                    potInfo.done = false;
                }
            } else {
                potInfo.done = true;
            }
            // console.log("xxxxxxxxxxx potInfo potInfo potInfo",potInfo);
            all_pot.push(potInfo);
        }
        for (let i = 0; i < foldedPlayers.length; i++) {
            let bet = foldedPlayers[i].lastestBet;
            for (let j = 0; j < all_pot.length; j++) {
                if (bet <= 0) break;
                let potInfo = all_pot[j];
                let basicBet = potInfo.basicBet;
                if (bet >= basicBet) {
                    potInfo.pot = potInfo.pot + basicBet; //入池basicBet还有剩余
                    bet = bet - basicBet;
                    total = total + basicBet;
                    // potInfo.players.push(foldedPlayers[i].uid);
                } else {
                    potInfo.pot = potInfo.pot + bet; //入池剩余bet
                    total = total + bet;
                    bet = 0;
                    // potInfo.players.push(foldedPlayers[i].uid);
                    break;
                }
            }
        }

        let countPot = all_pot.length;
        if (countPot > 1) {
            let lastPot = all_pot[countPot - 1];
            if (lastPot.players.length === 1) {
                let _returnPlayerUid = lastPot.players[0];
                let _returnBet = lastPot.pot;
                total = total - _returnBet;
                all_pot.splice(countPot - 1, 1);
                returnInfo.push({ returnPlayer: _returnPlayerUid, returnValue: _returnBet })
                // console.log("无效下注 return", _returnPlayerUid, _returnBet);
            }
        }
    }
    return { pots: all_pot, total: total, returnInfo: returnInfo };
}

// let allPlayers = [
//     { uid: 'A', lastestBet: 312, balance: 312 },
//     { uid: 'B', lastestBet: 617, balance: 1400 },
//     { uid: 'C', lastestBet: 617, balance: 1600 },
// ]

// let allPlayers = [
//     { uid: 'A', lastestBet: 300, balance: 300 },
//     { uid: 'B', lastestBet: 200, balance: 1200, opType: OP_TYPE.FOLD },
//     { uid: 'F', lastestBet: 400, balance: 400 },
//     { uid: 'C', lastestBet: 600, balance: 600 },
// ]

// let allPlayers = [
//     { uid: 'A', lastestBet: 4, balance: 300, opType: OP_TYPE.FOLD },
//     { uid: 'B', lastestBet: 400, balance: 400 }
// ]

// let allPlayers = [
//     { uid: 'A', lastestBet: 0, balance: 300, opType: OP_TYPE.FOLD },
//     { uid: 'B', lastestBet: 4, balance: 400, opType: OP_TYPE.FOLD },
//     { uid: 'c', lastestBet: 8, balance: 400 }
// ]

// let ret = dividePot(allPlayers);
// console.log(ret, ret.pots[0], ret.pots[1], ret.pots[2]);

module.exports.dividePot = dividePot;