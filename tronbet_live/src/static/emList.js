const axios = require('axios');
const NODE_ENV = process.env.NODE_ENV;
let config = require('../configs/config');
if (NODE_ENV === 'test') {
    config = require('../configs/config_test');
}


// production
let jsonFeedsUrl = 'https://casino.everymatrix.com/jsonFeeds/mix/tronbet?types=';
// development
if (NODE_ENV == 'test') {
    jsonFeedsUrl = 'https://casino2.stage.everymatrix.com/jsonFeeds/mix/tronbet?types=';
}


async function getAllGamesFromEM() {
    let result = '';
    try {
        let {data} = await axios.get(jsonFeedsUrl + 'Game');
        result = data;

        let tablegames = await axios.get(jsonFeedsUrl + 'table');
        return result + tablegames.data;
    } catch (e) {
        console.log("em request error : ", e)
    }
    return result
}


async function getEMData() {
    let data = await getAllGamesFromEM();
    let games = data.split('\n');
    let slots = [];
    let balckjack = [];
    let baccarat = [];
    let roulette = [];
    let lottery = [];
    let livePoker = [];
    let holdem = [];
    let poker = [];
    for (let one of games) {
        if (one == '') continue;
        let gameInfo = null;
        try {
            gameInfo = JSON.parse(one);
        } catch (error) {
            continue;
        }
        if (gameInfo.data == null) continue;
        let datainfo = gameInfo.data;

        let minBet = 0;
        let maxBet = 0;

        if (datainfo.property.limits) {
            let mm = datainfo.property.limits['TRX'] || datainfo.property.limits['EUR'];
            minBet = mm.min;
            maxBet = mm.max;
        }

        if (datainfo.openingTime && datainfo.openingTime.is24HoursOpen == false) {
            let startTtime = datainfo.openingTime.startTime;
            let endTime = datainfo.openingTime.endTime;
            let nowHours = new Date().getUTCHours();
            if (nowHours < startTtime && nowHours > endTime) {
                continue;
            }
        }

        let vendor = datainfo.vendor;
        let isSupportBTC = false;
        if (vendor == 'ISoftBet' || vendor == 'Platipus') {
            continue;
        }
        if (vendor == 'BetSoft' || vendor == 'Platipus') {
            isSupportBTC = true;
        }

        let tmp = {
            launchUrl: datainfo.url,
            gameName: datainfo.presentation.shortName['*'],
            // iconFormat : datainfo.presentation.iconFormat["*"],
            // logo : datainfo.presentation.logo["*"],
            thumbnail: datainfo.presentation.thumbnail['*'],
            popularity: datainfo.popularity,
            terminal: datainfo.property.terminal,
            id: datainfo.id,
            isSupportBTC: isSupportBTC,
            openTime: datainfo.openingTime,
            type: 'EM',
            minBet,
            maxBet
        };

        let categories = datainfo.category == null ? datainfo.categories : [datainfo.category];
        for (let cate of categories) {
            // console.log(cate)
            cate = cate.toUpperCase();
            let SoltReg = /.*SLOTS.*/;
            if (cate.match(SoltReg)) {
                if (tmp.gameName) {
                    slots.push(tmp);
                }
            }

            let balckReg = /.*BLACKJACK.*/;
            if (cate.match(balckReg)) {
                balckjack.push(tmp);
            }

            let baccaratReg = /.*BACCARAT.*/;
            if (cate.match(baccaratReg)) {
                baccarat.push(tmp);
            }

            let rouletteReg = /.*ROULETTE.*/;
            if (cate.match(rouletteReg)) {
                roulette.push(tmp);
            }

            let lottryReg = /.*LOTTERY.*/;
            if (cate.match(lottryReg)) {
                lottery.push(tmp);
            }

            let livePokerReg = /.*POKER.*/;
            if (cate.match(livePokerReg)) {
                livePoker.push(tmp);
            }

            let holdEmReg = /.*HOLDEM.*/;
            if (cate.match(holdEmReg)) {
                livePoker.push(tmp);
            }

            let pokerReg = /.*TABLEGAMES.*/;
            if (cate.match(pokerReg)) {
                if (tmp.gameName) {
                    poker.push(tmp);
                }
            }
        }
    }
    return {
        slots: slots,
        balckjackt: balckjack,
        baccaratt: baccarat,
        roulettet: roulette,
        lotteryt: lottery,
        livePokert: livePoker,
        holdem: holdem,
        poker,
    };
}

module.exports = getEMData