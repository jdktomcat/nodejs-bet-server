/**
 * Tronbet Live
 */

const usermodel = require('../model/usermodel')
const _ = require('lodash')._
const log4js = require('../configs/log4js.config')
const logger = log4js.getLogger('print')
const evnets = require('events')
const common = require('../utils/common')
const ss = require('../utils/tronUtil')
const redisUtil = require('../utils/redisUtil')
const tronConf = require('../configs/config').tronConfig
const addition = require('../configs/config').addition
const tronUtils = require('../utils/tronUtil')

const tokenEnvent = new evnets.EventEmitter()
const totalToken = 1000000000
const stageAmount = 2000000
const redisStakersKey = 'aridrop:stakers'
const intervalTs = 300000

let isChecking = false


async function getAnteAddtion(addr) {
    let anteAmount = await redisUtil.hget(redisStakersKey, addr)
    if (!anteAmount) {
        anteAmount = 0
    } else {
        anteAmount = Number(anteAmount)
    }
    if (anteAmount < 1375000) {
        return 1
    } else if (anteAmount >= 1375000 && anteAmount < 2750000) {
        return 1.005
    } else if (anteAmount >= 2750000 && anteAmount < 13750000) {
        return 1.01
    } else if (anteAmount >= 13750000 && anteAmount < 27500000) {
        return 1.02
    } else if (anteAmount >= 27500000 && anteAmount < 55000000) {
        return 1.03
    } else if (anteAmount >= 55000000 && anteAmount < 137500000) {
        return 1.04
    } else if ( anteAmount >= 137500000){
        return 1.05
    }
    return 1
}

async function getMinedAnte(addr, amount, minedAmount) {
    let stage = Math.floor(minedAmount / stageAmount)
    if (stage < 0) {
        stage = 600  // 获取失败的情况下按照中间阶段发
    }
    let liveTokenPerTrx = stage * 6 + 600
    let liveTokenAmount = (amount / liveTokenPerTrx) * (await getAnteAddtion(addr))
    return Math.floor(liveTokenAmount)
}

async function check() {
    if (!isChecking) {
        tokenEnvent.emit('checkAirDropLog', new Date().getTime())
    } else {
        console.log('maybe data too much, still checking ..........')
    }

}

async function airdrop() {
    // 查询数据

    let failedCount = await usermodel.getUnconfirmedCount()

    if (failedCount >= 100000) {
        console.log('!!!!!!!!!!!!!!!!====!!!!!!!!!!!!!!!!!!!, failed too much, stop airdrop now, try waiting for check function to fix it')
        return
    }


    let startTs = await usermodel.getMaxEndTs()

    let endTs = Math.floor(new Date().getTime() / 10000) * 10

    // if (endTs <= startTs) {
    //     console.log('just airdrop now, skip this round')
    //     return
    // }

    console.log('startTs, endTs-------->', startTs, endTs)

    let datas = await usermodel.getLiveAirdropData(startTs, endTs)

    logger.info('===================data.length==================', datas.length)

    // return 
    //计算当前挖了多少
    let stopFlag = false
    let tokenBalance = await tronUtils.tronQuery(tronConf.livePoolAddr, 'getPoolRakeBalance()', 5e6, 0, []).catch((err) => {
        console.log(err)
        stopFlag = true
        return
    })

    if(stopFlag) {
        console.log('==========GET TOKEN BALANCE FAILED===========')
        return
    }

    console.log('========tokenBalance==============>', tokenBalance)
    tokenBalance = tronUtils.hexStringToBigNumber(tokenBalance).toNumber()
    tokenBalance = Math.floor(tokenBalance / 1e6)
    if (tokenBalance <= 0) {
        console.log('rake token balance not enough!!!')
        return
    }

    let minedAmount = totalToken - tokenBalance
    console.log('-----,minedAmount,tokenBalance', minedAmount, tokenBalance)

    if (_.isEmpty(datas)) {
        logger.warn('can not find rake bet data! -----> skip...')
        return
    }
    //空投
    for (let item of datas) {
        let adAmount = await getMinedAnte(item.addr, item.Amount, minedAmount)  //
        if (item.airDropAmount && item.airDropAmount != 0) {
            let extra = Math.floor(item.airDropAmount) || 1
            adAmount += extra
        }
        if (adAmount / 1e6 > tokenBalance) {
            console.log('token balance not eough')
            continue
        }
        minedAmount += (adAmount / 1e6)
        if (adAmount <= 0) continue

        // poker 开挖矿倍率活动 
        let _now = _.now();
        if (_now > addition.START_TS && _now < addition.END_TS){
            // adAmount = adAmount * 2;
            console.log("adAmount", addition.RATE, adAmount);
            adAmount = adAmount * addition.RATE;
            console.log("adAmount", addition.RATE, adAmount);

        }

        logger.info('===========addr, betAmount, adAmount==========>', item.addr, item.Amount, adAmount)
        tokenEnvent.emit('dblogs', item.addr, startTs, endTs, item.Amount, adAmount)
        await common.sleep(15)
    }

    //不在这里做检测， 这里只是负责把每一段时间的数据保存起来， 并且尝试空投， 整体只检测一次， 如果失败就放弃， 等待check函数确认

}

tokenEnvent.on('checkAirDropLog', async (nowTime) => {
    try {
        let canConfirmedEndTs = Math.floor(nowTime / 1000) - 150 //一般区块确认需要1分钟， 这里等待2分钟半钟
        let res = await usermodel.getAirdropFailedData(canConfirmedEndTs)
        if (_.isEmpty(res)) {
            console.log('nice, everyone get his token!!!!')
            return false
        }

        for (let one of res) {
            let isSuccessed = await tronUtils.isTxConfirmed(one.txId || '459f3ae6735b88e1ab3bf54c2c29738de829df7731c645a26e9220bd827397b0').catch((error) => {
                console.log('----------isSuccessed---------',error)
            })
            if (isSuccessed) {
                await usermodel.updateAirdropLogConfirmed(one.addr, one.startTs, one.endTs)
                continue
            }
            tokenEnvent.emit('sendToken', one.addr, one.adAmount, one.startTs, one.endTs)
            await common.sleep(50)
        }
    } catch (error) {
        logger.error(error)
        return
    } finally {
        isChecking = false
    }
})

tokenEnvent.on('dblogs', async (addr, startTs, endTs, betAmount, adAmount) => {
    try {
        let realStartTs = await usermodel.getUserMaxEndTs(addr)
        if (realStartTs >= endTs){
            console.error('===========addr, realStartTs, endTs, invalidate data =>>>>>>>>> ', addr, realStartTs, endTs)
            return
        }
        await usermodel.liveAirdropLog(addr, realStartTs, endTs, betAmount, adAmount)
        logger.info('==========save db log===========>', addr, realStartTs, endTs, betAmount, adAmount)
        tokenEnvent.emit('sendToken', addr, adAmount, realStartTs, endTs) // 如果前一次空托失败， 本次一定会失败， 等待下次检测的时候， 重新提交
    } catch (error) {
        logger.error(error)
        return
    }
})

tokenEnvent.on('sendToken', (addr, amount, startTs, endTs) => {
    let timer = setTimeout(async () => {
        try {
            logger.info('================sendToken============', addr, amount)
            let sendRes = await tronUtils.tronExec(tronConf.livePoolAddr, 'airdropRakeSync(address,uint256,uint128,uint128,uint256)', 5e6, 0, [
                { type: 'address', value: addr },
                { type: 'uint256', value: amount },
                { type: 'uint128', value: startTs },
                { type: 'uint128', value: endTs },
                { type: 'uint256', value: '0x' + startTs + '' + endTs },
            ])
            if (sendRes.result == 'REVERT') {
                console.error('xxxxxxxxxxxxxxREVERTxxxxxxxxxxxxxxxxxxx')
            } else if (sendRes.result != true) {
                tokenEnvent.emit('sendToken', addr, amount, startTs, endTs)
            } else {
                tokenEnvent.emit('sendTokenConfirm', addr, amount, sendRes.transaction.txID, startTs, endTs, 3)
            }
        } catch (error) {
            logger.error(error)
            return
        }
    }, 1000)
})


tokenEnvent.on('sendTokenConfirm', (addr, amount, txId, startTs, endTs, tryTimes) => {
    let timeer = setTimeout(async () => {
        clearTimeout(timeer)
        logger.info('================sendTokenConfirm============', addr, amount, txId, tryTimes)
        if (tryTimes <= 0) {
            logger.error('txid', txId, ' confirmed failed!!!!!!! please check it.')
            return
        }
        let confirmResult = await tronUtils.isTxSuccesssed(txId)
        if (!confirmResult) {
            logger.info('confirm txid', { addr, amount, txId }, tryTimes - 1)
            tokenEnvent.emit('sendTokenConfirm', addr, amount, txId, startTs, endTs, tryTimes - 1)
            return
        }
        let res = await usermodel.updateAirdropLog(addr, startTs, endTs, txId)
        logger.info('----------------------------sendTokenConfirm done------------------------------', addr, startTs, endTs, txId, tryTimes)
    }, 10000)
})

module.exports = {
    airdrop,
    check,
}