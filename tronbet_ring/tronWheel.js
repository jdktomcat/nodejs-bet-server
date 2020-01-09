const tronUtil = require('./tronUtil');
const tronQuery = tronUtil.tronQuery;
const tronExec = tronUtil.tronExec;
const _ = require('lodash')._;
const TronWeb = require('tronweb');
const hexStringToBigNumber = tronUtil.hexStringToBigNumber;
const hexStringToTronAddress = tronUtil.hexStringToTronAddress;
const getAddressArr = tronUtil.getAddressArr;
const getUint256Arr = tronUtil.getUint256Arr;
const config = require('./src/configs/config');
const BigNumber = require('bignumber.js');;
let logicAddr = config.wheel.logicAddr;
let oracleAddr = config.wheel.oracleAddr

let soloOracleAddr = config.wheel.soloOracleAddr
let soloLogicAddr = config.wheel.soloLogicAddr;
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const NULL_ADDR = ''

//修改状态为停止下注, 成功之后开始播放转动
async function stopAcceptBeting() {
    // return {transaction : {txID : 'xxxxxxxxxxxxxxxxx'}, result : true}
    return await tronExec(oracleAddr, "StopRoundBet()", 5000000, 0, [], null);
}

//上传倍率及最终发奖
//_multiplierWin 中奖倍率
async function finishedTrunWheel(_multiplierWin, _round) {
    console.log('-----finishedTrunWheel----', _multiplierWin, _round)
    // return {result : t   rue, transaction : {txID : '11a07d8f32ff25047864fd2dfb7082cbd12b2b9cabf204c2c8d9fda9900a362c'}}
    let params = [
        { type: "uint256", value: _multiplierWin },
        { type: "uint256", value: _round },
    ];

    let ret = await tronExec(oracleAddr, "WinColor(uint256,uint256)", 50000000, 0, params, null);
    if (ret != null) {
        loggerDefault.info("WinColor", ret.result, ret.transaction);
    } else {
        loggerDefault.warn("WinColor ret is null");
    }
    console.log('================> finishedTrunWheel====>', ret)
    return ret;
}


//获取本轮简要信息
async function getRoundState() {
    // return {
    //     _round : 1,
    //     _roundState : 2,
    // }
    let data = await tronQuery(logicAddr, "getRoundState()", [], null);
    return {
        _round: hexStringToBigNumber(data.substr(0, 64)).toNumber(),
        _roundState: hexStringToBigNumber(data.substr(64, 64)).toNumber(),
    }
}

//获取本轮详细信息
async function getRoundInfo() {
    let data = await tronQuery(logicAddr, "getRoundInfo()", [], null);
    if(data == null) return null;
    let _round = hexStringToBigNumber(data.substr(0, 64)).toNumber();// 本轮轮次(1-16777215)
    let _roundState = hexStringToBigNumber(data.substr(64, 64)).toNumber();//当前状态(1可以投注,2停止投注)
    console.log('-------------------------_round, _roundState-----------------------------------------')
    console.log(_round, _roundState)

    let startIndex = 192;
    let logs = tronUtil.getCompxArr(data, startIndex)
    let players = []
    for (let one of logs[0]) {
        let addr = hexStringToTronAddress(one.substr(0,40))
        let trxAmount  = hexStringToBigNumber(one.substr(40,12)).toNumber() / 1e6
        let multiplier = hexStringToBigNumber(one.substr(52,4)).toNumber()
        players.push({addr : addr, amount : trxAmount, multi : multiplier})
    }

    return players
}


async function getMaxRoomId() {
    // return 10
    let data = await tronQuery(soloLogicAddr, "GetMaxRoomId()", [], null);
    return hexStringToBigNumber(data.substr(0, 64)).toNumber()
}

// 结算一个room
async function makeRoomFight(_roomId, _seatId, _seed) {
    console.log('-----makeRoomFight----', _roomId, _seed)
    // return {result : t   rue, transaction : {txID : '11a07d8f32ff25047864fd2dfb7082cbd12b2b9cabf204c2c8d9fda9900a362c'}}
    let params = [
        { type: "uint256", value: _roomId },
        { type: "uint256", value: _seatId },
        { type: "uint256", value: '0x' + _seed},
    ];

    let ret = await tronExec(soloOracleAddr, "MakeFight(uint256,uint256,uint256)", 50000000, 0, params, null);
    if (ret != null) {
        loggerDefault.info("MakeFight", ret.result, ret.transaction.txID);
    } else {
        loggerDefault.warn("MakeFight ret is null");
    }
    console.log('================> makeRoomFight====>',_roomId, ret)
    return ret;
}


// 结算一个room
async function FindRoomByIds(startId, endId) {
    // return {result : t   rue, transaction : {txID : '11a07d8f32ff25047864fd2dfb7082cbd12b2b9cabf204c2c8d9fda9900a362c'}}
    let params = [
        { type: "uint256", value: startId },
        { type: "uint256", value: endId },
    ];

    let ret = await tronQuery(soloLogicAddr, "FindRoomByIds(uint256,uint256)", params, 'master', null);
    if (ret != null) {
        loggerDefault.info("FindRoomByIds", ret.result, ret.transaction.txID);
    } else {
        loggerDefault.warn("FindRoomByIds ret is null");
    }
    console.log('================> FindRoomByIds ====>',startId, ret)
    return ret;
}


async function FindRoomById(_roomId) {
    let params = [
        { type: "uint256", value: _roomId },
    ];

    console.log('================> FindRoomById ====>',soloOracleAddr, _roomId)
    let result = {}
    let ret = await tronQuery(soloLogicAddr, "FindRoomById(uint256)", params, null);

    if(ret.length === 320) {
        let _roomId = hexStringToBigNumber(ret.substr(26, 16)).toNumber()
        let trxAmount = hexStringToBigNumber(ret.substr(42, 16)).toNumber() / 1e6
        let seatId = hexStringToBigNumber(ret.substr(58, 2)).toNumber()
        let playerCnt = hexStringToBigNumber(ret.substr(60, 2)).toNumber()
        let status = hexStringToBigNumber(ret.substr(62, 2)).toNumber()
        let player1 = hexStringToTronAddress(ret.substr(88,40))
        let player2 = hexStringToTronAddress(ret.substr(152,40))
        let player3 = hexStringToTronAddress(ret.substr(216,40))
        let player4 = hexStringToTronAddress(ret.substr(280,40))
        result = {
            roomId : _roomId, 
            amount : trxAmount, 
            playerCnt : playerCnt, 
            status : status,
            player1 : player1,
            player2 : player2,
            player3 : player3,
            player4 : player4,
            seatId : seatId,
        }
    }
    console.log(result)
    return result;
}

async function CancelRoom(_roomId, _seatId) {
    // return {result : t   rue, transaction : {txID : '11a07d8f32ff25047864fd2dfb7082cbd12b2b9cabf204c2c8d9fda9900a362c'}}
    let params = [
        { type: "uint256", value: _roomId },
        { type: "uint256", value: _seatId },
    ];

    let ret = await tronExec(soloOracleAddr, "CancelRoom(uint256,uint256)", 5000000, 0, params, null);
    if (ret != null) {
        loggerDefault.info("CancelRoom", ret.result, ret.transaction.txID);
    } else {
        loggerDefault.warn("CancelRoom ret is null");
    }
    console.log('================> CancelRoom ====>', _roomId, ret)
    return ret;
}

module.exports.stopAcceptBeting = stopAcceptBeting;
module.exports.finishedTrunWheel = finishedTrunWheel;
module.exports.getRoundState = getRoundState;
module.exports.getRoundInfo = getRoundInfo;
module.exports.getMaxRoomId = getMaxRoomId;
module.exports.makeRoomFight = makeRoomFight;
module.exports.FindRoomByIds = FindRoomByIds;
module.exports.FindRoomById = FindRoomById;
module.exports.CancelRoom = CancelRoom;

// getRoundInfo();

FindRoomById(481)
// getRoundInfo();
let randddd = [
    { roomId: 44739,
        amount: 50,
        playerCnt: 2,
        status: 255,
        player1: 'TFbAPX82naTSZnLKm3A2q2kXV7HUtJRzMS',
        player2: 'TEhKsEcUoD8NdAk87ssDPZN3u8i6LAWCQ5',
        player3: '',
        player4: '',
        seatId: 1 },
      { roomId: 44758,
        amount: 500,
        playerCnt: 2,
        status: 255,
        player1: 'TBv98AcKa5E3d3aKe9pSMUeLSAe1xZVxoJ',
        player2: 'TY81DKY1A3T44piE8fmccbGd88UgoqWhHp',
        player3: '',
        player4: '',
        seatId: 4 },
      { roomId: 44759,
        amount: 100,
        playerCnt: 2,
        status: 255,
        player1: 'TBv98AcKa5E3d3aKe9pSMUeLSAe1xZVxoJ',
        player2: 'TTy8Wcc5o9RrA7oFtG4MACZfpGVYJHL1xd',
        player3: '',
        player4: '',
        seatId: 5 },
      { roomId: 44788,
        amount: 50,
        playerCnt: 2,
        status: 255,
        player1: 'TPNWyZfiKtC7725RooKsheD291uC6KbXUo',
        player2: 'TCvRLPiHUZDa8iwkgaJ2sarx7AhjGkFU82',
        player3: '',
        player4: '',
        seatId: 6 },
        { roomId: 17981,
            amount: 50,
            playerCnt: 2,
            status: 255,
            player1: 'TVMd7TkkwCMj1GWn27iooW75mnGhny33aP',
            player2: '',
            player3: '',
            player4: '',
            seatId: 0 },
          { roomId: 23284,
            amount: 1000,
            playerCnt: 2,
            status: 255,
            player1: 'TVgMHzF2jcydkvUqiBvpTiHU5jDtCp7NTB',
            player2: '',
            player3: '',
            player4: '',
            seatId: 2 },
          { roomId: 23285,
            amount: 1000,
            playerCnt: 2,
            status: 255,
            player1: 'TRUheBuF482CzfLyWqrsfAi84QAQ3Vu8oo',
            player2: '',
            player3: '',
            player4: '',
            seatId: 3 },
          { roomId: 25717,
            amount: 1000,
            playerCnt: 2,
            status: 255,
            player1: '',
            player2: 'TRUheBuF482CzfLyWqrsfAi84QAQ3Vu8oo',
            player3: '',
            player4: '',
            seatId: 10 },
          { roomId: 26021,
            amount: 50,
            playerCnt: 3,
            status: 255,
            player1: 'THjAMqdbrucF7KhPzmg1Wewy9BqVCEi3Zx',
            player2: '',
            player3: '',
            player4: '',
            seatId: 9 },
]
async function test() {
    for (let one of randddd){
        await CancelRoom(one.roomId, one.seatId)
    }
}
