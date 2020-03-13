const conf = require('./src/configs/config')
const mysql = require('mysql')
const xhr = require('axios')
const fs = require("fs")
const schedule = require('node-schedule');
const util = require('util')
const {query, pool,execTrans, getConnection} = require('./src/utils/utilMysql')
const _ = require('underscore')._;
const TronWeb = require('tronweb');
const moment = require('moment');
const sha3 = require('js-sha3');
const BigNumber = require('bignumber.js');


const EVENT_CODE_MoonCreate = sha3.keccak256("MoonCreate(uint256,address,uint256,uint256,uint256,uint256)");
const EVENT_CODE_Moon_Result_Round = sha3.keccak256("MoonStop(uint256,uint256)");
const EVENT_CODE_Moon_Result_Players = sha3.keccak256("MoonResult(address,address,uint256,uint256,uint256,uint256,uint256,uint256)");


const EVENT_CODE_WheelCreate = sha3.keccak256("RingCreate(uint256,address,uint256,uint256,uint256,uint256)");
const EVENT_CODE_Wheel_Result_Round = sha3.keccak256("RingStop(uint256,uint256)");
const EVENT_CODE_Wheel_Result_Players = sha3.keccak256("RingResult(address,address,uint256,uint256,uint256,uint256,uint256,uint256)");

const wheel_oracle_addr = conf.tronConfig.wheel_oracle_addr
const wheel_bet_addr = conf.tronConfig.wheel_bet_addr

const moon_oracle_addr = conf.tronConfig.moon_oracle_addr
const moon_bet_addr = conf.tronConfig.moon_bet_addr

const scanBlocknumFileName = 'scanMoon.blocknum';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function RecordBlockNum(block_num) {
    try {
        fs.writeFile(scanBlocknumFileName, block_num, (err, data) =>{
        })
    } catch(e) {
        console.log('Failed....')
    }
    return true
}

async function getMaxBlockNum() {
    try {
        var data = fs.readFileSync(scanBlocknumFileName);
        let blockNum = Number(data.toString())
        if (blockNum <= conf.startBlockNum) return conf.startBlockNum
        return blockNum
    } catch(e) {
        return conf.startBlockNum
    }
}

async function getnowblock() {
    let {data} =  await xhr({
        url : conf.tronConfig.tron_url_solidity + '/walletsolidity/getnowblock',
        method : 'post',
        data : {}
    })
    return data
}

async function getBlockData(blockNum) {
    let {data} =  await xhr({
        url : conf.tronConfig.tron_url_solidity + '/walletsolidity/getblockbynum',
        method : 'post',
        data : {
            num: blockNum
        }
    })
    return data
}

async function alysisBlockData(blockData, blockNumber) {
    let ts = blockData.block_header.raw_data.timestamp;
    let transactions = blockData.transactions;
    let result = true
    if (transactions && !_.isEmpty(transactions) && _.isArray(transactions) && transactions.length > 0) {
        let txCount = transactions ? transactions.length : 0;
        console.log("-----------------------------------------------------------------------------------------------------------------");
        console.log("TRX区块:" + blockNumber + "; 出块时间:" + moment(ts).format('YYYY-MM-DD HH:mm:ss') + "; transactionnum:" + txCount +'; blockId:' + blockData.blockID);
        await Promise.all(transactions.map(async (txInfo) => {
            if (txInfo.ret[0].contractRet != 'SUCCESS') {
                return
            }
            let tmp = await alysisTxs(txInfo)
            if (!tmp) {
                console.log('-------------------blockNumber----------failed---', blockNumber)
                result = false
            }
        }))
    }
    return result
}

async function gettransactioninfobyid(txID){
    let {data} = await xhr({
        url : conf.tronConfig.tron_url_solidity + '/walletsolidity/gettransactioninfobyid',
        method : 'post',
        data : {
            value : txID
        }
    })
    return data
}

async function alysisTxs(tx){
    let txID = tx.txID;
    let raw_data = tx.raw_data;
    let contract = raw_data.contract;
    let fee_limit = raw_data.fee_limit;
    let timestamp = raw_data.timestamp;
    let sign = tx.signature ?  tx.signature[0] : '';
    let res = null;
    for (let _contract of contract) {
        let type = _contract.type;
        if (type === "TriggerSmartContract") { //调用合约
            let value = _contract.parameter.value;
            let owner_address = value.owner_address; //发起人地址
            let to_address = value.to_address; //转账合约时有效
            let contract_address = value.contract_address; //触发合约时有效

            let call_value = value.call_value || 0; //涉及金额 (单位:sun)
            let data = value.data; //触发合约时有效
            if (contract_address == null) {
                continue
            } else if (contract_address === moon_bet_addr) { //玩家下单之后事件通知 moon
                let txInfo = await gettransactioninfobyid(txID)
                let logs = txInfo.log;
                if (txInfo.resMessage) {
                    res.resMessage = hextoString(txInfo.resMessage);
                }
                // console.log(logs)
                if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
                    for (let _log of logs) {
                        // loggerDefault.info("_log",_log);
                        // console.log(_log)
                        let event_contract_address = "41" + _log.address;
                        let hexTopics = _log.topics
                        let hexData = _log.data;
                        let eventCode = hexTopics[0];
                        if (eventCode === EVENT_CODE_MoonCreate) {
                            let log = {
                                _type: "gen_moon_order",
                                _round: hexStringToBigNumber(hexTopics[1]).toNumber(),
                                _playerAddr: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                                _autoRate: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                _amount: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                _minedAnte: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                _index: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                _ts : timestamp,
                                _sign : sign,
                                _tx : txID
                                // _index: hexStringToBigNumber(hexData.substr(1024, 256)).toNumber(),
                            }
                            // loggerDefault.info(log);
                            let result = await saveRoundInfo(log)
                            if (!result) {
                                return false
                            }
                        }
                    }
                }
            }  else if (contract_address === moon_oracle_addr) { //结果事件通知 moon
                let txInfo = await gettransactioninfobyid(txID)
                let logs = txInfo.log;
                if (txInfo.resMessage) {
                    res.resMessage = hextoString(txInfo.resMessage);
                }
                let resultInfo = {
                    round : 0,
                    crashRate : 0,
                    roundTs : 0,
                    roundTx : '',
                    players : []
                }
                if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
                    for (let _log of logs) {
                        // loggerDefault.info("_log",_log);
                        // console.log(_log)
                        let event_contract_address = "41" + _log.address;
                        let hexTopics = _log.topics
                        let hexData = _log.data;
                        let eventCode = hexTopics[0];
                        if (eventCode == EVENT_CODE_Moon_Result_Round) {
                            let _round = hexStringToBigNumber(hexTopics[1]).toNumber()
                            let _crashRate =  hexStringToBigNumber(hexData.substr(0, 64)).toNumber()
                            resultInfo.round = _round
                            resultInfo.crashRate = _crashRate
                            resultInfo.roundTs = timestamp
                            resultInfo.roundTx = txID
                        } else if (eventCode === EVENT_CODE_Moon_Result_Players) {
                            let log = {
                                _type: "moon_result",
                                _bettor: hexStringToTronAddress(hexTopics[1].substr(24, 40)),
                                _mentor: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                                _crashRate: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                _autoRate: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                _escapeRate: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                _amount: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                _winAmount: hexStringToBigNumber(hexData.substr(256, 64)).toNumber(),
                                _referralAmount : hexStringToBigNumber(hexData.substr(320, 64)).toNumber(),
                            }
                            // loggerDefault.info(log);
                            resultInfo.players.push(log)
                        }
                    }
                    // console.log(resultInfo)
                    let result = await saveRoundDetailInfo(resultInfo)
                    if (!result) {
                        return false
                    }

                    let resultinfo = await saveRoundOverView(resultInfo)
                    if (!resultinfo) {
                        return false
                    }
                }
            }  else if (contract_address === wheel_bet_addr) { //下单事件 wheel
                let txInfo = await gettransactioninfobyid(txID)
                let logs = txInfo.log;
                if (txInfo.resMessage) {
                    res.resMessage = hextoString(txInfo.resMessage);
                }
                // console.log(logs)
                if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
                    for (let _log of logs) {
                        // loggerDefault.info("_log",_log);
                        // console.log(_log)
                        let event_contract_address = "41" + _log.address;
                        let hexTopics = _log.topics
                        let hexData = _log.data;
                        let eventCode = hexTopics[0];
                        if (eventCode === EVENT_CODE_WheelCreate) {
                            let log = {
                                _type: "gen_wheel_order",
                                _round: hexStringToBigNumber(hexTopics[1]).toNumber(),
                                _playerAddr: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                                _number: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                _amount: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                _minedAnte: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                _index: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                _ts : timestamp,
                                _sign : sign,
                                _tx : txID
                                // _index: hexStringToBigNumber(hexData.substr(1024, 256)).toNumber(),
                            }
                            // loggerDefault.info(log);
                            console.log(log)
                            let result = await saveWheelRoundInfo(log)
                            if (!result) {
                                return false
                            }
                        }
                    }
                }
            }  else if (contract_address === wheel_oracle_addr) { //结果事件通知 wheel
                let txInfo = await gettransactioninfobyid(txID)
                let logs = txInfo.log;
                if (txInfo.resMessage) {
                    res.resMessage = hextoString(txInfo.resMessage);
                }
                let resultInfo = {
                    round : 0,
                    crashRate : 0,
                    roundTs : 0,
                    roundTx : '',
                    players : []
                }
                if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
                    for (let _log of logs) {
                        // loggerDefault.info("_log",_log);
                        // console.log(_log)
                        let event_contract_address = "41" + _log.address;
                        let hexTopics = _log.topics
                        let hexData = _log.data;
                        let eventCode = hexTopics[0];
                        if (eventCode == EVENT_CODE_Wheel_Result_Round) {
                            let _round = hexStringToBigNumber(hexTopics[1]).toNumber()
                            let _crashRate =  hexStringToBigNumber(hexData.substr(0, 64)).toNumber()
                            resultInfo.round = _round
                            resultInfo.crashRate = _crashRate
                            resultInfo.roundTs = timestamp
                            resultInfo.roundTx = txID
                        } else if (eventCode === EVENT_CODE_Wheel_Result_Players) {
                            let log = {
                                _type: "gen_ring_result",
                                _bettor: hexStringToTronAddress(hexTopics[1].substr(24, 40)),
                                _mentor: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                                _roll: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                                _number: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                                _amount: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                                _winAmount: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                                _referralAmount : hexStringToBigNumber(hexData.substr(256, 64)).toNumber(),
                                _index : hexStringToBigNumber(hexData.substr(320, 64)).toNumber(),
                            }
                            // loggerDefault.info(log);
                            resultInfo.players.push(log)
                        }
                    }
                    console.log(resultInfo)
                    let result = await saveWheelRoundDetailInfo(resultInfo)
                    if (!result) {
                        return false
                    }

                    let resultinfo = await saveWheelRoundOverView(resultInfo)
                    if (!resultinfo) {
                        return false
                    }
                }
            }
        }
    }
    return true
}


async function saveRoundOverView(info) {
    let sql = "insert into moon_round_info(round, tx_id, ts, crashAt) values (?,?,?,?) ON DUPLICATE KEY update tx_id = ?, ts = ?, crashAt = ?;"
    try{
        let result = await query(sql, [info.round, info.roundTx,info.roundTs, info.crashRate, info.roundTx,info.roundTs, info.crashRate])
    }
    catch(e) {
        console.log(e, sql, info)
        return false
    }
    return true
}

async function saveRoundInfo(info) {
    let sql = "insert into moon_user_order(addr, round, tx_id, minedAnte, ts, sign) values (?,?,?,?,?,?) ON DUPLICATE KEY update ts = ?, sign = ?, minedAnte =?, tx_id = ?;"
    try{
        await sleep(120)
        let result = await query(sql, [info._playerAddr, info._round,info._tx, info._minedAnte, info._ts, info._sign,info._ts, info._sign,info._minedAnte,info._tx])
    }
    catch(e) {
        console.log(e, sql, info)
        return false
    }
    return true
}

async function saveRoundDetailInfo(infos) {
    if (infos.players.length === 0) return true
    let sql = "insert into moon_user_order(addr, round, amount, mentor,crashAt,autoAt, escapeAt,win,referralAmount)  \
               values (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY update amount = ?, mentor = ?, crashAt = ?,autoAt = ?, escapeAt = ?,win = ?, referralAmount = ?;"

    let totalUpdateSql  = "insert into tron_bet_wzc.dice_players(addr, total, payout, play_times, win_times, mentor, referral, first_ts, lastest_ts, moon_total, moon_payout, moon_play_times) \
                values (?,?,?,?,?,?,?,?,?,?,?,1) ON DUPLICATE KEY update moon_total = moon_total + ?, moon_payout = moon_payout + ?, lastest_ts = ?, win_times = win_times + ?, moon_play_times = moon_play_times + 1"
    let conn = null;
    let now = new Date().getTime()
    try {
        conn = await getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }
        conn.beginTransaction();
        for (let info of infos.players) {
            await sleep(50)
            let result = await execTrans(sql, [
                info._bettor,
                infos.round,
                info._amount,
                info._mentor,
                info._crashRate,
                info._autoRate,
                info._escapeRate,
                info._winAmount,
                info._referralAmount,
                info._amount,
                info._mentor,
                info._crashRate,
                info._autoRate,
                info._escapeRate,
                info._winAmount,
                info._referralAmount], conn
            )
            await sleep(50)
            // console.log("saveRoundDetailInfo result", result)
            let winTimes = info._winAmount > 0 ? 1 : 0

            let moonUpdate = await execTrans(totalUpdateSql,[
                info._bettor,
                0,
                0,
                0,
                winTimes,
                '',
                0,
                now,
                now,
                info._amount,
                info._winAmount,
                info._amount,
                info._winAmount,
                now,
                winTimes
            ], conn)
            // console.log("saveRoundDetailInfo moonUpdate", moonUpdate)
            await sleep(50)
        }

        conn.commit()
        conn.release()
    }
    catch(e) {
        if (conn) {
            conn.rollback();
            conn.release();
        }
        console.log(e, sql, totalUpdateSql, infos)
        return false
    }
    return true
}


async function saveWheelRoundOverView(info) {
    let sql = "insert into wheel_round_info(round, tx_id, ts, number) values (?,?,?,?) ON DUPLICATE KEY update tx_id = ?, ts = ?, number = ?;"
    try{
        let result = await query(sql, [info.round, info.roundTx,info.roundTs, info.crashRate, info.roundTx,info.roundTs, info.crashRate])
    }
    catch(e) {
        console.log(e, sql, info)
        return false
    }
    return true
}

async function saveWheelRoundInfo(info) {
    let sql = "insert into wheel_user_order(addr, round, amount, number, aindex, tx_id, minedAnte, ts, sign) values (?,?,?,?,?,?,?,?,?);"
    let totalUpdateSql  = "insert into tron_bet_wzc.dice_players(addr, total, payout, play_times, win_times, mentor, referral, first_ts, lastest_ts, wheel_total, wheel_payout, wheel_play_times) \
    values (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY update wheel_total = wheel_total + ?,lastest_ts = ?, wheel_play_times = wheel_play_times + 1"
    try{
        let result = await query(sql, [info._playerAddr, info._round, info._amount, info._number, info._index,info._tx, info._minedAnte, info._ts, info._sign])
        let totalResult = await query(totalUpdateSql, [info._playerAddr, 0, 0, 0, 0, '', 0, info._ts, info._ts, info._amount, 0, 1, info._amount,info._ts])
    }
    catch(e) {
        console.log('data has been add to database, tx => :', info._tx, sql, info)
        return true
    }
    return true
}

async function saveWheelRoundDetailInfo(infos) {
    if (infos.players.length === 0) return true
    let sql = "insert into wheel_user_order(addr, round, aindex,amount, mentor,roll,number,win,referralAmount)  \
               values (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY update amount = ?, mentor = ?, roll = ?,number = ?,win = ?, referralAmount = ?;"

    let totalUpdateSql  = "insert into tron_bet_wzc.dice_players(addr, total, payout, play_times, win_times, mentor, referral, first_ts, lastest_ts, wheel_total, wheel_payout, wheel_play_times) \
                values (?,?,?,?,?,?,?,?,?,?,?,1) ON DUPLICATE KEY update  wheel_payout = wheel_payout + ?, lastest_ts = ?, win_times = win_times + ?, wheel_play_times = wheel_play_times + 1"
    let conn = null;
    let roundSql = "select roll, hash, salt, luckyNum from tron_bet_wzc.wheel_info where round = ?"
    let initWheelInfoSql = "update wheel_user_order set roll = ?, luckyNum = ?,result_hash = ?,salt = ?, mentor = '', win = 0, referralAmount = 0 where round = ?"
    let now = new Date().getTime()
    try {
        conn = await getConnection();
        if (conn == null) {
            throw new Error("conn is null !!!");
        }

        let roundInfo = await execTrans(roundSql, [infos.round], conn)

        conn.beginTransaction();
        if (roundInfo[0]) {
            await execTrans(initWheelInfoSql, [roundInfo[0].roll, roundInfo[0].luckyNum, roundInfo[0].hash, roundInfo[0].salt, infos.round], conn)
        }

        for (let info of infos.players) {
        console.log(   info._bettor,
            infos.round,
            info._index,
            info._amount,
            info._mentor,
            info._roll,
            info._number,
            info._winAmount,
            info._referralAmount,
            info._amount,
            info._mentor,
            info._roll,
            info._number,
            info._winAmount,
            info._referralAmount)
            let result = await execTrans(sql, [
                info._bettor,
                infos.round,
                info._index,
                info._amount,
                info._mentor,
                info._roll,
                info._number,
                info._winAmount,
                info._referralAmount,
                info._amount,
                info._mentor,
                info._roll,
                info._number,
                info._winAmount,
                info._referralAmount], conn
            )

            let winTimes = info._winAmount > 0 ? 1 : 0

            let moonUpdate = await execTrans(totalUpdateSql,[
                info._bettor,
                0,
                0,
                0,
                winTimes,
                '',
                0,
                now,
                now,
                info._amount,
                info._winAmount,
                info._winAmount,
                now,
                winTimes
            ], conn)
        }

        conn.commit()
        conn.release()
    }
    catch(e) {
        if (conn) {
            conn.rollback();
            conn.release();
        }
        console.log(e, sql, infos)
        return false
    }
    return true
}

function hexStringToTronAddress1(_hexStr) {
    return TronWeb.address.fromHex(_hexStr);
}

async function scanNext(blockNum) {
    try {
        let blockData = await getBlockData(blockNum)
        // console.log("debug moon blockNum",blockNum)
        // console.log("debug moon blockData",blockData)
        if (_.isEmpty(blockData)) {
            return false
        }
        let result = await alysisBlockData(blockData, blockNum)
        return result
    } catch(e) {
        console.log(e)
        return false
    }
}

function hexStringToBigNumber(_hexStr) {
    return new BigNumber(_hexStr, 16);
}

EMPTY_ADDRESS = "0000000000000000000000000000000000000000";
function hexStringToTronAddress(_hexStr) {
    if (_hexStr === EMPTY_ADDRESS) {
        return "";
    }
    return TronWeb.address.fromHex('41' + _hexStr);
}

async function main() {
    let blockNum = await getMaxBlockNum()
    while (true) {
        let stime = new Date().getTime()
        let result = await scanNext(blockNum)
        if (result) {
            await RecordBlockNum(blockNum)
            console.log('-----finish scan moon block num ', blockNum, ' in ', new Date().getTime() - stime, 'ms')
            blockNum += 1
        } else {
            console.log('-----------restart moon blockNum : ', blockNum)
            await sleep(3000)
        }

    }

}


module.exports = {
    main
}
