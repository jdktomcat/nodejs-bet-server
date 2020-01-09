const _ = require('lodash')._

const ALL_POKERS = [
    { style: 's', point: 2 }, { style: 's', point: 3 }, { style: 's', point: 4 }, { style: 's', point: 5 }, { style: 's', point: 6 }, { style: 's', point: 7 }, { style: 's', point: 8 }, { style: 's', point: 9 },
    { style: 'h', point: 2 }, { style: 'h', point: 3 }, { style: 'h', point: 4 }, { style: 'h', point: 5 }, { style: 'h', point: 6 }, { style: 'h', point: 7 }, { style: 'h', point: 8 }, { style: 'h', point: 9 },
    { style: 'c', point: 2 }, { style: 'c', point: 3 }, { style: 'c', point: 4 }, { style: 'c', point: 5 }, { style: 'c', point: 6 }, { style: 'c', point: 7 }, { style: 'c', point: 8 }, { style: 'c', point: 9 },
    { style: 'd', point: 2 }, { style: 'd', point: 3 }, { style: 'd', point: 4 }, { style: 'd', point: 5 }, { style: 'd', point: 6 }, { style: 'd', point: 7 }, { style: 'd', point: 8 }, { style: 'd', point: 9 },
    { style: 's', point: 10 }, { style: 's', point: 11 }, { style: 's', point: 12 }, { style: 's', point: 13 },{ style: 's', point: 14 },
    { style: 'h', point: 10 }, { style: 'h', point: 11 }, { style: 'h', point: 12 }, { style: 'h', point: 13 },{ style: 'h', point: 14 },
    { style: 'c', point: 10 }, { style: 'c', point: 11 }, { style: 'c', point: 12 }, { style: 'c', point: 13 },{ style: 'c', point: 14 },
    { style: 'd', point: 10 }, { style: 'd', point: 11 }, { style: 'd', point: 12 }, { style: 'd', point: 13 },{ style: 'd', point: 14 },
    { style : 'joker', point : 100}, { style : 'joker', point : 101}
]

// diamonds, hearts, spades and clubs  方片, 红心, 黑桃, 梅花

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
}

function getCardsType(handCards) {
    let cards = handCards
    let hitCards = isStraightFlush(cards);
    if (hitCards != null) {
        if (hitCards[0].point === 14) {
            return CARDS_TYPE.ROYAL_FLUSH //皇家同花顺
        } else {
            return CARDS_TYPE.STRAIGHT_FLUSH //同花顺
        }
    }

    let group = getGroup(cards);

    hitCards = isFourOfAKind(group);
    if (hitCards != null) return  CARDS_TYPE.FOUR_OF_A_KIND //金刚

    hitCards = isFullHouse(group);
    if (hitCards != null) return  CARDS_TYPE.FULL_HOUSE //葫芦

    hitCards = isFlush(cards);
    if (hitCards != null) return  CARDS_TYPE.FLUSH //同花

    hitCards = isStraight(cards);
    if (hitCards != null) return  CARDS_TYPE.STRAIGHT //顺子

    hitCards = isThreeOfAKind(group);
    if (hitCards != null) return  CARDS_TYPE.THREE_OF_A_KIND //三条

    hitCards = isTwoPair(group);
    if (hitCards != null) return  CARDS_TYPE.TWO_PAIRS //两对

    hitCards = isOnePair(group);
    if (hitCards != null) return  CARDS_TYPE.ONE_PAIR //一对

    hitCards = isHighCard(cards);
    if (hitCards != null) return  CARDS_TYPE.HIGH_CARD //高牌

    return null;
}

function isStraightFlush(cards) {
    if (cards.length < 5) return null;
    let group = _.groupBy(cards, (element) => { return element.style; })
    for (let key in group) {
        let sameTypeCards = group[key];
        if (sameTypeCards.length < 5) continue;
        let cardA = _.find(sameTypeCards, (element) => { return element.point === 14 });
        if (cardA != null) {
            sameTypeCards.push({ style: cardA.style, point: 1 });
        }
        let _index = -1;
        let sortedCards = _.sortBy(sameTypeCards, (element) => { return -element.point; }); //排序牌型
        for (let i = 0; i <= sortedCards.length - 5; i++) {
            if (sortedCards[i].point - 4 === sortedCards[i + 4].point) {
                _index = i;
                break;
            }
        }
        return _index === -1 ? null : _.slice(sortedCards, _index, _index + 5);
    }
    return null;
}

//是否是同花
function isFlush(cards) {
    if (cards.length < 5) return null;
    let group = _.groupBy(cards, (element) => { return element.style; });
    for (let key in group) {
        let sameTypeCards = group[key];
        if (sameTypeCards.length < 5) continue;
        let sortedCards = _.sortBy(sameTypeCards, (element) => { return -element.point; }); //排序牌型
        return _.take(sortedCards, 5);
    }
    return null;
}

//是否是顺子
function isStraight(cards) {
    if (cards.length < 5) return null;
    let cardA = _.find(cards, (element) => { return element.point === 14 });
    if (cardA != null) {
        cards.push([cardA[0], 1]);
    }
    cards = getUniqCards(cards);
    if (cards.length < 5) return null;
    let _index = -1;
    let sortedCards = _.sortBy(cards, (element) => { return -element.point; }); //排序牌型
    for (let i = 0; i <= sortedCards.length - 5; i++) {
        let _point = sortedCards[i].point;
        if (_point === (sortedCards[i + 1].point + 1) && _point === (sortedCards[i + 2].point + 2) && _point === (sortedCards[i + 3].point + 3) && _point === (sortedCards[i + 4].point + 4)) {
            _index = i;
            break;
        }
    }
    return _index === -1 ? null : _.slice(sortedCards, _index, _index + 5);
}

function getUniqCards(cards) {
    let group = _.groupBy(cards, (element) => { return element.point; });
    let delArr = [];
    for (let key in group) {
        let sameNumberCards = group[key];
        if (sameNumberCards.length === 1) continue;
        for (let i = 1; i < sameNumberCards.length; i++) {
            delArr.push(sameNumberCards[i])
        }
    }
    for (let i = 0; i < delArr.length; i++) {
        let obj = delArr[i];
        _.remove(cards, (element) => {
            return element.style === obj.style && element.point === obj.point;
        })
    }
    return cards;
}

function getGroup(cards) {
    let group = _.groupBy(cards, (element) => { return element.point; });
    group = _.sortBy(group, (element) => {
        return -element[0].point;
    })
    return group;
}

function isFourOfAKind(group) {
    for (let key in group) {
        if (group[key].length >= 4) {
            for (let _key in group) {
                if (key !== _key) {
                    group[key].push(group[_key][0]);
                    return group[key];
                }
            }
        }
    }
    return null;
}

function isFullHouse(group) {
    for (let key in group) {
        if (group[key].length === 3) {
            for (let _key in group) {
                if (key !== _key && group[_key].length >= 2) { //>=2 如 AAAKKKQ => AAAKK
                    group[key].push(group[_key][0]);
                    group[key].push(group[_key][1]);
                    return group[key];
                }
            }
        }
    }
    return null;
}

function isThreeOfAKind(group) {
    for (let key in group) {
        if (group[key].length === 3) {
            let count = 0;
            for (let _key in group) {
                if (key !== _key) {
                    count = count + 1;
                    group[key].push(group[_key][0]);
                }
                if (count === 2) return group[key];
            }
        }
    }
    return null;
}

function isTwoPair(group) {
    let firstPairKey = 0;
    let SecondPairKey = 0;
    let hitCards = [];
    for (let key in group) {
        if (group[key].length === 2) {
            if (firstPairKey === 0) {
                hitCards.push(group[key][0]);
                hitCards.push(group[key][1]);
                firstPairKey = key;
                continue;
            }

            if (SecondPairKey === 0) {
                hitCards.push(group[key][0]);
                hitCards.push(group[key][1]);
                SecondPairKey = key;
                for (let _key in group) {
                    if (_key !== firstPairKey && _key !== SecondPairKey) {
                        hitCards.push(group[_key][0]);
                        break;
                    }
                }
                return hitCards;
            }
        }
    }
    return null;
}

function isOnePair(group) {
    let hitCards = null;
    for (let key in group) {
        if (group[key].length === 2) {
            hitCards = [];
            hitCards.push(group[key][0]);
            hitCards.push(group[key][1]);
            let count = 0;
            for (let _key in group) {
                if (key !== _key) {
                    count = count + 1;
                    hitCards.push(group[_key][0]);
                }
                if (count === 3) return hitCards;
            }
        }
    }
}

function isHighCard(cards) {
    return _.take(_.sortBy(cards, (element) => { return -element.point; }), 5);
}

function getPokerScore(hitCardsInfo){
    //type * 14^5 + p1 * 14^4 + p4 * 14^3 + p3 * 14^2 + p4 * 14^1 + p5 * 14^0
    let type = hitCardsInfo.type;
    let pokers = hitCardsInfo.hitCards;
    let val = type * Math.pow(14,5);
    for(let i=0;i<pokers.length;i++){
        val = val + pokers[i].point * Math.pow(14,(4-i));
    }
    return val;
}

function transferCardType(type) {
    switch (type) {
        case 1:
            return "";
        case 2:
            return "一对";
        case 3:
            return "两对";
        case 4:
            return "三条";
        case 5:
            return "顺子";
        case 6:
            return "同花";
        case 7:
            return "葫芦";
        case 8:
            return "金刚";
        case 9:
            return "同花顺";
        case 10:
            return "皇家同花顺";
    }
}


module.exports = {
    ALL_POKERS,
    CARDS_TYPE,
    getCardsType,
}
