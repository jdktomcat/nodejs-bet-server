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
    FOUR_OF_A_KIND: 8, //金刚
}

function getGidByPokerStyle(style) {
    let res = -1
    for (let index = 0; index <= 53; index++) {
        let poker =  ALL_POKERS[index]
        let dt = poker.style + poker.point
        if (dt == style) {
            return index
        }
    }
    return -1
}

function getPoketStyleByGid(gid) {
    let poker =  ALL_POKERS[gid]
    if (poker) return poker.style + poker.point
    return '-'
}


async function getGidsBySuitId(suitId) {
    if (suitId == 0) {
        return [32,33,34,35,36]  //黑色皇同
    } else if (suitId == 1) {
        return [37,38,39,40,41]   //红心皇同
    } else if (suitId == 2) {
        return [42,43,44,45,46]   // 方片
    } else if (suitId == 3) {
        return [47,48,49,50,51]   // 梅花
    } else if (suitId == 4) {
        return [32, 37, 42, 47]   // 四条十
    } else if (suitId == 5) {
        return [33, 38, 43, 48]    // 四条J
    } else if (suitId == 6) {
        return [34, 39, 44, 49]    // 四条Q
    } else if (suitId == 7) {
        return [35, 40, 45, 50]    // 四条K
    } else if (suitId == 8) {
        return [36, 41, 46, 51]     // 四条A
    }
}

async function isStraightFlush(cards) {
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


async function isFourOfAKind(group) {
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


module.exports = {
    ALL_POKERS,
    CARDS_TYPE,
    isStraightFlush,
    isFourOfAKind,
    getGidsBySuitId,
    getPoketStyleByGid,
    getGidByPokerStyle,
}