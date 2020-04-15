const tronUtil = require('./tronUtil');
const tronQuery = tronUtil.tronQuery;
const tronExec = tronUtil.tronExec;
const _ = require('lodash')._;
// const TronWeb = require('tronweb');
const hexStringToBigNumber = tronUtil.hexStringToBigNumber;
const getAddressArr = tronUtil.getAddressArr;
const getUint256Arr = tronUtil.getUint256Arr;
const config = require('./src/configs/config');
let orcAddr = config.moon.orcAddr;
let logicAddr = config.moon.logicAddr;
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');

//修改状态为停止下注并开始跑crash动画
async function TakeFlight() {
    let ret = await tronExec(orcAddr, "TakeFlight()", 5000000, 0, [], null);
    // console.log("ret for TakeFlight",ret);
    return ret;
}

//上传倍率及最终发奖
// _moonRate: crash的倍率
// _suggestArray: 如果有玩家中途逃跑, 那么逃跑的玩家的下注index(需从小到大排), 没有传空数组
// _bettorArray: 中途逃跑的玩家的地址数组, 需跟_suggestArray一一对应
// _escapeRateArray: 中途逃跑的玩家的逃跑倍率(101 - 999900), 需跟_suggestArray一一对应
// async function LandOnMoon(crash_info) {
//     let _moonRate = Math.floor((crash_info.result+0.000002) * 100);
//     let all_players = crash_info.players;
//     let _suggestArray = [];
//     let _bettorArray = [];
//     let _escapeRateArray = [];
//     all_players = _.sortBy(all_players, 'no');

//     for (let player of all_players) {
//         let cashed_out = player.cashed_out;
//         if (cashed_out > 0 && cashed_out < player.auto_out) {
//             cashed_out = Math.floor((cashed_out+0.000002) * 100);
//             _suggestArray.push(player.no - 1);
//             _bettorArray.push('0x' + TronWeb.address.toHex(player.addr).substr(2, 40));
//             _escapeRateArray.push(cashed_out);
//         }
//     }

//     let params = [
//         { type: "uint256", value: _moonRate },
//         { type: "uint256[]", value: _suggestArray },
//         { type: "address[]", value: _bettorArray },
//         { type: "uint256[]", value: _escapeRateArray },
//     ];

//     //if(config.debug === true) 
//     // loggerDefault.info(params);

//     let ret = await tronExec(orcAddr, "LandOnMoon(uint256,uint256[],address[],uint256[])", 50000000, 0, params, null);
//     if (ret != null) {
//         loggerDefault.info("LandOnMoon", ret.result, ret.transaction.txID);
//     } else {
//         loggerDefault.warn("LandOnMoon ret is null");
//     }
//     return ret;
// }


//上传倍率及最终发奖
// _moonRate: crash的倍率
// _suggestArray: 如果有玩家中途逃跑, 那么逃跑的玩家的下注index(需从小到大排), 没有传空数组
// _bettorArray: 中途逃跑的玩家的地址数组, 需跟_suggestArray一一对应
// _escapeRateArray: 中途逃跑的玩家的逃跑倍率(101 - 999900), 需跟_suggestArray一一对应
async function LandOnMoon(crash_info) {
    let _moonRate = Math.floor((crash_info.result + 0.000002) * 100);
    let all_players = crash_info.players;
    let data = [];
    all_players = _.sortBy(all_players, 'no');

    for (let player of all_players) {
        let cashed_out = player.cashed_out;
        if (cashed_out > 0 && cashed_out < player.auto_out) {
            cashed_out = Math.floor((cashed_out + 0.000002) * 100);
            // console.log("cashed_out",cashed_out,"player.no",player.no);
            data.push(cashed_out * 256 + player.no - 1);
        }
    }

    //TODO:cancel 全部以自动退出倍率上报退出结果
    // for (let player of all_players) {
    //     let cashed_out = player.cashed_out;
    //     if(cashed_out === 0 && player.auto_out !== 0 && player.auto_out <= crash_info.result){
    //         cashed_out = player.auto_out;
    //     }
    //     if(cashed_out > 0){
    //         cashed_out = Math.floor((cashed_out+0.000002) * 100);
    //         data.push(cashed_out * 256 + player.no - 1);
    //     }
    // }
    //TODO:cancel

    let params = [
        { type: "uint256", value: crash_info.round },
        { type: "uint256", value: _moonRate },
        { type: "uint32[]", value: data },
    ];

    if (config.debug === true) loggerDefault.info(params);
    console.log(`LandOnMoon${crash_info.round} is`, params)

    let ret = await tronExec(orcAddr, "LandOnMoon(uint256,uint256,uint32[])", 50000000, 0, params, null);
    // console.log("ret for LandOnMoon",ret);
    return ret;
}

//获取本轮简要信息
async function getRoundState() {
    let data = await tronQuery(logicAddr, "getRoundState()", [], null);
    if (data == null) return null;
    return {
        _round: hexStringToBigNumber(data.substr(0, 64)).toNumber(),
        _roundState: hexStringToBigNumber(data.substr(64, 64)).toNumber(),
    }
}

//获取本轮详细信息
async function getRoundInfo() {
    let data = await tronQuery(logicAddr, "getRoundInfo()", [], "master");
    if (data == null) return null;
    let _round = hexStringToBigNumber(data.substr(0, 64)).toNumber();// 本轮轮次(1-16777215)
    let _roundState = hexStringToBigNumber(data.substr(64, 64)).toNumber();//当前状态(1可以投注,2停止投注)

    // let _bettorArray = hexStringToBigNumber(data.substr(128, 64)).toNumber(); //投注者地址数组(在数组中的地址从0开始)
    // let _trxAmountArray = hexStringToBigNumber(data.substr(192, 64)).toNumber();  //投注TRX数量数组, 与_bettorArray一一对应
    // let _autoRateArray = hexStringToBigNumber(data.substr(256, 64)).toNumber(); //自动逃离倍率数组, 与_bettorArray一一对应

    let startIndex = 320;

    let ret1 = getAddressArr(data, startIndex);
    let _bettorArray = ret1[0];
    let _bettorArrayEndIndex = ret1[1];

    let ret2 = getUint256Arr(data, _bettorArrayEndIndex);
    let _trxAmountArray = ret2[0];
    let _trxAmountArrayEndIndex = ret2[1];

    let ret3 = getUint256Arr(data, _trxAmountArrayEndIndex);
    let _autoRateArray = ret3[0];
    // let autoRateArrayDataSize = ret3[1];
    // console.log(_round);
    // console.log(_roundState);
    // console.log(_bettorArray);
    // console.log(_trxAmountArray);
    // console.log(_autoRateArray);

    // for(let x of _bettorArray){
    //     console.log(TronWeb.address.toHex(x));
    // }

    return {
        _round,
        _roundState,
        _bettorArray,
        _trxAmountArray,
        _autoRateArray
    }
}

//获取本轮详细信息
async function getRoundInfoBySlaveNode() {
    let data = await tronQuery(logicAddr, "getRoundInfo()", [], "slave");
    if (data == null) return null;
    let _round = hexStringToBigNumber(data.substr(0, 64)).toNumber();// 本轮轮次(1-16777215)
    let _roundState = hexStringToBigNumber(data.substr(64, 64)).toNumber();//当前状态(1可以投注,2停止投注)

    // let _bettorArray = hexStringToBigNumber(data.substr(128, 64)).toNumber(); //投注者地址数组(在数组中的地址从0开始)
    // let _trxAmountArray = hexStringToBigNumber(data.substr(192, 64)).toNumber();  //投注TRX数量数组, 与_bettorArray一一对应
    // let _autoRateArray = hexStringToBigNumber(data.substr(256, 64)).toNumber(); //自动逃离倍率数组, 与_bettorArray一一对应

    let startIndex = 320;

    let ret1 = getAddressArr(data, startIndex);
    let _bettorArray = ret1[0];
    let _bettorArrayEndIndex = ret1[1];

    let ret2 = getUint256Arr(data, _bettorArrayEndIndex);
    let _trxAmountArray = ret2[0];
    let _trxAmountArrayEndIndex = ret2[1];

    let ret3 = getUint256Arr(data, _trxAmountArrayEndIndex);
    let _autoRateArray = ret3[0];
    // let autoRateArrayDataSize = ret3[1];
    // console.log(_round);
    // console.log(_roundState);
    // console.log(_bettorArray);
    // console.log(_trxAmountArray);
    // console.log(_autoRateArray);

    // for(let x of _bettorArray){
    //     console.log(TronWeb.address.toHex(x));
    // }

    return {
        _round,
        _roundState,
        _bettorArray,
        _trxAmountArray,
        _autoRateArray
    }
}

module.exports.TakeFlight = TakeFlight;
module.exports.LandOnMoon = LandOnMoon;
module.exports.getRoundState = getRoundState;
module.exports.getRoundInfo = getRoundInfo;
module.exports.getRoundInfoBySlaveNode = getRoundInfoBySlaveNode;

// getRoundInfo();