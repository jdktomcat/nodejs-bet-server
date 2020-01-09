const { ALL_POKERS, FAKE_ALL_POKERS } = require('../common/commonEnum');
const _ = require('lodash')._;
const BASE64 = require('crypto-js/enc-base64');
const SHA256 = require("crypto-js/sha256");

class Pokers {
    constructor(isHighScoreTest = false) {
        let _pokers = _.clone(ALL_POKERS);//获得全新扑克
        _pokers = _.shuffle(_pokers);//洗牌
        this.pokers_copy = _.clone(_pokers);//深拷贝备份
        this.pokers = _pokers;
        let pokerString = this.toString();
        this.hash = this.toHash(pokerString);
        if (isHighScoreTest === true) {
            let x = _.random(0, 100);
            if (x < 100) {
                let p_idx = _.random(0, FAKE_ALL_POKERS.length - 1);
                this.pokers = _.clone(FAKE_ALL_POKERS[p_idx]);
                console.log("==============> isHighScoreTest => true => POKER_INDEX =>", p_idx);
            }
        }
    }
    toString() {
        let _pokers = this.pokers;
        let pokersString = "";
        for (let i = 0; i < _pokers.length; i++) {
            pokersString = pokersString + _pokers[i].style + _pokers[i].point;
        }
        // console.log("pokersString =>", pokersString);
        return pokersString;
    }
    toHash(pokersString) {
        let hash = BASE64.stringify(SHA256(pokersString));
        // console.log("hash =>", hash);
        return hash;
    }
    //根据人数，每人牌数发牌
    dealCards(count_players, count_cards) {
        let AllHandsCards = [];
        for (let idx_card = 0; idx_card < count_cards; idx_card++) {
            for (let idx_player = 0; idx_player < count_players; idx_player++) {
                let _poker = this.pokers.splice(0, 1)[0];
                let handCardsOfPlayer = AllHandsCards[idx_player];
                if (handCardsOfPlayer == null) {
                    AllHandsCards[idx_player] = [];
                    handCardsOfPlayer = AllHandsCards[idx_player];
                }
                handCardsOfPlayer.push(_poker);
            }
        }
        return AllHandsCards;
    }
    //取出指定数量牌
    takeCards(count) {
        return this.pokers.splice(0, count);
    }
    //恢复待验证的牌（支持玩家的任意数手牌，任意数公共牌）的哈希，用以校验牌组是否被更改
    verify(count_players, count_cards, communityCards, handCardsInfo) {
        let len = communityCards.length;
        let _pokers = this.pokers_copy;
        //恢复公牌
        let first_burn_card_index = count_players * count_cards;
        //烧掉一张切牌
        if (communityCards[0] != null) _pokers[first_burn_card_index + 1] = communityCards[0];
        if (communityCards[1] != null) _pokers[first_burn_card_index + 2] = communityCards[1];
        if (communityCards[2] != null) _pokers[first_burn_card_index + 3] = communityCards[2];
        //烧掉一张切牌
        if (communityCards[3] != null) _pokers[first_burn_card_index + 5] = communityCards[3];
        //烧掉一张切牌
        if (communityCards[4] != null) _pokers[first_burn_card_index + 7] = communityCards[4];

        //恢复手牌
        if (handCardsInfo != null) {
            let index = handCardsInfo.index;
            let handCard0 = handCardsInfo.handCard0;
            // console.log("handCard0", _pokers[index]);
            if (handCard0 != null) _pokers[index] = handCard0;
            // console.log("handCard0", _pokers[index]);
            let handCard1 = handCardsInfo.handCard1;
            // console.log("handCard1", _pokers[index + count_players]);
            if (handCard1 != null) _pokers[index + count_players] = handCard1;
            // console.log("handCard0", _pokers[index + count_players]);
        }
        let pokersString = "";
        for (let i = 0; i < _pokers.length; i++) {
            pokersString = pokersString + _pokers[i].style + _pokers[i].point;
        }
        // console.log(pokersString);
        return this.toHash(pokersString);
    }
}

module.exports = Pokers;

function test(count_players, count_cards) {
    let myPokers = new Pokers();
    let AllHandsCards = myPokers.dealCards(count_players, count_cards);
    for (let i = 0; i < AllHandsCards.length; i++) {
        console.log("player_" + i + "_hand_cards", AllHandsCards[i]);
    }

    let drop_card_1 = myPokers.takeCards(1);
    console.log("drop 1:", drop_card_1);

    let flop_cards = myPokers.takeCards(3);
    console.log("flop_cards:", flop_cards);

    let drop_card_2 = myPokers.takeCards(1);
    console.log("drop 2:", drop_card_2);

    let turn_cards = myPokers.takeCards(1);
    console.log("turn_cards:", turn_cards);

    let drop_card_3 = myPokers.takeCards(1);
    console.log("drop 3:", drop_card_3);

    let river_cards = myPokers.takeCards(1);
    console.log("river_cards:", river_cards);

    let communityCards = flop_cards;
    communityCards.push(turn_cards[0])
    communityCards.push(river_cards[0])

    let player_index_to_verify = AllHandsCards.length - 1;
    let handCardsInfo = {
        index: 1,
        handCard0: AllHandsCards[player_index_to_verify][0],
        handCard1: AllHandsCards[player_index_to_verify][1],
    }

    let new_hash = myPokers.verify(count_players, count_cards, communityCards, handCardsInfo)
    console.log("myPokers.hash,new_hash", myPokers.hash === new_hash)
}