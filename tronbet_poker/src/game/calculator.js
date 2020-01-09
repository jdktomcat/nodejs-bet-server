const { CARDS_TYPE, CARDS_TYPE_TOSTRING, CARD_STYLE_TOSTRING } = require('../common/commonEnum');
const _ = require('lodash')._;

function calc(handCards, communityCards) {
    let ret = hit(handCards, communityCards);
    ret.score = getPokerScore(ret);
    ret.needTwoHandCards = needTwoHandCards(handCards, ret.hitCards, ret.type);
    return ret;
}

function needTwoHandCards(handCards, hitCards, hitType) {
    let leftCard = handCards[0];
    let needLeftCard = _.find(hitCards, (o) => {
        return o.style === leftCard.style && o.point === leftCard.point;
    }) == null ? false : true;
    if (needLeftCard === false) {
        return false;
    }

    let rightCard = handCards[1];
    let needRightCard = _.find(hitCards, (o) => {
        return o.style === rightCard.style && o.point === rightCard.point;
    }) == null ? false : true;
    if (needRightCard === false) {
        return false;
    }

    if (hitType === CARDS_TYPE.FOUR_OF_A_KIND) {
        if (leftCard.point !== rightCard.point) { //非手对
            return false;
        }
    }

    return true;
}

function hit(handCards, communityCards) {
    let cards = _.concat(handCards, communityCards);
    let hitCards = isStraightFlush(cards);
    if (hitCards != null) {
        if (hitCards[0].point === 14) {
            return { hitCards, type: CARDS_TYPE.ROYAL_FLUSH }; //皇家同花顺
        } else {
            return { hitCards, type: CARDS_TYPE.STRAIGHT_FLUSH }; //同花顺
        }
    }

    let group = getGroup(cards);

    hitCards = isFourOfAKind(group);
    if (hitCards != null) return { hitCards, type: CARDS_TYPE.FOUR_OF_A_KIND }; //金刚

    hitCards = isFullHouse(group);
    if (hitCards != null) return { hitCards, type: CARDS_TYPE.FULL_HOUSE }; //葫芦

    hitCards = isFlush(cards);
    if (hitCards != null) return { hitCards, type: CARDS_TYPE.FLUSH }; //同花

    hitCards = isStraight(cards);
    if (hitCards != null) return { hitCards, type: CARDS_TYPE.STRAIGHT }; //顺子

    hitCards = isThreeOfAKind(group);
    if (hitCards != null) return { hitCards, type: CARDS_TYPE.THREE_OF_A_KIND }; //三条

    hitCards = isTwoPair(group);
    if (hitCards != null) return { hitCards, type: CARDS_TYPE.TWO_PAIRS }; //两对

    hitCards = isOnePair(group);
    if (hitCards != null) return { hitCards, type: CARDS_TYPE.ONE_PAIR }; //一对

    hitCards = isHighCard(cards);
    if (hitCards != null) return { hitCards, type: CARDS_TYPE.HIGH_CARD }; //高牌

    return null;
}

//是否是同花顺
function isStraightFlush(cards) {
    if (cards.length < 5) return null;
    let group = _.groupBy(cards, (element) => { return element.style; });
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
        cards.push({ style: cardA.style, point: 1 });
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

function getPokerScore(hitCardsInfo) {
    //type * 14^5 + p1 * 14^4 + p4 * 14^3 + p3 * 14^2 + p4 * 14^1 + p5 * 14^0
    let type = hitCardsInfo.type;
    let pokers = hitCardsInfo.hitCards;
    let val = type * Math.pow(14, 5);
    for (let i = 0; i < pokers.length; i++) {
        val = val + pokers[i].point * Math.pow(14, (4 - i));
    }
    return val;
}

function transfer(poker) {
    if (poker == null) return "";
    if (_.isArray(poker)) {
        let strPokers = "";
        for (let i = 0; i < poker.length; i++) {
            strPokers = strPokers + transfer(poker[i]) + " ";
        }
        return strPokers;
    }
    return CARD_STYLE_TOSTRING(poker.style) + transferNum(poker.point);
}


function transferNum(num) {
    switch (num) {
        case 14:
            return 'A';
        case 13:
            return 'K';
        case 12:
            return 'Q';
        case 11:
            return 'J';
        default:
            return num + "";
    }
}

function pokersToString(hitCardsInfo) {
    return "牌型:" + CARDS_TYPE_TOSTRING(hitCardsInfo.type).zh + " 牌面:" + transfer(hitCardsInfo.hitCards) + " 分数:" + hitCardsInfo.score;
};

module.exports.calc = calc;
module.exports.pokersToString = pokersToString;
module.exports.transfer = transfer;

function test() {
    let handCards_1 = [{ style: 's', point: 4 }, { style: 'h', point: 8 }]
    let handCards_2 = [{ style: 's', point: 9 }, { style: 'h', point: 2 }]
    let communityCards = [{ style: 'h', point: 4 }, { style: 'h', point: 14 }, { style: 'h', point: 5 }, { style: 'c', point: 8 }, { style: 'h', point: 3 }]
    let ret_1 = calc(handCards_1, communityCards)
    let ret_2 = calc(handCards_2, communityCards)
    console.log(pokersToString(ret_1));
    console.log(pokersToString(ret_2));
}

// test();