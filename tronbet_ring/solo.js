const conf = require('./src/configs/config')
const BigNumber = require('bignumber.js')
const moment = require('moment')
const _ = require('lodash')._
const log4js = require('./src/configs/log4js.config')
const loggerDefault = log4js.getLogger('solo')
const loggerError = log4js.getLogger('error')
const dbService = require('./dbService')
const tronWheel = require('./tronWheel')
const tronUtil = require('./tronUtil')
const bigNumberUtil = require('./src/utils/utilBigNumber')
const sha3 = require('js-sha3')
const TronWeb = require('tronweb')
var shajs = require('sha.js')
const sha3_256 = sha3.sha3_256
const evnets = require('events')
var fs = require("fs")
const EXP_MAP = require('./src/configs/exp')
const appEvent = new evnets.EventEmitter()
let io = require('./wheelSocket').getIo()

const scanBlocknumFileName = 'solo.blocknum';


const ROOM_FINISHED_STATUS = 2  //合约内部标识该房间对战完成
const ROOM_CANCELD_STATUS = 99
let ONLINE_NAME = {}

const BROADCAST_INTERVAL_TS = conf.wheel.BROADCAST_INTERVAL_TS
const APP_KEY = conf.wheel.APP_KEY
const RANDOM_SALT_1 = conf.wheel.RANDOM_SALT_1
const RANDOM_SALT_2 = conf.wheel.RANDOM_SALT_2
const RANDOM_SALT_3 = conf.wheel.RANDOM_SALT_3

const EVENT_CODE_ROOM_CREATE = sha3.keccak256("RingPvpNew(address,uint256,uint256,uint256,uint256,uint256)")
const EVENT_CODE_ROOM_JOIN = sha3.keccak256("RingPvpJoin(address,uint256,uint256,uint256,uint256,uint256)")


let tempRdm = ''   //上次随机种子
let isWorking = true

const redis = require("redis").createClient({
    host: conf.redisConfig.host,
    port: conf.redisConfig.port,
    password: conf.redisConfig.pwd,
    db: conf.redisConfig.db
})



const SOLO_STATUS = {
    CREATE : 0,
    READY : 1,
    FIGHTING : 2,
    FINISHED : 3,
    CANCELD : 4,
}


let ROOMS_MAP = {
    // roomId : info,
}


async function randomAngle(num, PlayerCnt) {
    num = num -1
    return (_.random(360/PlayerCnt * num + 0.4, 360/PlayerCnt*(num+1) - 2.6) + 1440).toFixed(1)
}

async function createRandom() {
    let _now = Date.now() + 5211
    let _random = _.random(100000000, 999999999) - 1949
    let _result = sha3_256(sha3_256(APP_KEY + _now + RANDOM_SALT_1) + _random + RANDOM_SALT_2 + tempRdm + RANDOM_SALT_3)
    tempRdm = _result
    return _result
}

async function compute(_hash, PlayerCnt) {
    let _number = (new BigNumber(_hash, 16)).mod(PlayerCnt).toNumber()
    return _number
}

function randomString(range) {
    let str = "",
      arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
        'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
        'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        '-'];

    for (let i = 0; i < range; i++) {
      pos = Math.round(Math.random() * (arr.length - 1))
      str += arr[pos]
    }
    return str
}

//获取本地已解决的ROOMId
async function getLocalMaxSettledRoomId() {
    return await hget('ring:solo:room', 'settledId')
}


//获取本地已经拉取的RoomId
async function getLocalMaxCreateRoomId() {
    return await hget('ring:solo:room', 'createId')
}

//保存房间数据
async function saveNewestRoom2Redis(roomInfo){
    await hset('ring:solo:room', 'roomInfo', JSON.stringify(roomInfo))
}

//结构化房间数据
async function newRoom(roomInfo, ts, tx) {
    let result = {
        roomId : roomInfo.roomId,
        createTs : ts,
        localStatus : 0,
        endTs : 0,
        settle : 0,
        amount : roomInfo.amount,
        settleTx : '',
        playerCnt : roomInfo.playerCnt,
        status : SOLO_STATUS.CREATE,
        player1 : roomInfo.player1,
        player2 : roomInfo.player2,
        player3 : roomInfo.player3,
        player4 : roomInfo.player4,
        seatId : roomInfo.seatId,
        settleRetry : 0,
        retry : 0,
        player1Tx : '',
        player2Tx : '',
        player3Tx : '',
        player4Tx : '',
    }

    //本地没有保存结果时, 才重新生成数据
    let localroom = ROOMS_MAP[roomInfo.roomId]
    if (!localroom) {
        result.seed = await createRandom()
        let prefix = await createRandom()
        result.salt =  prefix.substr(0, 16) + randomString(16)
        result.luckyNum = await compute(result.seed, roomInfo.playerCnt)
        result.hash = new shajs.sha256().update(result.salt + result.luckyNum).digest('hex')
        result.angle = await randomAngle(result.luckyNum, roomInfo.playerCnt)
    } else {
        result.seed = localroom.seed
        result.salt =  localroom.salt
        result.luckyNum = localroom.luckyNum
        result.hash = localroom.hash
        result.angle = localroom.angle
    }
    ROOMS_MAP[roomInfo.roomId] = result   //添加数据本地
    await saveRoomInfo2Redis(result)
    await saveLocalRunInfo2Redis()
    return result
}


async function updateLocalRoomInfo(localRoom, blockRoom) {
    localRoom.player1 = blockRoom.player1
    localRoom.player2 = blockRoom.player2
    localRoom.player3 = blockRoom.player3
    localRoom.player4 = blockRoom.player4
}


//创建房间
async function createRoom(info) {
    try {
        let roomInfo = await tronWheel.FindRoomById(info.roomId)
        let result = await newRoom(roomInfo, info.ts, info.tx)
        await setTxToPlayer(result, info)
        //通知客户端TODO
        NoticeRoomsUpdate(roomInfo.roomId)
        return true
    } catch (error) {
        loggerDefault.info(error)
        return false
    }
}

async function setTxToPlayer(room, userInfo) {
    if (room.player1 != null && TronWeb.isAddress(room.player1) && room.player1 == userInfo.addr) {
        room.player1Tx = userInfo.tx
    } else if (room.player2 != null && TronWeb.isAddress(room.player2) && room.player2 == userInfo.addr) {
        room.player2Tx = userInfo.tx
    } else if (room.player3 != null && TronWeb.isAddress(room.player3) && room.player3 == userInfo.addr) {
        room.player3Tx = userInfo.tx
    } else if (room.player4 != null && TronWeb.isAddress(room.player4) && room.player4 == userInfo.addr) {
        room.player4Tx = userInfo.tx
    } else {
        loggerDefault.info('WTF!!!!, can not find the address in room, address => ', userInfo.addr)
    }
}


async function updateRoomInfo(room) {
    let roomInfo = await tronWheel.FindRoomById(room.roomId)
    if (roomInfo.amount != room.amount) {
        loggerDefault.info('WTF!!, the amount is different : order addr ->', room.amount)
    }

    //没有房间信息则先创建
    let localRoom = ROOMS_MAP[room.roomId]
    if (!localRoom) {
        await createRoom(room)
    }

    if (roomInfo) {
        roomInfo.addr = room.addr
        roomInfo.tx = room.tx
        await updateRoom(roomInfo)
        await saveLocalRunInfo2Redis()
        return true
    }

    return false
}

//每当用户下单的时候, 更新房间
async function updateRoom(info) {
    let room = ROOMS_MAP[info.roomId]
    if (!room) {
        await createRoom(info)
        room = ROOMS_MAP[info.roomId]
    } else {
        room.player1 = info.player1
        room.player2 = info.player2
        room.player3 = info.player3
        room.player4 = info.player4
        room.playerCnt = info.playerCnt
        room.seatId = info.seatId
    }
    let nowPlayerCnt = await countPlayer(room)
    NoticeRoomsUpdate(room.roomId)
    await setTxToPlayer(room, info)
    await saveRoomInfo2Redis(room)
    if (nowPlayerCnt >= info.playerCnt) {
        NoticeRoomFull(room.roomId)
        appEvent.emit('settle_room', room.roomId, room.seed)
        room.status = SOLO_STATUS.READY
    } else {
        loggerDefault.info('someone enter the room : ', room.roomId, ' but players not enough, waiting next player')
    }
}

async function countPlayer(room) {
    let result = 0
    if (room.player1 != null && TronWeb.isAddress(room.player1)) {
        result += 1
    }
    if (room.player2 != null && TronWeb.isAddress(room.player2)) {
        result += 1
    }
    if (room.player3 != null && TronWeb.isAddress(room.player3)) {
        result += 1
    }
    if (room.player4 != null && TronWeb.isAddress(room.player4)) {
        result += 1
    }
    return result
}

async function RecordBlockNum(block_num) {
    try {
        fs.writeFile(scanBlocknumFileName, block_num, (err, data) =>{
        })
    } catch(e) {
        loggerDefault.info('Failed....')
    }
    return true
}

async function getMaxBlockNum() {
    try {
        var data = fs.readFileSync(scanBlocknumFileName);
        let blockNum = Number(data.toString())
        if (blockNum <=  conf.wheel.startBlockNum) return  conf.wheel.startBlockNum
        return blockNum
    } catch(e) {
        loggerDefault.info(e)
        return conf.wheel.startBlockNum
    }
}

async function alysisBlockData(blockData, blockNumber) {
    let ts = blockData.block_header.raw_data.timestamp;
    let startTs = new Date().getTime()
    let transactions = blockData.transactions;
    let result = true
    if (transactions && !_.isEmpty(transactions) && _.isArray(transactions) && transactions.length > 0) {
        let txCount = transactions ? transactions.length : 0;
        loggerDefault.info("-----------------------------------------------------------------------------------------------------------------", blockNumber);
        loggerDefault.info("TRX区块:" + blockNumber + "; 出块时间:" + moment(ts).format('YYYY-MM-DD HH:mm:ss') + "; transaction num:" + txCount +'; blockId:' + blockData.blockID);
        await Promise.all(transactions.map(async (txInfo) => {
            if (txInfo.ret[0].contractRet != 'SUCCESS') {
                return
            }
            let tmp = await alysisTxs(txInfo)
            if (!tmp) {
                loggerDefault.info('-------------------blockNumber----------failed---', blockNumber)
                result = false
            }
        }))
    }
    return result
}

async function alysisTxs(tx){
    let txID = tx.txID;
    let raw_data = tx.raw_data;
    let contract = raw_data.contract;
    let timestamp = raw_data.timestamp;
    let res = null;
    for (let _contract of contract) {
        let type = _contract.type;
        if (type === "TriggerSmartContract") { //调用合约
            let value = _contract.parameter.value;
            let contract_address = value.contract_address; //触发合约时有效

            let call_value = value.call_value || 0; //涉及金额 (单位:sun)
            let data = value.data; //触发合约时有效
            if (contract_address == null) {
                continue
            // } else if (contract_address === conf.wheel.soloOrderAddr) {
            } else if (contract_address === conf.wheel.soloOrderAddr) { // 创建房间
                let txInfo = await tronUtil.gettransactioninfobyid(txID)
                let logs = txInfo.log;
                if (txInfo.resMessage) {
                    res.resMessage = hextoString(txInfo.resMessage);
                }
                // loggerDefault.info(logs)
                if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
                    for (let _log of logs) {
                        // loggerDefault.info("_log",_log);
                        // loggerDefault.info(_log)
                        let event_contract_address = "41" + _log.address;
                        let hexTopics = _log.topics
                        let hexData = _log.data;
                        let eventCode = hexTopics[0];
                        if (eventCode === EVENT_CODE_ROOM_CREATE) {
                            let _playerAddr = tronUtil.hexStringToTronAddress(hexTopics[1].substr(24, 40))
                            let log = {
                                roomId: tronUtil.hexStringToBigNumber(hexTopics[2]).toNumber(),
                                ts : timestamp,
                                tx : txID,
                                addr : _playerAddr
                            }
                            loggerDefault.info(log)
                            let result = await createRoom(log)
                            if (!result) {
                                return false
                            }
                        } else if(eventCode === EVENT_CODE_ROOM_JOIN) {
                            let _room_id = tronUtil.hexStringToBigNumber(hexTopics[2].substr(0, 64)).toNumber()
                            let _playerAddr = tronUtil.hexStringToTronAddress(hexTopics[1].substr(24, 40))
                            let _amount = tronUtil.hexStringToBigNumber(hexData.substr(128, 64)).toNumber()
                            let resultInfo = {
                                roomId : _room_id,
                                addr : _playerAddr,
                                amount : _amount / 1e6,
                                ts : timestamp,
                                tx : txID
                            }
                            loggerDefault.info(resultInfo)
                            let result = await updateRoomInfo(resultInfo)
                            if (!result) {
                                return false
                            }
                        }
                    }
                }
            }
        }
    }
    return true
}

//主线程, just run
async function run() {
    setInterval(async () => {
        if (ROOMS_MAP == null) return;
        let _now = Date.now();
        // 每隔一分钟分钟, 尝试扫描一次那些ROOM是过期的
        await findRoomTimeOut()
    }, BROADCAST_INTERVAL_TS * 60);
}


async function soloStart() {
    let blockNum = await getMaxBlockNum()
    loggerDefault.info('--------------blockNum-----------------', blockNum)
    ROOMS_MAP = await getLocalRunInfoFromRedis()
    for (let _room_id in ROOMS_MAP) {
        let room = ROOMS_MAP[_room_id]
        let nowPlayerCnt = await countPlayer(room)
        if (nowPlayerCnt >= room.playerCnt) {
            appEvent.emit('settle_room', room.roomId, room.seed)
        } else {
            loggerDefault.info('someone enter the room : ', room.roomId, ' but players not enough, waiting next player')
        }
    }
    appEvent.emit('scan_created_rooms', blockNum, 20)
    await run()
}


//房间人满, 开始battle
appEvent.on('settle_room', (room_id, seed) => {
    let timer = setTimeout(async () => {
        clearTimeout(timer);
        try {
            let localRoom = ROOMS_MAP[room_id]
            let roomInfo = await tronWheel.FindRoomById(room_id)
            let nowPlayerCnt = await countPlayer(roomInfo)
            if (nowPlayerCnt < roomInfo.playerCnt) {
                loggerDefault.info('----------------> strange!!!, players not enough')
                return;
            }
            loggerDefault.info("settle_room starting-> room, tx  ", room_id)
            if (!localRoom) {
                loggerDefault.info("local room not exits room, tx  ", room_id)
                return
            }
            if (roomInfo.status != 255) {  //只有255状态才是等待解决和取消的 //如果状态变了, 就不在继续解决
                loggerDefault.info("room status not in 255 => status = ", roomInfo.status)
                let localRoom = ROOMS_MAP[room_id]
                if (!localRoom) return
                localRoom.settleRetry = 0;
                localRoom.endTs = new Date().getTime()
                localRoom.status = SOLO_STATUS.FINISHED
                if (localRoom.luckyNum == null) localRoom.luckyNum =  0
                let ret = await dbService.addRoomInfo(localRoom)
                NoticeRoomFinished(room_id)
                if (ret) {
                    delete ROOMS_MAP[room_id]
                }
                return
            }
            if (localRoom.status != SOLO_STATUS.FIGHTING) {
                localRoom.status = SOLO_STATUS.FIGHTING
                await saveLocalRunInfo2Redis() //保存数据, 现场数据, 确保前端只转一次
                NoticeRoomsBattling(room_id)
            }
            let txRet = await tronWheel.makeRoomFight(room_id, roomInfo.seatId, seed)
            // let exp = await hincrby("player:info:" + addr, "total", Math.floor(roomInfo.amount));
            if(TronWeb.isAddress(localRoom.player1)) {
                let exp = await hincrby("player:info:" + localRoom.player1, "total", Math.floor(localRoom.amount));
            }
            if(TronWeb.isAddress(localRoom.player2)) {
                let exp = await hincrby("player:info:" + localRoom.player2, "total", Math.floor(localRoom.amount));
            }
            if(TronWeb.isAddress(localRoom.player3)) {
                let exp = await hincrby("player:info:" + localRoom.player3, "total", Math.floor(localRoom.amount));
            }
            if(TronWeb.isAddress(localRoom.player4)) {
                let exp = await hincrby("player:info:" + localRoom.player4, "total", Math.floor(localRoom.amount));
            }
            if (txRet != null && txRet.result === true) {
                appEvent.emit('settle_room_confirm', txRet.transaction.txID, room_id)
            } else {
                appEvent.emit('settle_room', room_id, seed)
            }
        } catch (error) {
            loggerError.error(error);
            appEvent.emit("settle_room", room_id, seed)
        }
    }, 12200);
})


//battle确认
appEvent.on('settle_room_confirm', (tx_id, _room_id) => {
    let timer = setTimeout(async () => {
        clearTimeout(timer)
        let localRoom = ROOMS_MAP[_room_id]
        if (!localRoom) {
            return // 防止房间被删除之后, 仍然重复执行
        }
        try {
            loggerDefault.info("settle_room_confirm -> room, tx ", _room_id, tx_id);
            let txOk = await tronUtil.confirmTxIn2Nodes3Times(tx_id, 2300);
            loggerDefault.info("settle_room_confirm -> txOk:", _room_id, txOk, tx_id);
            // if (txOk != null && txOk === true) {
            if (txOk) {

                if (!localRoom) {
                    return // 防止房间被删除之后, 仍然重复执行
                }
                localRoom.settleTx = tx_id
                localRoom.endTs = new Date().getTime()
                let roomInfo = await tronWheel.FindRoomById(_room_id)
                // await updateLocalRoomInfo(localRoom, roomInfo)
                if (roomInfo.status >=0 && roomInfo.status <= 3){
                    localRoom.settleRetry = 0;
                    localRoom.status = SOLO_STATUS.FINISHED
                    loggerDefault.info("==> save db");
                    let ret = await dbService.addRoomInfo(localRoom)
                    if (ret) {
                        NoticeRoomFinished(_room_id)
                        delete ROOMS_MAP[_room_id]
                        await saveLocalRunInfo2Redis()
                    }
                    return
                } else {
                    if (localRoom.settleRetry >= 9) {
                        localRoom.settleRetry = 0;
                        loggerDefault.warn("settling try again!!!")
                        appEvent.emit('settle_room')
                    } else {
                        await sleep(400)
                        appEvent.emit('settle_room_confirm', tx_id, _room_id)
                    }
                    return
                }
            } else {
                localRoom.settleRetry = localRoom.settleRetry + 1
            }

            loggerDefault.warn("settleRetry sttle_room_confirm for room [" + _room_id + "] = " + localRoom.settleRetry);
            if (localRoom.settleRetry >= 9) {
                localRoom.settleRetry = 0;
                loggerDefault.warn("settling try again!!!")
                appEvent.emit('settle_room',_room_id, localRoom.seed)
            } else {
                await sleep(400)
                appEvent.emit('settle_room_confirm', tx_id, _room_id)
            }
        } catch (error) {
            loggerError.error(error);
            appEvent.emit('settle_room_confirm', tx_id, _room_id)
        }
    }, 1024)
})



//房间到期, 开始强制取消流程
appEvent.on('cancle_room', (_room_id) => {
    let timer = setTimeout(async () => {
        clearTimeout(timer)
        try {
            let roomInfo = await tronWheel.FindRoomById(_room_id)
            if (roomInfo.status == 0) {
                // NoticeRoomsUpdate(_room_id)
                delete ROOMS_MAP[_room_id]
                return
            }
            if (roomInfo.status != 255) {
                retry = 0;
                let localRoom = ROOMS_MAP[_room_id]
                if (!localRoom) return
                localRoom.endTs = new Date().getTime()
                localRoom.status = SOLO_STATUS.CANCELD
                loggerDefault.info("tx confirmed failed, but status changed,  cancel room and save db, status is : ", roomInfo.status)
                let ret = await dbService.addRoomInfo(localRoom)
                NoticeRoomsUpdate(_room_id)
                if (ret) {
                    delete ROOMS_MAP[_room_id]
                    await saveLocalRunInfo2Redis()
                }
                return
            }
            let txRet = await tronWheel.CancelRoom(_room_id, roomInfo.seatId)
            if (txRet != null && txRet.result === true) {
                appEvent.emit('cancel_room_confirm', txRet.transaction.txID, _room_id)
            } else {
                appEvent.emit('cancle_room', _room_id)
            }
        } catch (error) {
            loggerError.error(error);
            appEvent.emit("cancle_room", _room_id)
        }
    }, 100);
})


//房间取消再次确认, 确保房间确实被取消
appEvent.on('cancel_room_confirm', (tx_id, _room_id) => {
    let timer = setTimeout(async () => {
        clearTimeout(timer)
        let localRoom = ROOMS_MAP[_room_id]
        if (!localRoom) {
            return // 防止房间被删除之后, 仍然重复执行
        }
        try {
            loggerDefault.info("cancel_room_confirm -> room, tx ", _room_id, tx_id)
            let txOk = await tronUtil.confirmTxIn2Nodes3Times(tx_id, 1500)
            loggerDefault.info("cancel_room_confirm -> txOk:", _room_id, txOk, tx_id)
            if (txOk) {

                loggerDefault.info("==> save db");
                let roomInfo = await tronWheel.FindRoomById(_room_id)


                localRoom.tx_id = tx_id;
                await updateLocalRoomInfo(localRoom, roomInfo)
                if (roomInfo.status == ROOM_CANCELD_STATUS) {
                    localRoom.retry = 0;
                    loggerDefault.info("==>cancel room and save db")
                    let ret = await dbService.addRoomInfo(localRoom)
                    NoticeRoomsUpdate(_room_id)
                    if (ret) {
                        delete ROOMS_MAP[_room_id]
                        await saveLocalRunInfo2Redis()
                    }
                    return
                } else {
                    if (localRoom.retry >= 9) {
                        localRoom.retry = 0;
                        loggerDefault.warn("cancel try again!!!")
                        appEvent.emit('cancel_room');
                    } else {
                        await sleep(400)
                        appEvent.emit('cancel_room_confirm', tx_id, _room_id)
                    }
                }
            } else {
                localRoom.retry = localRoom.retry + 1;
            }

            loggerDefault.warn("localRoom.retry cancel_room_confirm for room [" + _room_id + "] = " + localRoom.retry)
            if (localRoom.retry >= 9) {
                localRoom.retry = 0
                loggerDefault.warn("cancel try again!!!")
                appEvent.emit('cancel_room');
            } else {
                await sleep(400)
                appEvent.emit('cancel_room_confirm', tx_id, _room_id)
            }
        } catch (error) {
            loggerError.error(error);
            appEvent.emit('cancel_room_confirm', tx_id, _room_id)
        }
    }, 1024);
})

//每隔两秒钟扫描一次, 每次最多扫描20桌
appEvent.on('scan_created_rooms', (blockNum, delay) => {
    delay = delay || 2000
    let timer = setTimeout(async () => {
        clearTimeout(timer)
        try {
            let startTs  = new Date().getTime()
            let blockData = await tronUtil.getBlockInfoByNum(blockNum)
            // loggerDefault.info(blockData)
            if (_.isEmpty(blockData)) {
                appEvent.emit("scan_created_rooms", blockNum, 1500)
                return
            }
            let result = await alysisBlockData(blockData, blockNum)
            if (!result) {
                loggerError.error('try to restart block => ', blockNum)
                appEvent.emit("scan_created_rooms", blockNum, 20)
                return
            }
            loggerDefault.info("TRX区块:" + blockNum + "; 扫描用时 =>" + (new Date().getTime() - startTs) + 'ms')
            await RecordBlockNum(blockNum)
            blockNum += 1
            appEvent.emit("scan_created_rooms", blockNum, 20)
        } catch (error) {
            loggerError.error(error);
            appEvent.emit("scan_created_rooms", blockNum, delay)
        }
    }, delay);
})


appEvent.on('create_room', (addr, amount) => {

})

appEvent.on('join_room', (addr, amount, room_id) => {

})

// 查找过期房间, 强制用户取消房间
async function findRoomTimeOut(){
    let now = new Date().getTime()
    for (let _room_id in ROOMS_MAP) {
        let room = ROOMS_MAP[_room_id]
        if ( (now - room.createTs) > conf.wheel.MAX_EXIST_TIME) {
            loggerDefault.info('----------------cancle_room--------------', _room_id)
            appEvent.emit('cancle_room', _room_id)
        }
    }
}

function sleep(time = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}

async function saveRoomInfo2Redis(room){
    await redis.hset("wheel_room_info", 'room_id_v1:' + room.roomId, JSON.stringify({
        roomId : room.roomId,
        status : room.status,
        playerCnt : room.playerCnt,
        createTs : room.createTs,
        tx_id : room.tx_id,
        salt : room.salt,
        hash : room.hash,
        seed : room.seed,
        luckyNum :room.luckyNum,
        multi : room.multi,
        angle :room.angle,
        player1 : room.player1,
        player2 : room.player2,
        player3 : room.player3,
        player4 : room.player4,
        amount : room.amount,
        seatId : room.seatId,
        settle : room.settle,
    }));
}


async function saveLocalRunInfo2Redis() {
    await hset("wheel_room_info", 'localroomsv1', JSON.stringify(ROOMS_MAP))
}

async function getLocalRunInfoFromRedis() {
    let result = await hget("wheel_room_info", 'localroomsv1')
    if (_.isEmpty(result)){
        return {}
    }
    return JSON.parse(result)
}

function hget(key, field) {
    return new Promise((resolve, reject) => {
        redis.hget(key, field, (err, ret) => {
            if (err) reject(err)
            resolve(ret)
        });
    })
}

function hincrby(key, field, value) {
    return new Promise((resolve, reject) => {
        redis.hincrby(key, field, value, (err, ret) => {
            if (err) reject(err)
            resolve(ret)
        })
    })
}

function hset(key, field, value) {
    return new Promise((resolve, reject) => {
        redis.hset(key, field, value, (err, ret) => {
            if (err) reject(err)
            resolve(ret)
        })
    })
}

function getRooms() {
    let result = []
    for (let _room_id in ROOMS_MAP) {
        result.push(getRoomById(_room_id))
    }
    return result
}

function getNameByaddr(addr) {
    return ONLINE_NAME[addr] || addr
}

function getRoomById(room_id) {
    let roomInfo = ROOMS_MAP[room_id]
    let tmp = {
        roomId : roomInfo.roomId,
        createTs : roomInfo.createTs,
        amount : roomInfo.amount,
        playerCnt : roomInfo.playerCnt,
        status : roomInfo.status,
        player1 : getNameByaddr(roomInfo.player1),
        player2 : getNameByaddr(roomInfo.player2),
        player3 : getNameByaddr(roomInfo.player3),
        player4 : getNameByaddr(roomInfo.player4),
        seatId  : roomInfo.seatId,
    }
    return tmp
}

function getRoomIncludeAngelById(room_id) {
    let roomInfo = ROOMS_MAP[room_id]
    let tmp = {
        roomId : roomInfo.roomId,
        createTs : roomInfo.createTs,
        amount : roomInfo.amount,
        playerCnt : roomInfo.playerCnt,
        status : roomInfo.status,
        player1 : getNameByaddr(roomInfo.player1),
        player2 : getNameByaddr(roomInfo.player2),
        player3 : getNameByaddr(roomInfo.player3),
        player4 : getNameByaddr(roomInfo.player4),
        luckyNum : roomInfo.luckyNum + 1,
        angle : roomInfo.angle,
        seatId  : roomInfo.seatId,
    }
    return tmp
}

function broadcast(method, data) {
    io.sockets.in('solo_wheel').emit(method.toString(), data)
}

//通知接受下注
function NoticeRoomsUpdate(_room_id){
    if (_room_id) {
        broadcast('room_info', getRoomById(_room_id))
    } else {
        let rooms = getRooms()
        for (let one of rooms) {
            loggerDefault.info('------------broadcast_rooms_info-----------')
            broadcast('room_info', one)
        }
    }
}

function NoticeRoomFinished(_room_id) {
    let room = getRoomIncludeAngelById(_room_id)
    broadcast('room_info', room)
}

function NoticeRoomFull(_room_id) {
    broadcast('room_ready', getRoomById(_room_id))
}

//通知本轮结果
function NoticeRoomsBattling(room_id){
    let roomInfo = ROOMS_MAP[room_id]
    let result = {
        roomId : roomInfo.roomId,
        createTs : roomInfo.createTs,
        amount : roomInfo.amount,
        playerCnt : roomInfo.playerCnt,
        status : roomInfo.status,
        player1 : getNameByaddr(roomInfo.player1),
        player2 : getNameByaddr(roomInfo.player2),
        player3 : getNameByaddr(roomInfo.player3),
        player4 : getNameByaddr(roomInfo.player4),
        seatId : roomInfo.seatId,
        seed : roomInfo.seed,
        salt :  roomInfo.salt,
        luckyNum : roomInfo.luckyNum + 1,
        hash : roomInfo.hash,
        angle : roomInfo.angle,
    }
    broadcast('room_battle', result)
}

io.on('connection', function (socket) {
    // loggerDefault.info("connection",socket);
    //断开事件

    socket.on('join_solo', async (room, addr) => {
        if (_.isEmpty(room) || room !== "solo_wheel") return;
        socket.join(room);
        if (isWorking === false) return
        redis.hget('player:info:' + addr, 'name', (err, result) => {
            // loggerDefault.info("app:dice:player",addr,err,result);
            if (err) return;
            if (result && !_.isEmpty(result) && result.length > 0) {
                ONLINE_NAME[addr] = result;
                socket.emit("user_name", result)
            } else {
                socket.emit("user_name", addr)
            }
        })

        let logs = await dbService.getHistoryRoomLogs(60)
        for (let one of logs){
            one.player1 = getNameByaddr(one.player1)
            one.player2 = getNameByaddr(one.player2)
            one.player3 = getNameByaddr(one.player3)
            one.player4 = getNameByaddr(one.player4)
        }
        socket.emit("solo_history_logs_ret", logs)

        let room_info = getRooms()
        if (room_info != null) {
            for (let one of room_info) {
                loggerDefault.info('------------broadcast_rooms_info-----------')
                socket.emit("room_info", one);
            }
        }
    })

    socket.on('leave_solo', (room) => {
        room = room || 'solo_wheel'
        socket.leave(room)
    })

    socket.on('create_room', (addr, amount, room_id) => {
        loggerDefault.info('create_room', addr, amount, room_id)
        // if (ONLINE[addr] !== key) return;
        appEvent.emit('create_room', addr, amount, room_id)
        loggerDefault.info('----------create-room-events-send-------------')
    })


    socket.on('join_room', (addr, amount, room_id) => {
        loggerDefault.info('join_room', addr, amount, room_id)
        // if (ONLINE[addr] !== key) return;
        appEvent.emit('join_room', addr, amount, room_id);
        loggerDefault.info('----------join-room-events-send-------------')
    })


    socket.on('rooms', async (addr) => {
        // if (_.isEmpty(addr)) return;
        if (_.isEmpty(addr)) addr = ""
        socket.emit("rooms_info", getRooms)
    })

    socket.on('solo_my_logs', async (addr) => {
        if (!TronWeb.isAddress(addr)) return;
        let logs = await dbService.getMySoloLogs(addr, 60)
        for (let one of logs){
            one.player1 = getNameByaddr(one.player1)
            one.player2 = getNameByaddr(one.player2)
            one.player3 = getNameByaddr(one.player3)
            one.player4 = getNameByaddr(one.player4)
        }
        socket.emit("solo_my_logs_ret", logs)
    })
});


// soloStart()
module.exports.soloStart = soloStart