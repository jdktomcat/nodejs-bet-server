const gamemodel = require('../model/gamemodel')
const db = require('../utils/dbUtil')
const log4js = require('../configs/log4js_config')
const _ = require('lodash')._
const common = require('../utils/common')

let LocalCurrency = "TRX"
// LocalCurrency = 'NOK'

async function totalData(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }
    console.log(params)
    let token = params.address
    try {
        let checkToken = common.verifyUserToken(token)
        if (!checkToken) {
            return await common.sendMsgToClient(ctx, 401, 'no login')
        }
    
        console.log(checkToken.body.sub)
        let role = checkToken.body.sub
        if (role != 0 && role != 3) {
            return await common.sendMsgToClient(ctx, 401, 'no login')
        }    
    } catch (error) {
        return await common.sendMsgToClient(ctx, 401, 'no login')
    }


    let result = {
        todayAmount : 0,
        todayProfit : 0,
        totalAmount : 0,
        totalProfit : 0,
        totalUser : 0,
        toadyPlayCnt : 0,
        todayUserCnt : 0,
    }

    let game = params.game
/*    if (game == 'dice' || game == 'all') {
        
        let today = await gamemodel.getDiceTodayData()
        let total = await gamemodel.getTotalData('dice')
        console.log('----------dice----------', today, total)
        if(!_.isEmpty(today)) {
            result.todayAmount += Number(today[0].amount || 0)
            result.todayProfit += Number(today[0].profit || 0)
            result.toadyPlayCnt += Number(today[0].playCnt || 0)
            result.todayUserCnt += Number(today[0].userCnt || 0)
        }

        if (!_.isEmpty(total)) {
            result.totalAmount += (Number(total[0].amount || 0) + Number(today[0].amount || 0))
            result.totalProfit += (Number(total[0].profit || 0) + Number(today[0].profit || 0))
            result.totalUser += (Number(Math.floor(total[0].userCnt || 0)) * 4 + Number(today[0].userCnt || 0) )
        }
    }
    if (game == 'moon' || game == 'all') {
        let total = await gamemodel.getTotalData('moon')
        let today = await gamemodel.getMoonTodayData()
        console.log('----------moon----------')
        if(!_.isEmpty(today)) {
            result.todayAmount += Number(today[0].amount || 0)
            result.todayProfit += Number(today[0].profit || 0)
            result.toadyPlayCnt += Number(today[0].playCnt || 0)
            result.todayUserCnt += Number(today[0].userCnt || 0)
        }

        if (!_.isEmpty(total)) {
            result.totalAmount += (Number(total[0].amount || 0) + Number(today[0].amount || 0))
            result.totalProfit += (Number(total[0].profit || 0) + Number(today[0].profit || 0))
            result.totalUser += (Number(Math.floor(total[0].userCnt || 0)) * 4 + Number(today[0].userCnt || 0) )
        }
    }
    
    if (game == 'ring' || game == 'all') {
        let total =  await gamemodel.getTotalData('ring')
        let today = await gamemodel.getRingTodayData()
        console.log('----------ring----------')
        if(!_.isEmpty(today)) {
            result.todayAmount += Number(today[0].amount || 0)
            result.todayProfit += Number(today[0].profit || 0)
            result.toadyPlayCnt += Number(today[0].playCnt || 0)
            result.todayUserCnt += Number(today[0].userCnt || 0)
        }

        if (!_.isEmpty(total)) {
            result.totalAmount += (Number(total[0].amount || 0) + Number(today[0].amount || 0))
            result.totalProfit += (Number(total[0].profit || 0) + Number(today[0].profit || 0))
            result.totalUser += (Number(Math.floor(total[0].userCnt || 0)) * 4 + Number(today[0].userCnt || 0) )
        }
    }
    */
    if (game == 'live' || game == 'all') {
        let total = await gamemodel.getTotalData('live')
        let today = await gamemodel.getLiveTodayData()
        console.log('----------live----------')
        if(!_.isEmpty(today)) {
            result.todayAmount += Number(today[0].amount || 0)
            result.todayProfit += Number(today[0].profit || 0)
            result.toadyPlayCnt += Number(today[0].playCnt || 0)
            result.todayUserCnt += Number(today[0].userCnt || 0)
        }

        if (!_.isEmpty(total)) {
            result.totalAmount += (Number(total[0].amount || 0) + Number(today[0].amount || 0))
            result.totalProfit += (Number(total[0].profit || 0) + Number(today[0].profit || 0))
            result.totalUser += (Number(Math.floor(total[0].userCnt || 0)) * 4 + Number(today[0].userCnt || 0) )
        }
    }
    
    if (game == 'poker' || game == 'all') {
        // let today = await gamemodel.getTodayPokerData()
        // let total = await gamemodel.getTotalPokrtData()
        // console.log('----------poker----------')
        // if(!_.isEmpty(today)) {
        //     result.todayAmount += Number(today[0].amount || 0)
        //     result.todayProfit += Number(today[0].amount * 0.05 || 0)
        //     result.toadyPlayCnt += Number(today[0].playCnt || 0)
        //     result.todayUserCnt += Number(today[0].userCnt || 0)
        // }

        // if (!_.isEmpty(total)) {
        //     result.totalAmount += (Number(total[0].amount || 0) + Number(today[0].amount || 0))
        //     result.totalProfit += (Number(total[0].amount * 0.05 || 0) + Number(today[0].amount * 0.05 || 0))
        //     result.totalUser += (Number(Math.floor(total[0].userCnt || 0)) * 4 + Number(today[0].userCnt || 0) )
        // }
    }
    return await common.sendMsgToClient(ctx, 0, 'no login', result)
}

async function rank(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }
    let game = params.game
    let token = params.address
    try {
        let checkToken = common.verifyUserToken(token)
        if (!checkToken) {
            return await common.sendMsgToClient(ctx, 401, 'no login')
        }
    
        let role = checkToken.body.sub
        if (role != 0 && role != 3) {
            return await common.sendMsgToClient(ctx, 401, 'no login')
        }    
    } catch (error) {
        return await common.sendMsgToClient(ctx, 401, 'no login')
    }
    let result = []
    if (game == 'dice' || game == 'all') {
        result = await gamemodel.getDiceRank()
    }
    if (game == 'moon') {
        result = await gamemodel.getMoonRank()
    }
    if (game == 'ring') {
        result = await gamemodel.getRingRank()
    }
    if (game == 'live') {

    }
    return await common.sendMsgToClient(ctx, 0, '', result)
}

async function profit(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }
    let token = params.address
    try {
        let checkToken = common.verifyUserToken(token)
        if (!checkToken) {
            return await common.sendMsgToClient(ctx, 401, 'no login')
        }
    
        let role = checkToken.body.sub
        if (role != 0 && role != 3) {
            return await common.sendMsgToClient(ctx, 401, 'no login')
        }    
    } catch (error) {
        return await common.sendMsgToClient(ctx, 401, 'no login')
    }

    let result = await gamemodel.getRealProfit()
    console.log('-===================result================',result)
    return await common.sendMsgToClient(ctx, 0, '', result)
}

async function dailyData(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }
    let token = params.address
    try {
        let checkToken = common.verifyUserToken(token)
        if (!checkToken) {
            return await common.sendMsgToClient(ctx, 401, 'no login')
        }
    
        let role = checkToken.body.sub
        if (role != 0 && role != 3) {
            return await common.sendMsgToClient(ctx, 401, 'no login')
        }    
    } catch (error) {
        return await common.sendMsgToClient(ctx, 401, 'no login')
    }

    let game = params.game
    let data = await gamemodel.getDailyData(game)
    return await common.sendMsgToClient(ctx, 0, '', data)
}

async function dailyLiveData(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }
    let token = params.address
    // try {
    //     let checkToken = common.verifyUserToken(token)
    //     if (!checkToken) {
    //         return await common.sendMsgToClient(ctx, 401, 'no login')
    //     }
    
    //     let role = checkToken.body.sub
    //     if (role != 0 && role != 3) {
    //         return await common.sendMsgToClient(ctx, 401, 'no login')
    //     }    
    // } catch (error) {
    //     return await common.sendMsgToClient(ctx, 401, 'no login')
    // }

    let game = params.game
    let cate = params.cate
    let data = null
    if (game) {
        data = await gamemodel.getDailyLiveDataByGame(game)
    } else if (cate) {
        data = await gamemodel.getDailyLiveDataByCate(cate)
    } else {
        data = await gamemodel.getDailyData('live')
    }
    return await common.sendMsgToClient(ctx, 0, '', data)
}

async function getUserTransactionInfo(keyworld, cate, page, stime, etime) {
    let orderSql = "select * from tron_bet_admin.dice_user_order where (addr = ? or txId = ?) and ts < etime and ts > stime "
}

async function getCates(ctx) {
    let res = await gamemodel.getCates()
    return await common.sendMsgToClient(ctx, 0, '', res)
}

async function getGames(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }
    let cate = params.cate

    let res = await gamemodel.getGames(cate)
    return await common.sendMsgToClient(ctx, 0, '', res)
}


//https://www.wink.org/?r=dappreview#/
async function activityCount(ctx) {
    const result = []
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }
    let type = params.type || ''
    let address = params.address || ''
    if(address.trim() === ''){
        address = 'visitor_address'
    }
    //
    if(address.trim() === ''){
        return await common.sendMsgToClient(ctx, 0, '', result)
    }
    /**
     * 客户端需要 type 区分2个 url , address 是用户的地址(下面的3.15.85.91 是测试环境，若上线需要替换成生产)
     * //
     * https://wink.org/?r=Dappdotcom#/ 对应的后端 api
     * http://3.15.85.91:18056/data/activityCount?type=1&address=11111
     * //
     * https://www.wink.org/?r=dappreview#/ 对应的后端 api
     * http://3.15.85.91:18056/data/activityCount?type=2&address=11111
     */
    const typeDict = {
        '1': 'Dappdotcom',
        '2': 'dappreview',
    }
    const activityType = Object.keys(typeDict)
    //如果不存在
    let notExist;
    if(address === 'visitor_address'){
        notExist = true
    }else{
        let exist = await gamemodel.checkAddressIsExist(address)
        notExist = !exist
    }
    if (activityType.includes(String(type)) && notExist) {
        const ts = Date.now()
        await gamemodel.addActivityCount(type, address, ts)
    }
    return await common.sendMsgToClient(ctx, 0, '', result)
}

module.exports = {
    totalData,
    rank,
    profit,
    dailyData,
    getCates,
    getGames,
    dailyLiveData,
    activityCount
}