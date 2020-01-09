const _ = require('lodash')._
const {app, rewards, boxConf}  = require('../configs/config')
const nowEvent = require('events')
const common = require('../utils/common')
const appEvent = new nowEvent.EventEmitter()
const TronWeb = require('tronweb')
const userinfo = require('../model/userinfo')
const db = require('../utils/dbUtil')
const redisUtil = require('../utils/redisUtil')
const tronUtils = require('../utils/tronUtil')


const startTs  = app.startTs
const endTs = app.endTs
const interval = app.interval

async function sendMsgToClient(ctx, errno, errmsg, data) {
    let result = {
        errno : errno,
        errmsg : errmsg,
        data : data
    }
    ctx.body = result
}

async function logs(ctx) {
    let params = ctx.request.body
    let addr = params.addr
    if(!TronWeb.isAddress(addr)) {
        return await sendMsgToClient(ctx, 1001, 'args error', [])
    }
    let res = await userinfo.getLogs(addr)

    return await sendMsgToClient(ctx, 0, '', res)
}

async function bags(ctx) {
    let params = ctx.request.body
    let addr = params.addr

    if(!TronWeb.isAddress(addr)) {
        return await sendMsgToClient(ctx, 1001, 'args error', [])
    }

    let now = new Date().getTime()

    let round = Math.floor((now - startTs) / interval)
    //let round = 7

    let box = await userinfo.getBoxs(addr)
    let score = await userinfo.getScores(addr, round)
    let bags = await userinfo.getBags(addr)
    let reslt = {bags, score, box}
    return await sendMsgToClient(ctx, 0, '', reslt)
}

async function openBox(ctx) {

    let params = ctx.request.body
    let addr = params.addr
    let num = params.num
    let sign = params.sign

    try {
        num = Number(num)
    } catch (error) {
        return await sendMsgToClient(ctx, 1001, 'args error', [])
    }

    if (num < 1) {
        return await sendMsgToClient(ctx, 1008, 'args error', [])
    }

    if (! TronWeb.isAddress(addr)) {
        // return await sendMsgToClient(ctx, 1001, 'args error', [])
    }

    let signResult = await tronUtils.verifySignature(sign, addr)
    if (!signResult) {
        return await sendMsgToClient(ctx, 1001, 'sign failed', [])
    }

    let now = new Date().getTime()
    let conn = null
    let gidObj = {}
    try {
        conn = await db.getConnection()
        if (conn == null) {
            return await sendMsgToClient(ctx, 1100, 'Out of serivce, please wait', [])
        }

        let {payNum, freeNum} = await userinfo.getDetailBoxs(addr)
        // console.log('payNum, freeNum, num', payNum, freeNum, num)
        if ((payNum + freeNum) <  num) {
            return await sendMsgToClient(ctx, 1008, 'boxes not enough', [])
        }

        if ((payNum + freeNum) <= 0) {
            return await sendMsgToClient(ctx, 1008, 'boxes not enough', [])
        }

        let gids = await common.openBox(num)

        gidObj = {}
        gids.map(item => {
            gidObj[item] = (gidObj[item] || 0) + 1
        })

        conn.beginTransaction()
        // 扣箱子
        await userinfo.increaseBox(addr, freeNum, num, conn)
        // 添加日志概览 
        await userinfo.addOverLog(addr, 4, num, now, conn)

        // 添加详细日志, 给用户发牌
        let log_id = await userinfo.getOverviewMaxId(addr, conn)
        for (let gid in gidObj) {
            await userinfo.addDetailLog(log_id, gid, gidObj[gid], conn)
            await userinfo.addUserBag(addr, gid, gidObj[gid], conn)
        }
        conn.commit()

    } catch (error) {
        console.log(error)
        if (conn) conn.rollback()
        gidObj = {}
        return await sendMsgToClient(ctx, 1008, 'boxes not enough', [])
    } finally {
        if (conn) conn.release()
    }

    let final = []
    for (let one in gidObj) {
        final.push({id : one, num : gidObj[one]})
    }
    return await sendMsgToClient(ctx, 0, '', final)
}

async function sell(ctx) {
    let params = ctx.request.body
    let addr = params.addr
    let num = params.num
    let sign = params.sign
    let gid = params.gid
    let now = new Date().getTime()
    // return await sendMsgToClient(ctx, 1001, 'args error', [])
    //基本参数检测
    try {
        num = Math.floor(Number(num))
        gid = Math.floor(Number(gid))
        if (gid < 1 || gid > 10) {
            return await sendMsgToClient(ctx, 1001, 'args error', [])
        }
        if (!TronWeb.isAddress(addr)) {
            return await sendMsgToClient(ctx, 1001, 'args error', [])
        }
        let signResult = await tronUtils.verifySignature(sign, addr)
        if (!signResult) {
            return await sendMsgToClient(ctx, 1001, 'sign failed', [])
        }
    } catch (error) {
        return await sendMsgToClient(ctx, 1001, 'args error', [])
    }

    let price = boxConf.goodPrices[gid -1]
    let amount = price * num

    let balance = await tronUtils.getAccBalance()
     
    if (balance < amount) {
        return await sendMsgToClient(ctx, 1004, 'balance not enough, try later please!', [])
    }

    let conn = null
    try {

        let isGidsEnough  = await userinfo.assertSellNumber(addr, num, gid)
        if(!isGidsEnough) {
            return await sendMsgToClient(ctx, 1005, 'poker number not enough!!! check again', [])
        }

        conn = await db.getConnection()
        if (conn == null) {
            return await sendMsgToClient(ctx, 1100, 'Out of serivce, please wait', [])
        }

        // 扣除箱子
        conn.beginTransaction()
        await  userinfo.subUserBag(addr, gid, num, conn)
        conn.commit()

    } catch (error) {
        console.log(error)
        if (conn) conn.rollback()
        return await sendMsgToClient(ctx, 1005, 'poker number not enough', [])
    } finally {
        if (conn) conn.release()
    }

    let tx = await tronUtils.sendTRX(addr, amount)
    if (tx.result != true) {
        console.log('==================> pay failed, infomation : ', {addr, amount})
        return await sendMsgToClient(ctx, 1006, 'pay to user failed!!', [])
    }

    try {
        conn = await db.getConnection()
        if (conn == null) {
            return await sendMsgToClient(ctx, 1100, 'Out of serivce, please wait', [])
        }
        
        conn.beginTransaction()
        // 添加日志概览 
        await userinfo.addOverLog(addr, 2, num * price, now, conn)

        // 添加详细日志
        let log_id = await userinfo.getOverviewMaxId(addr, conn)
        await userinfo.addPay2UserLog(addr,  tx.transaction.txID, amount, now, log_id, conn)
        await userinfo.addDetailLog(log_id, gid, num, conn)
        conn.commit()

    } catch (error) {
        console.log(error)
        if (conn) conn.rollback()
        return await sendMsgToClient(ctx, 1005, 'poker number not enough', [])
    } finally {
        if (conn) conn.release()
    }

    await bags(ctx)

}

async function exchange(ctx) {
    // return await sendMsgToClient(ctx, 1001, 'args error', [])
    let params = ctx.request.body
    let addr = params.addr
    let num = params.num
    let sign = params.sign
    let suitId = params.suit_id
    let now = new Date().getTime()

    //基本参数检测
    try {
        num = Math.floor(Number(num))
        suitId = Math.floor(Number(suitId))

        if (num <= 0) {
            return await sendMsgToClient(ctx, 1001, 'args error', [])
        }

        if(suitId != 3 && suitId != 5 && suitId != 7 && suitId != 10) {
            return await sendMsgToClient(ctx, 1001, 'args error', [])
        }
        if (!TronWeb.isAddress(addr)) {
            return await sendMsgToClient(ctx, 1001, 'args error', [])
        }
        let signResult = await tronUtils.verifySignature(sign, addr)
        if (!signResult) {
            return await sendMsgToClient(ctx, 1001, 'sign failed', [])
        }
    } catch (error) {
        return await sendMsgToClient(ctx, 1001, 'args error', [])
    }

    let isGidsEnough  = await userinfo.assertExchangeNumber(addr, num, suitId)
    if(!isGidsEnough) {
        return await sendMsgToClient(ctx, 1005, 'number not enough!!! check again', [])
    }

    
    let lottery = boxConf.lottery[suitId] * num

    let round = Math.floor((now - startTs) / interval)

    
    let price = boxConf.suitPrices[suitId]
    let score = boxConf.suitScore[suitId] * num
    let amount = price * num

    let balance = await tronUtils.getAccBalance()
     
    if (balance < amount) {
        return await sendMsgToClient(ctx, 1004, 'balance not enough, try later please!', [])
    }

    let conn = null
    try {
        conn = await db.getConnection()
        if (conn == null) {
            return await sendMsgToClient(ctx, 1100, 'Out of serivce, please wait', [])
        }
        // 扣除箱子
        for (let index = 1; index <= suitId; index++) {
            await  userinfo.subUserBag(addr, index, num, conn)
        }

        //if (now < endTs) {
         ///   await userinfo.addUserScore(addr, round, score)
         //   if (lottery >0) {
         //       await userinfo.addUserLtynum(addr, lottery)
         //   }
        //}

        await userinfo.addUserScore(addr, round, score)
        if (lottery >0) {
            await userinfo.addUserLtynum(addr, lottery)
        }
        conn.commit()
    } catch (error) {
        console.log(error)
        if (conn) conn.rollback()
        return await sendMsgToClient(ctx, 1005, 'poker number not enough', [])
    } finally {
        if (conn) conn.release()
    }

    let tx = await tronUtils.sendTRX(addr, amount)
    if (tx.result != true) {
        console.log('==================> pay failed, infomation : ', {addr, amount})
        return await sendMsgToClient(ctx, 1006, 'pay to user failed!!', [])
    }

    try {
        conn = await db.getConnection()
        if (conn == null) {
            return await sendMsgToClient(ctx, 1100, 'Out of serivce, please wait', [])
        }

        conn.beginTransaction()
        // 添加日志概览 
        await userinfo.addOverLog(addr, 3, num * price, now, conn)

        // 添加详细日志
        let log_id = await userinfo.getOverviewMaxId(addr, conn)
        await userinfo.addPay2UserLog(addr,  tx.transaction.txID, amount, now, log_id, conn)

        for (let index = 1; index <= suitId; index++) {
            await userinfo.addDetailLog(log_id, index, num, conn)
        }
        conn.commit()

    } catch (error) {
        console.log(error)
        if (conn) conn.rollback()
        return await sendMsgToClient(ctx, 1005, 'number not enough', [])
    } finally {
        if (conn) conn.release()
    }
    await bags(ctx)
}

async function rank(ctx) {
    let params = ctx.request.body
    let addr = params.addr
    let now = new Date().getTime()
    let round = Math.floor((now - startTs) / interval)
    //if (round > 7) round = 7

    if (!addr || !TronWeb.isAddress(addr)) {
        addr = 'abc'
    }

    let allRank = await userinfo.allRank(round, 50)
    let meScore = await userinfo.meScore(addr, round)
    let meRank = await userinfo.meRank(round, meScore)
    if (meRank) meRank = meRank + 1
    let meRward = 0

    let meName = addr

    let final = []

    for (let i = 0;i< allRank.length; i++){
        let name = allRank[i].addr
        let _name = await redisUtil.hget("player:info:" + name, "name")
        if (_name && _name != '') {
            name = _name;
        }

        if (addr == allRank[i].addr) {
            meRank = i + 1
            meName = name
            meRward = rewards[i]
        }
        let tmp = {
            rank : i + 1,
            reward : rewards[i],
            name : name,
            score :allRank[i].score,
            addr : allRank[i].addr
        }

        final.push(tmp)
    }

    let _name = await redisUtil.hget("player:info:" + meName, "name")
    if (_name && _name != '') {
        meName = _name;
    }

    if (addr == 'abc') {
        meRank = '-'
    }

    if (allRank.length < 50) {
        let tmpLength = allRank.length
        for (let i=0; i< 50 - tmpLength; i++){
            final.push({rank : tmpLength + 1 + i, score : 0, addr : '-', reward : rewards[tmpLength + i], name : '-'})
        }
    }
    return await sendMsgToClient(ctx, 0, '', {rank : final, me : {rank : meRank || '-', reward :meRward, name : meName, score : meScore, addr : addr == 'abc' ? '-' : addr}})
}

async function totalRank(ctx) {
    let params = ctx.request.body
    let addr = params.addr
    let now = new Date().getTime()

    if (!addr || !TronWeb.isAddress(addr)) {
        addr = 'abc'
    }

    let allRank = await userinfo.allTotalRank(50)
    let meScore = await userinfo.meTotalScore(addr)
    let meRank = '-'
    let meRward = 0
    let meName = addr

    let final = []

    for (let i = 0;i< allRank.length; i++){
        let name = allRank[i].addr
        let _name = await redisUtil.hget("player:info:" + name, "name")
        if (_name && _name != '') {
            name = _name;
        }

        if (addr == allRank[i].addr) {
            meRank = i + 1
            meName = name
            meRward = rewards[i] * 3
        }
        let tmp = {
            rank : i + 1,
            reward : rewards[i] * 3,
            name : name,
            score :allRank[i].score,
            addr : allRank[i].addr
        }

        final.push(tmp)
    }

    let _name = await redisUtil.hget("player:info:" + meName, "name")
    if (_name && _name != '') {
        meName = _name;
    }

    if (allRank.length < 50) {
        let tmpLength = allRank.length
        for (let i=0; i< 50 - tmpLength; i++){
            final.push({rank : tmpLength + 1 + i, score : 0, addr : '-', reward : rewards[tmpLength + i] * 3, name : '-'})
        }
    }

    return await sendMsgToClient(ctx, 0, '', {rank : final, me : {rank : meRank || '-', reward :meRward, name : meName, score : meScore, addr : addr == 'abc' ? '-' : addr}})
}

async function startLottry(ctx) {
    let params = ctx.request.body
    let addr = params.addr
    let sign = params.sign
    let now = new Date().getTime()

    //基本参数检测
    try {
        if (!TronWeb.isAddress(addr)) {
            return await sendMsgToClient(ctx, 1001, 'args error', [])
        }
        let signResult = await tronUtils.verifySignature(sign, addr)
        if (!signResult) {
            return await sendMsgToClient(ctx, 1001, 'sign failed', [])
        }
    } catch (error) {
        return await sendMsgToClient(ctx, 1001, 'args error', [])
    }

    let box = await userinfo.getBoxs(addr)
    if (box.ltyNum < 1) return await sendMsgToClient(ctx, 1005, 'number not enough', [])

    // let userLotteryNum = redisUtil.hincrby('tronbetEvent', addr, 1)
    //判断抽奖中宝马的逻辑TODO
    let ltyId = 1
    let hasBMW = await common.randomBMW()
    if (hasBMW) {
        let BMWNUM = await redisUtil.hincrby('tronbetEvent', 'bmwRandomnum1', 1)
        if (BMWNUM == 1) {
            ltyId = 10
        } else {
            ltyId = await common.lottery()
        }
    } else {
        ltyId = await common.lottery()
    }
    
    let types = 'jail'
    let num = 0
    
    // let ltyId = 7
    let lotrewards ={
       1: {type: 'jail', num : 0, order: 1},
       4: {type: 'trx', num : 20, order: 2},
       7: {type: 'free', num : 0, order: 3},
       5: {type: 'score', num : 200, order: 4},
       9: {type: 'free', num : 0, order: 5}, 
       2: {type: 'jail', num : 0, order: 6},
       6: {type: 'trx', num : 50, order: 7},
       8: {type: 'free', num : 0, order: 8},
       3: {type: 'score', num : 100, order: 9},
       10: {type: 'bmw', num : 1, order: 10}
    }
    //什么情况下等于10？TODO
    let result = []
    let angle = randomAngle(lotrewards[ltyId].order - 1)
    if (lotrewards[ltyId].type == 'jail') {
        result.push({...lotrewards[ltyId], angle})
    } else if (lotrewards[ltyId].type == 'trx') {
        types = "trx"
        num = lotrewards[ltyId].num
        result.push({...lotrewards[ltyId], angle})
    } else if (lotrewards[ltyId].type == 'score') {
        types = "score"
        num = lotrewards[ltyId].num
        result.push({...lotrewards[ltyId], angle})
    } else if (lotrewards[ltyId].type == 'free') {
        let isWardTrxRes = await common.isWardTrx()
        if (isWardTrxRes) {
            num = await common.randTrx()
            types = 'rTrx'
            result.push({type: 'rTrx', order: lotrewards[ltyId].order, angle, num})
        } else {
            let multi = await common.randomMulti()
            result.push({type: 'multi', num : multi, order: lotrewards[ltyId].order, angle})

            let ltyIdNew = await common.lotteryFree()
            let Newangle = randomAngle(lotrewards[ltyIdNew].order - 1)
            types = lotrewards[ltyIdNew].type
            num = lotrewards[ltyIdNew].num * multi

            result.push({...lotrewards[ltyIdNew], angle : Newangle})
        }
    } else if (ltyId == 10) {
        let bmwNum = await redisUtil.hincrby('tronbetEvent', 'bmwNum1', 1)
        if (bmwNum > 1) {
            num = 0
            ltyId = 1
        } else {
            types = "bmw"
            num = 1
        }

        let Newangle = randomAngle(lotrewards[ltyId].order - 1)
        types = lotrewards[ltyId].type
        num = lotrewards[ltyId].num

        result.push({...lotrewards[ltyId], angle : Newangle})
    }

    let log_id = await redisUtil.hincrby('tronbetEvent', 'pay2UserLogId', 1)
    try {
        conn = await db.getConnection()
        if (conn == null) {
            return await sendMsgToClient(ctx, 1100, 'Out of serivce, please wait', [])
        }
        conn.beginTransaction()
        
        // 添加详细日志
        await userinfo.addLotteryLog(addr, ltyId, types, num, log_id, conn),
        await userinfo.decreaseUserLtynum(addr, conn)
        conn.commit()

    } catch (error) {
        console.log(error)
        if (conn) conn.rollback()
        return await sendMsgToClient(ctx, 1005, 'number not enough', [])
    } finally {
        if (conn) conn.release()
    }

    if (types == 'trx' || types == 'rTrx') {
        appEvent.emit('pay2User', addr, num, log_id)
    } else if (types == 'score') {
        if (now <= endTs){
            let round = Math.floor((now - startTs) / interval)
            await userinfo.addUserScore(addr, round, num)
        }
    }

    return await sendMsgToClient(ctx, 0, 'success', result)
}

function randomAngle(num) {
    return (_.random(36 * num + 4, 36 * (num+1) - 4) + 720 * 1.5).toFixed(1)
}

appEvent.on('pay2User',(addr, amount, log_id) => {
    let timer1 = setTimeout(async () => {
        clearTimeout(timer1)
        let now = new Date().getTime()
        await userinfo.addPay2UserLog(addr,  '', amount, now, log_id, conn)
        let res = await pay2User(addr, amount, log_id)
        if (!res) {
            await pay2User(addr, amount, log_id)
        }
    }, 200)
})

async function pay2User(addr, amount, log_id){
    let tx = await tronUtils.sendTRX(addr, amount)
    if (tx.result != true) {
        return false
    }
    console.log(`pay2User ${addr}, amount = ${amount}, log_id => ${log_id}, txId ${tx.transaction.txID}`)
    try {
        await userinfo.updatePay2UserTx(log_id, tx.transaction.txID)
    } catch (error) {
        console.log(error)
        return true
    }
    return true
}

async function getLotteryLogs(ctx) {
    let params = ctx.request.body
    let addr = params.addr
    let sign = params.sign

    let res = await userinfo.getLotLogs(addr, 20)
    return sendMsgToClient(ctx, 0, 'success', res)
}

async function getLuckyUser(ctx) {
    try {
        let res = await redisUtil.hget('tronbetEvent', 'veryLuckyBoy')
        if (res) {
            return await sendMsgToClient(ctx, 0, 'success', JSON.parse(res))
        }  
    } catch (error) {
        console.log(error)
    }
    return await sendMsgToClient(ctx, 0, 'success', [])
}

module.exports = {
    logs,
    bags,
    openBox,
    sell,
    exchange,
    rank,
    totalRank,
    startLottry,
    getLotteryLogs,
    getLuckyUser
}