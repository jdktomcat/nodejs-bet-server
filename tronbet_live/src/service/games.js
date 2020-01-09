const axios = require('axios');
const NODE_ENV = process.env.NODE_ENV;
let config = require('../configs/config');
if (NODE_ENV == 'test') {
    config = require('../configs/config_test');
}

const swaghub = config.swaghub;
const HmCrypto = require('hm-crypto-nodejs');

const digestType = 'RSA-SHA256';
const publicKey = swaghub.publicKey;
const privateKey = swaghub.privetKey;

// init with default keypair and digest type
const hmCrypto = HmCrypto(digestType, privateKey, publicKey);
//
const {getGameList} = require("../static/getGameList")
//
let swaggerGames = []
let GameSWhilte = []
let TableGames = []
let liveGames = []


let GAMES = {
    slots: [],
    balckjack: [],
    baccarat: [],
    roulette: [],
    poker: []
};

// production
let jsonFeedsUrl = 'https://casino.everymatrix.com/jsonFeeds/mix/tronbet?types=';
// development
if (NODE_ENV == 'test') {
    jsonFeedsUrl = 'https://casino2.stage.everymatrix.com/jsonFeeds/mix/tronbet?types=';
}

function isGameInList(gameName) {
    for (let one of swaggerGames) {
        if (gameName.toUpperCase() == one.toUpperCase()) return true;
    }
    return false;
}

async function getSwaggerGames() {
    let paramas = {
        operator_id: swaghub.operator_id
    };
    let computedSignature = hmCrypto.sign(JSON.stringify(paramas));

    const isTrue = hmCrypto.isValid(JSON.stringify(paramas), computedSignature);

    console.log(`'${JSON.stringify(paramas)}' signature is '${computedSignature}'" => ${isTrue}`);


    try {
        let {data} = await axios({
            url: swaghub.host + '/operator/generic/v2/game/list',
            // url: 'http://api.server1.ih.testenv.io/operator/generic/v2/game/list',
            method: 'post',
            data: paramas,
            headers: {'content-type': 'application/json', 'X-Hub88-Signature': computedSignature}
        });
        let result = [];
        // console.log(`===============start=================data`, data);
        for (let one of data) {
            // console.log(one,"    test123456789")
            if (isGameInList(one.name)) {
                tmp = {
                    thumbnail: one.url_thumb,
                    background: one.url_background,
                    id: one.game_id,
                    gameName: one.name,
                    product: one.product,
                    category: one.category,
                    type: 'HUB',
                    isSupportBTC: true
                };
                let category = one.category;
                if (category != 'Video Slots') {
                    category = 'Live Games';
                }
                if (!result[category]) {
                    result[category] = [tmp];
                } else {
                    result[category].push(tmp);
                }
            }
        }
        // console.log("==========end==========")
        // console.log(result);
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
}

function sortbyLiveGames(firstEl, secondEl) {
    let index1 = liveGames.indexOf(firstEl.id);
    let index2 = liveGames.indexOf(secondEl.id);
    // console.log(firstEl.id, index1, secondEl.id, index2)
    if (index1 > index2) return 1;
    if (index1 == index2) return 0;
    return -1;
}

function sortbySlotsGames(firstEl, secondEl) {
    let index1 = GameSWhilte.indexOf(firstEl.gameName);
    let index2 = GameSWhilte.indexOf(secondEl.gameName);
    // console.log(firstEl.id, index1, secondEl.id, index2)
    if (index1 > index2) return 1;
    if (index1 == index2) return 0;
    return -1;
}

function sortbyTableGames(firstEl, secondEl) {
    let index1 = TableGames.indexOf(firstEl.gameName);
    let index2 = TableGames.indexOf(secondEl.gameName);
    // console.log(firstEl.id, index1, secondEl.id, index2)
    if (index1 > index2) return 1;
    if (index1 == index2) return 0;
    return -1;
}

function sortbySwaggerGames(firstEl, secondEl) {
    let index1 = swaggerGames.indexOf(firstEl.gameName);
    let index2 = swaggerGames.indexOf(secondEl.gameName);
    console.log(index1, index2);
    if (index1 > index2) return 1;
    if (index1 == index2) return 0;
    return -1;
}

async function getAllGamesFromEM() {
    let result = '';
    let {data} = await axios.get(jsonFeedsUrl + 'Game');
    // console.log(data)
    result = data;

    let tablegames = await axios.get(jsonFeedsUrl + 'table');
    return result + tablegames.data;
}

function isInWhiteLists(gameName) {
    let whiteGames = [...GameSWhilte, ...TableGames, ...liveGames];
    for (let one of whiteGames) {
        if (one == gameName) return true;
    }
    return false;
}

async function getIndexOfGame(gameName) {
    let index = 0;
    for (let one of GameSWhilte) {
        if (one == gameName) return index;
        index++;
    }

    return index;
}

async function getIndexOfLiveCasino(gameName) {
    let index = 0;
    for (let one of liveGames) {
        if (one == gameName) return index;
        index++;
    }

    return index;
}

async function getIndexOfTableGames(gameName) {
    let index = 0;
    for (let one of TableGames) {
        if (one == gameName) return index;
        index++;
    }

    return index;
}

async function initData() {
    const rs = await getGameList();
    swaggerGames = rs.swaggerGames
    GameSWhilte = rs.GameSWhilte
    TableGames = rs.TableGames
    liveGames = rs.liveGames
}

async function parseGames() {
    //init data
    await initData();
    //
    let data = await getAllGamesFromEM();

    // console.log("debug-em-data----------\n", data.toString())
    // console.log("\n======================>debug-em-end\n")

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

        if (!isInWhiteLists(datainfo.presentation.shortName['*']) && !isInWhiteLists(datainfo.id)) {
            continue;
        }

        // let vendor = datainfo.vendor
        // if (vendor !== 'Platipus') {
        //     continue
        // }

        let categories = datainfo.category == null ? datainfo.categories : [datainfo.category];
        for (let cate of categories) {
            // console.log(cate)
            cate = cate.toUpperCase();
            let SoltReg = /.*SLOTS.*/;
            if (cate.match(SoltReg)) {
                if (tmp.gameName) {
                    // slots[await getIndexOfGame(tmp.gameName)] = tmp
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
                    // poker[await getIndexOfTableGames(tmp.gameName)] = tmp
                    poker.push(tmp);
                }
            }
        }
    }

    poker.sort(sortbyTableGames);
    slots.sort(sortbySlotsGames);
    holdem.sort(sortbyLiveGames);
    balckjack.sort(sortbyLiveGames);
    baccarat.sort(sortbyLiveGames);
    roulette.sort(sortbyLiveGames);
    lottery.sort(sortbyLiveGames);
    livePoker.sort(sortbyLiveGames);

    let swaggerGame = await getSwaggerGames();
    swaggerGame['Video Slots'].sort(sortbySwaggerGames);

    return {
        slots: [...swaggerGame['Video Slots'], ...slots],
        balckjackt: balckjack,
        baccaratt: baccarat,
        roulettet: roulette,
        lotteryt: lottery,
        livePokert: livePoker,
        holdem: holdem,
        gameshow: swaggerGame['Live Games'],
        balckjack: [],
        baccarat: [],
        roulette: [],
        poker
    };
}

module.exports = {
    parseGames
};
