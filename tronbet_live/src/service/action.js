

const usermodel = require('../model/userinfo')
const db = require('../utils/dbUtil')
const log4js = require('../configs/log4js_config')
const loggerDefault = log4js.getLogger('print')
const _ = require('lodash')._
const crypto = require("crypto")
const {softswiss}  = require('../configs/config')
const evnets = require('events')
const common = require('../utils/common')
const actionEvent = new evnets.EventEmitter()

async function play(ctx) {
    let params = ctx.request.body
    loggerDefault.info('softwiss call play, parmas: ')
    loggerDefault.info(params)
    let sessionId = params.session_id
    let userId = params.user_id
    let game = params.game || '-'
    let gameId = params.game_id || '-'
    let finished = params.finished
    let actions = params.actions

    let computedSignature = crypto.createHmac("sha256", softswiss.AUTH_TOKEN).update(JSON.stringify(params)).digest("hex")

    if (ctx.request.header['X-REQUEST-SIGN'] != computedSignature) {
        console.log('Security Check Failed', computedSignature, ctx.request.header['X-REQUEST-SIGN'])
    }

    if (!sessionId) {
        ctx.status = 402
        ctx.body = 'args error'
        return
    }

    if (userId == null) {
        userId = await usermodel.getAddrBySessionId(sessionId)
        if (_.isEmpty(userId)) {
            ctx.status = 101
            ctx.body = 'Player is invalid'
            return
        } else {
            userId = userId[0].addr
        }
    }

    let amount = await usermodel.getUserBalanceBySessionId(sessionId)
    amount = amount || 0
    //没有参数, 只返回余额
    if (actions == undefined || _.isEmpty(actions)) {
        let result = {
            balance : amount
        }
        ctx.body = JSON.stringify(result)
        return
    }

    let final = {
        balance : 0,
        game_id : gameId,
        transactions : []
    }

    let conn = null
    try {
        conn = await db.getConnection()

        if (conn == null) {
            ctx.status = 500
            ctx.body = 'failed get db connection'
            return
        }

        conn.beginTransaction()

        //bet和win的处理是一模一样的, 但是应该是先bet后win, 所以分开两次循环处理,  
        for (let action of actions) {
            if (action.action == 'bet') {
                let types = action.action
                let actionId = action.action_id
                let amount = action.amount * 1e6
                let txId  = common.getRandomSeed()
                //todo bet
                //扣钱 //记日志
                await usermodel.userAction(userId, types, actionId, amount, txId, game, gameId, conn)

                let tmp = {
                    action_id : actionId,
                    tx_id : txId,
                }
                final.transactions.push(tmp)
            }
        }
        for (let action of actions) {
            if (action.action == 'win') {
                let types = action.action
                let actionId = action.action_id
                let amount = action.amount * 1e6
                let txId  = common.getRandomSeed()
                await usermodel.userAction(userId, types, actionId, amount, txId, game, gameId, conn)
                let tmp = {
                    action_id : actionId,
                    tx_id : txId,
                }
                final.transactions.push(tmp)
            }
        }

        //回滚操作
        for (let action of actions) {
            if (action.action == 'rollback') {
                //todo rollback
                let actionId = action.action_id
                let originalActionId = action.original_action_id
                let txId  = common.getRandomSeed()
                //找到相应的actionId, 进行逆操作
                await usermodel.userRollBack(actionId, originalActionId, txId, conn)

                let tmp = {
                    action_id : actionId,
                    tx_id : txId,
                }
                final.transactions.push(tmp)
            }
        }
        conn.commit()
    } catch (error) {
        loggerDefault.error(error)
        conn.rollback()
        if (error.code == 'ER_WARN_DATA_OUT_OF_RANGE') {
            let tmp = {
                code : 100,
                message : 'Not enough funds',
                balance : amount
            }
            ctx.status = 412
            ctx.body = JSON.stringify(tmp)
            return
        }
        
    } finally {
        if (conn) conn.release()
    }

    if (_.isEmpty(final.transactions)) {
        for (let action of actions) {
           
            let tmp = {
                action_id : action.action_id,
                tx_id : '',
            }

            final.transactions.push(tmp)
        }
    }

    let amount1 = await usermodel.getUserBalance(userId)
    amount1 = amount1 || 0
    final.balance = amount1

    ctx.body = JSON.stringify(final)
}


// 空投
actionEvent.on('airdrop', (addr, actionId, amount) => {
    let timer = setTimeout(async () =>{
        console.log(addr, actionId, amount)
        clearTimeout(timer)
    }, 600)
})



var actions = {play}

module.exports = actions