
const axios = require('axios')
const gamemodel = require('../model/gamemodel')

const initTs = 1556251200
const intervalTime = 86400

let timer = setInterval(async () => {
    let now = Math.floor(new Date().getTime() / 1000)
    let day = Math.floor((now - initTs) / intervalTime)
    
    let maxDay = await gamemodel.getMaxDay()
    console.log('======day, maxDay====', day, maxDay)
    if (maxDay < day -1) {
        let startTs = initTs + (day - 1) * intervalTime
        let endTs = startTs + intervalTime
        let dice = await gamemodel.getDiceDataByDate(startTs * 1000, endTs * 1000)
        gamemodel.updateDayData(startTs * 1000, day -1, 'dice', dice[0].amount, dice[0].profit, dice[0].playCnt, dice[0].userCnt)

        let moon = await gamemodel.getMoonDataByDate(startTs * 1000, endTs * 1000)
        gamemodel.updateDayData(startTs * 1000, day -1, 'moon', moon[0].amount, moon[0].profit, moon[0].playCnt, moon[0].userCnt)

        let ring = await gamemodel.getRingDatabyDate(startTs * 1000, endTs * 1000)
        gamemodel.updateDayData(startTs * 1000, day -1, 'ring', ring[0].amount, ring[0].profit, ring[0].playCnt, ring[0].userCnt)

        let live = await gamemodel.getLiveDatabyDate(startTs * 1000, endTs * 1000)
        gamemodel.updateDayData(startTs * 1000, day -1, 'live', live[0].amount, live[0].profit, live[0].playCnt, live[0].userCnt)

        let poker = await gamemodel.getPokerDatabyDate(startTs , endTs)
        gamemodel.updateDayData(startTs * 1000, day -1, 'poker', poker[0].amount, 0, poker[0].playCnt, poker[0].userCnt)

        await updateLiveDetailData(startTs , endTs, day - 1)
    }
    
}, 120000000);

async function test() {
    for (let day = 39; day < 54; day ++) {
        let startTs = initTs + (day) * intervalTime
        let endTs = startTs + intervalTime
        console.log('1111111111111111111111111111111')
        let poker = await gamemodel.getPokerDatabyDate(startTs , endTs)
        console.log('222222222222222222222222222222222')
        await gamemodel.updateDayData(startTs * 1000, day, 'poker', poker[0].amount, poker[0].amount * 0.05, poker[0].playCnt, poker[0].userCnt)
        await updateLiveDetailData(startTs , endTs, day)
    }
}

async function updateLiveDetailData(startTs, endTs, day) {
    let data = await getAllGamesFromEM()
    let games = data.split('\n')
    let gameMap = {}
    for (let one of games) {
        if (one == "") continue
        let gameInfo = null
        try {
            gameInfo = JSON.parse(one)
        } catch (error) {
            continue
        }
        if (gameInfo.data == null) continue
        let datainfo = gameInfo.data
        let gameName = datainfo.presentation.shortName["*"]
        let gameId = gameInfo.id
        let cates = datainfo.categories[0]
        if (cates.endsWith('SLOTS')) {
            cates = 'SLOTS'
        }
        
        // break
        gameMap['' + gameId] = {cates, gameName}
        
    }

    console.log('start to query data from')
    let live = await gamemodel.getLiveGroupDatabyDate(startTs * 1000, endTs * 1000)
    console.log('end to query data from')
    for(let one of live) {
        console.log(one.EMGameId)
        let info = gameMap[one.EMGameId]
        if(!info) {
            info = {cates : one.EMGameId, gameName : one.EMGameId}
        }
        console.log(startTs * 1000, day, info.cates, info.gameName, one.amount, one.profit, one.playCnt, one.userCnt)
        await gamemodel.updateLiveGroupDayData(startTs * 1000, day, info.cates, info.gameName, one.amount, one.profit, one.playCnt, one.userCnt)
    }
}

async function getAllGamesFromEM() {
    let jsonFeedsUrl = 'http://casino.everymatrix.com/jsonFeeds/mix/tronbet?types='
    let result = ''
    let {data} = await axios.get(jsonFeedsUrl + 'Game')
    // console.log(data)
    result = data

    let tablegames = await axios.get(jsonFeedsUrl + 'table')
    return result + tablegames.data
}

async function test1() {
    let data = await getAllGamesFromEM()
    let games = data.split('\n')
    let gameMap = {}
    for (let one of games) {
        if (one == "") continue
        let gameInfo = null
        try {
            gameInfo = JSON.parse(one)
        } catch (error) {
            continue
        }
        if (gameInfo.data == null) continue
        let datainfo = gameInfo.data
        let gameName = datainfo.presentation.shortName["*"]
        let gameId = gameInfo.id
        let cates = datainfo.categories[0]
        if (cates.endsWith('SLOTS')) {
            cates = 'SLOTS'
        }
        
        // break
        gameMap['' + gameId] = {cates, gameName}
        
    }

    console.log(gameMap)

    for (let day = 36; day < 38; day ++) {
        let startTs = initTs + (day) * intervalTime
        let endTs = startTs + intervalTime
        console.log('start to query data from')
        let live = await gamemodel.getLiveGroupDatabyDate(startTs * 1000, endTs * 1000)
        console.log('end to query data from')
        for(let one of live) {
            console.log(one.EMGameId)
            let info = gameMap[one.EMGameId]
            if(!info) {
                info = {cates : one.EMGameId, gameName : one.EMGameId}
            }
            console.log(startTs * 1000, day, info.cates, info.gameName, one.amount, one.profit, one.playCnt, one.userCnt)
            await gamemodel.updateLiveGroupDayData(startTs * 1000, day, info.cates, info.gameName, one.amount, one.profit, one.playCnt, one.userCnt)
        }
        
    }

    // console.log(gameMap)
}

async function test1111() {
    let tss = [
        {
            startTs : 1541001600,
            endTs : 1543593600
        },
        {
            startTs : 1543593600,
            endTs : 1546272000
        },
        // {
        //     startTs : 1551369600,
        //     endTs : 1554048000
        // },
        // {
        //     startTs : 1554048000,
        //     endTs : 1556640000
        // },
        // {
        //     startTs : 1556640000,
        //     endTs : 1559318400
        // },
        // {
        //     startTs : 1559318400,
        //     endTs : 1561910400
        // },
        // {
        //     startTs : 1561910400,
        //     endTs : 1564588800
        // },
    ]

    for (let one of tss) {
        let dice = await gamemodel.getDiceDataByDate(one.startTs * 1000, one.endTs * 1000)
        console.log('dice', dice)
        let moon = await gamemodel.getMoonDataByDate(one.startTs * 1000, one.endTs * 1000)
        console.log('moon',moon)
        let ring = await gamemodel.getRingDatabyDate(one.startTs * 1000, one.endTs * 1000)
        console.log('ring',ring)
        let live = await gamemodel.getLiveDatabyDate(one.startTs * 1000, one.endTs * 1000)  
        console.log('live',live)
    }

}

async function test2222() {
    console.log('======day, maxDay====')

    for (let day = 86; day < 88; day ++) {
        let startTs = initTs + (day) * intervalTime
        let endTs = startTs + intervalTime

        let dice = await gamemodel.getDiceDataByDate(startTs * 1000, endTs * 1000)
        gamemodel.updateDayData(startTs * 1000, day -1, 'dice', dice[0].amount, dice[0].profit, dice[0].playCnt, dice[0].userCnt)

        let moon = await gamemodel.getMoonDataByDate(startTs * 1000, endTs * 1000)
        gamemodel.updateDayData(startTs * 1000, day -1, 'moon', moon[0].amount, moon[0].profit, moon[0].playCnt, moon[0].userCnt)

        let ring = await gamemodel.getRingDatabyDate(startTs * 1000, endTs * 1000)
        gamemodel.updateDayData(startTs * 1000, day -1, 'ring', ring[0].amount, ring[0].profit, ring[0].playCnt, ring[0].userCnt)

        let live = await gamemodel.getLiveDatabyDate(startTs * 1000, endTs * 1000)
        gamemodel.updateDayData(startTs * 1000, day -1, 'live', live[0].amount, live[0].profit, live[0].playCnt, live[0].userCnt)

        let poker = await gamemodel.getPokerDatabyDate(startTs , endTs)
        gamemodel.updateDayData(startTs * 1000, day -1, 'poker', poker[0].amount, 0, poker[0].playCnt, poker[0].userCnt)

        await updateLiveDetailData(startTs , endTs, day - 1)
    }
}


async function test3333() {
    for (let day = -101;  day < 0; day ++) {
        let startTs = initTs + (day) * intervalTime
        let endTs = startTs + intervalTime
        console.log(day)
        let dice = await gamemodel.getDiceDataByDate(startTs * 1000, endTs * 1000)
        if (dice) await gamemodel.updateDayData(startTs * 1000, day -1, 'dice', dice[0].amount, dice[0].profit, dice[0].playCnt, dice[0].userCnt)
        console.log('dice done')
        let moon = await gamemodel.getMoonDataByDate(startTs * 1000, endTs * 1000)
        if (moon) await gamemodel.updateDayData(startTs * 1000, day -1, 'moon', moon[0].amount, moon[0].profit, moon[0].playCnt, moon[0].userCnt)
        console.log('moon done')
        let ring = await gamemodel.getRingDatabyDate(startTs * 1000, endTs * 1000)
        if (ring) await gamemodel.updateDayData(startTs * 1000, day -1, 'ring', ring[0].amount, ring[0].profit, ring[0].playCnt, ring[0].userCnt)
        console.log('ring done')
    }
}
//test3333()
// test2222()