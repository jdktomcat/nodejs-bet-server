const conf = require('./src/configs/config');
const xhr = require('axios');
const fs = require('fs');
const { query, pool, execTrans, getConnection } = require('./src/utils/utilMysql');
const _ = require('underscore')._;
const TronWeb = require('tronweb');
const moment = require('moment');
const sha3 = require('js-sha3');
const BigNumber = require('bignumber.js');
const redisUtil = require('./src/utils/redisUtil')

var pvpAddr = conf.tronConfig.pvp_bet_addr;
var pvpLogic = conf.tronConfig.pvp_logic_addr;
var pvpOrcale = conf.tronConfig.pvp_oracle_addr;

const RingPvpNew = sha3.keccak256('RingPvpNew(address,uint256,uint256,uint256,uint256,uint256)');
const RingPvpJoin = sha3.keccak256('RingPvpJoin(address,uint256,uint256,uint256,uint256,uint256)');
const RingPvpResult = sha3.keccak256('RingPvpResult(uint256,uint256,uint256,address,uint256)');
const RingPvpCancel = sha3.keccak256('RingPvpCancel(uint256,uint256,address,address,address,address,uint256)');

const scanBlocknumFileName = 'scanRing.blocknum';

const lodash = require('lodash')._

/**
 * 活动开始时间
 * @type {number}
 */
const ACTIVITY_START_TS = conf.event.ACTIVITY_START_TS || 0;

/**
 * 活动结束时间
 * @type {number}
 */
const ACTIVITY_END_TS = conf.event.ACTIVITY_END_TS || 0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function RecordBlockNum(block_num) {
  try {
    fs.writeFile(scanBlocknumFileName, block_num, (err, data) => {});
  } catch (e) {
    console.log('Failed....');
  }
  return true;
}

async function getMaxBlockNum() {
  try {
    var data = fs.readFileSync(scanBlocknumFileName);
    let blockNum = Number(data.toString());
    if (blockNum <= conf.startBlockNum) return conf.startBlockNum;
    return blockNum;
  } catch (e) {
    return conf.startBlockNum;
  }
}

async function getnowblock() {
  let { data } = await xhr({
    url: conf.tronConfig.tron_url_solidity + '/walletsolidity/getnowblock',
    method: 'post',
    data: {}
  });
  return data;
}

async function getBlockData(blockNum) {
  let { data } = await xhr({
    url: conf.tronConfig.tron_url_solidity + '/walletsolidity/getblockbynum',
    method: 'post',
    data: {
      num: blockNum
    }
  });
  return data;
}

async function alysisBlockData(blockData, blockNumber) {
  let ts = blockData.block_header.raw_data.timestamp;
  let transactions = blockData.transactions;
  let result = true;
  if (transactions && !_.isEmpty(transactions) && _.isArray(transactions) && transactions.length > 0) {
    let txCount = transactions ? transactions.length : 0;
    console.log('-----------------------------------------------------------------------------------------------------------------');
    console.log('TRX区块:' + blockNumber + '; 出块时间:' + moment(ts).format('YYYY-MM-DD HH:mm:ss') + '; transactionnum:' + txCount +'; blockId:' + blockData.blockID);
    await Promise.all(
      transactions.map(async txInfo => {
        if (txInfo.ret[0].contractRet != 'SUCCESS') {
          return;
        }
        let tmp = await alysisTxs(txInfo);
        if (!tmp) {
          console.log('-------------------blockNumber----------failed---', blockNumber);
          result = false;
        }
      })
    );
  }
  return result;
}

async function gettransactioninfobyid(txID) {
  let { data } = await xhr({
    url: conf.tronConfig.tron_url_solidity + '/walletsolidity/gettransactioninfobyid',
    method: 'post',
    data: {
      value: txID
    }
  });
  return data;
}

async function alysisTxs(tx) {
  let txID = tx.txID;
  let raw_data = tx.raw_data;
  let contract = raw_data.contract;
  let fee_limit = raw_data.fee_limit;
  let timestamp = raw_data.timestamp;
  let sign = tx.signature ? tx.signature[0] : '';
  let res = null;
  for (let _contract of contract) {
    let type = _contract.type;
    if (type === 'TriggerSmartContract') {
      //调用合约
      let value = _contract.parameter.value;
      let owner_address = value.owner_address; //发起人地址
      let to_address = value.to_address; //转账合约时有效
      let contract_address = value.contract_address; //触发合约时有效

      let call_value = value.call_value || 0; //涉及金额 (单位:sun)
      let data = value.data; //触发合约时有效
      if (contract_address == null) {
        continue;
      } else if (contract_address === pvpAddr) {
        //玩家下单之后事件通知
        let txInfo = await gettransactioninfobyid(txID);
        let logs = txInfo.log;
        if (txInfo.resMessage) {
          res.resMessage = hextoString(txInfo.resMessage);
        }
        // console.log(logs)
        if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
          for (let _log of logs) {
            // loggerDefault.info("_log",_log);
            // console.log(_log)
            let event_contract_address = '41' + _log.address;
            console.log('-');
            let hexTopics = _log.topics;
            let hexData = _log.data;
            let eventCode = hexTopics[0];
            // console.log(_log);
            if (eventCode === RingPvpNew) {
              let log = {
                _roomId: hexStringToBigNumber(hexTopics[2].substr(0, 64)).toNumber(),
                _playerAddr: hexStringToTronAddress(hexTopics[1].substr(24, 40)),
                _tableIndex: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                _seatIndex: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                _trxAmount: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                _playerCnt: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                _tx: txID,
                _ts: timestamp
              };
              // console.log(log);
              let result = await saveJoinRoomInfo(log);
              if (!result) {
                return false;
              }
            } else if (eventCode === RingPvpJoin) {
              console.log('-----------------------------------------------------');
              let log = {
                _roomId: hexStringToBigNumber(hexTopics[2].substr(0, 64)).toNumber(),
                _playerAddr: hexStringToTronAddress(hexTopics[1].substr(24, 40)),
                _tableIndex: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                _seatIndex: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                _trxAmount: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
                _playerCnt: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                _tx: txID,
                _ts: timestamp
              };
              // console.log(log);
              let result = await saveJoinRoomInfo(log);
              if (!result) {
                return false;
              }
            }
          }
        }
      } else if (contract_address === pvpOrcale) {
        let txInfo = await gettransactioninfobyid(txID);
        let logs = txInfo.log;
        if (txInfo.resMessage) {
          res.resMessage = hextoString(txInfo.resMessage);
        }
        // console.log(logs)
        if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
          for (let _log of logs) {
            // loggerDefault.info("_log",_log);
            // console.log(_log)
            let event_contract_address = '41' + _log.address;
            console.log('-');
            let hexTopics = _log.topics;
            let hexData = _log.data;
            let eventCode = hexTopics[0];
            // console.log(_log);
            if (eventCode === RingPvpResult) {
              let log = {
                _roomId: hexStringToBigNumber(hexTopics[1].substr(0, 64)).toNumber(),
                _tableIndex: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                _winIndex: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
                _playerAddr: hexStringToTronAddress(hexData.substr(152, 40)),
                _winAmount: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
                _tx: txID,
                _status: 3,
                _ts: timestamp
              };
              // console.log(log);
              let result = await saveRoomResultInfo(log);
              if (!result) {
                return false;
              }
            } else if (eventCode === RingPvpCancel) {
              let log = {
                _roomId: hexStringToBigNumber(hexTopics[1].substr(0, 64)).toNumber(),
                _tx: txID,
                _status: 4,
                _ts: timestamp
              };
              let result = await saveRoomCancelInfo(log);
              if (!result) {
                return false;
              }
              // console.log(log);
            }
          }
        }
      }
    }
  }
  return true;
}

async function saveJoinRoomInfo(info) {
  console.log('save join room info!')
  let num = info._giftId == 2 ? 100 : 10;

  // let sql = "insert into tron_plat_event.chris_block_order(addr, block_id, num, ts) values (?, ?, ?, ?)"
  // let sql2 = "insert into tron_plat_event.chris_box(addr, num) values (?,?) ON DUPLICATE KEY update num = num + ?;"
  let player = 'player' + (info._seatIndex + 1);
  let tx = player + 'Tx';
  let sql = 'insert into tron_bet_admin.wheel_solo_order(room_id, seat_id, createTs,playerCnt, amount,' + player + ', ' + tx + ') values(?,?,?,?,?,?,?) on duplicate key update ' + player + '= ?,' + tx + ' = ?';
  // console.log(sql);
  let conn = null;
  try {
    conn = await getConnection();
    if (conn == null) {
      throw new Error('conn is null !!!');
    }
    conn.beginTransaction();
    await execTrans(sql, [info._roomId, info._seatIndex, info._ts, info._playerCnt, info._trxAmount, info._playerAddr, info._tx, info._playerAddr, info._tx], conn);
    conn.commit();
    conn.release();
  } catch (e) {
    console.log(e);
    if (conn) {
      conn.rollback();
      conn.release();
    }
    return false;
  }
  sendGameMsg(info._playerAddr, info._roomId, info._trxAmount);
  return true;
}

/**
 * 发送消息
 *
 * @param addr 钱包地址
 * @param order_id 房间标示
 * @param trxAmount 下注金额
 */
function sendGameMsg(addr, order_id, trxAmount) {
  const _now = lodash.now();
  if (_now < ACTIVITY_START_TS || _now > ACTIVITY_END_TS) return;
  redisUtil.redis.publish("game_message", JSON.stringify({addr: addr, order_id: order_id, amount: trxAmount, game_type: 3}));
}


async function saveRoomCancelInfo(info) {
  let player = 'player' + (info._seatIndex + 1);
  let tx = player + 'Tx';
  let sql = 'update tron_bet_admin.wheel_solo_order set status = ?, settleTx = ?,endTs = ? where room_id = ? ';
  // console.log(sql);
  let conn = null;
  try {
    conn = await getConnection();
    if (conn == null) {
      throw new Error('conn is null !!!');
    }
    conn.beginTransaction();
    await execTrans(sql, [info._status, info._tx, info._ts, info._roomId], conn);
    conn.commit();
    conn.release();
  } catch (e) {
    console.log(e);
    if (conn) {
      conn.rollback();
      conn.release();
    }
    return false;
  }
  return true;
}

async function saveRoomResultInfo(info) {
  let player = 'player' + (info._seatIndex + 1);
  let tx = player + 'Tx';
  let now = info._ts;
  let sql = 'update tron_bet_admin.wheel_solo_order set win = ?,roll = ?, winAddr = ?, status = ?, settleTx = ?,endTs = ? where room_id = ? ';
  let totalUpdateSql = 'insert into tron_bet_wzc.dice_players(addr, total, payout, play_times, win_times, mentor, referral, first_ts, lastest_ts, wheel_total, wheel_payout, wheel_play_times) \
    values (?,?,?,?,?,?,?,?,?,?,?,1) ON DUPLICATE KEY update wheel_total = wheel_total + ?, wheel_payout = wheel_payout + ?, lastest_ts = ?, win_times = win_times + ?, wheel_play_times = wheel_play_times + 1';
  let conn = null;
  try {
    conn = await getConnection();
    if (conn == null) {
      throw new Error('conn is null !!!');
    }
    conn.beginTransaction();
    await execTrans(sql, [info._winAmount, info._winIndex, info._playerAddr, info._status, info._tx, info._ts, info._roomId], conn);
    let result = await query('select player1, player2, player3, player4, amount from tron_bet_admin.wheel_solo_order where room_id = ?', [info._roomId]);
    // console.log(result[0]);
    if (result[0]) {
      if (result[0].player1) {
        let wheelUpdate = await execTrans(totalUpdateSql, [result[0].player1, 0, 0, 0, info._playerAddr == result[0].player1 ? 1 : 0, '', 0, now, now, result[0].amount || 0, info._playerAddr == result[0].player1 ? info._winAmount : 0, result[0].amount || 0, info._playerAddr == result[0].player1 ? info._winAmount : 0, now, info._playerAddr == result[0].player1 ? 1 : 0], conn);
      }
      if (result[0].player2) {
        let wheelUpdate = await execTrans(totalUpdateSql, [result[0].player2, 0, 0, 0, info._playerAddr == result[0].player2 ? 1 : 0, '', 0, now, now, result[0].amount || 0, info._playerAddr == result[0].player2 ? info._winAmount : 0, result[0].amount || 0, info._playerAddr == result[0].player2 ? info._winAmount : 0, now, info._playerAddr == result[0].player2 ? 1 : 0], conn);
      }
      if (result[0].player4) {
        let moonUpdate = await execTrans(totalUpdateSql, [result[0].player4, 0, 0, 0, info._playerAddr == result[0].player4 ? 1 : 0, '', 0, now, now, result[0].amount || 0, info._playerAddr == result[0].player4 ? info._winAmount : 0, result[0].amount || 0, info._playerAddr == result[0].player4 ? info._winAmount : 0, now, info._playerAddr == result[0].player4 ? 1 : 0], conn);
      }
      if (result[0].player3) {
        let moonUpdate = await execTrans(totalUpdateSql, [result[0].player3, 0, 0, 0, info._playerAddr == result[0].player3 ? 1 : 0, '', 0, now, now, result[0].amount || 0, info._playerAddr == result[0].player3 ? info._winAmount : 0, result[0].amount || 0, info._playerAddr == result[0].player3 ? info._winAmount : 0, now, info._playerAddr == result[0].player3 ? 1 : 0], conn);
      }
    }

    conn.commit();
    conn.release();
  } catch (e) {
    console.log(e);
    if (conn) {
      conn.rollback();
      conn.release();
    }
    return false;
  }
  return true;
}

function hexStringToTronAddress1(_hexStr) {
  return TronWeb.address.fromHex(_hexStr);
}

async function scanNext(blockNum) {
  try {
    let blockData = await getBlockData(blockNum);
    if (_.isEmpty(blockData)) {
      return false;
    }
    let result = await alysisBlockData(blockData, blockNum);
    return result;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function hexStringToBigNumber(_hexStr) {
  return new BigNumber(_hexStr, 16);
}

EMPTY_ADDRESS = '0000000000000000000000000000000000000000';
function hexStringToTronAddress(_hexStr) {
  if (_hexStr === EMPTY_ADDRESS) {
    return '';
  }
  return TronWeb.address.fromHex('41' + _hexStr);
}

async function main() {
  let blockNum = (await getMaxBlockNum()) + 1;
  while (true) {
    let stime = new Date().getTime();
    let result = await scanNext(blockNum);
    if (result) {
      await RecordBlockNum(blockNum);
      console.log('-----finish scan ring block num ', blockNum, ' in ', new Date().getTime() - stime, 'ms');
      blockNum += 1;
    } else {
      console.log('-----------restart ring blockNum : ', blockNum);
      await sleep(3000);
    }
  }
}

module.exports = {
  main
};
