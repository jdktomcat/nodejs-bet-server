const conf = require('./src/configs/config');
const xhr = require('axios');
const fs = require('fs');
const { query } = require('./src/utils/utilMysql');
const _ = require('underscore')._;
const TronWeb = require('tronweb');
const moment = require('moment');
const sha3 = require('js-sha3');
const BigNumber = require('bignumber.js');

let hostSlot = 0;

const redis = require('ioredis').createClient({
  host: conf.redisConfig.host,
  port: conf.redisConfig.port,
  password: conf.redisConfig.pwd,
  db: conf.redisConfig.db
});

const EVENT_Divide = sha3.keccak256('LiveDivide(uint256,uint256)');
const EVENT_CODE_DivideCreate = sha3.keccak256('LiveDivideCreate(uint64,uint64,uint64,uint64,uint64)');
const EVENT_CODE_DivideComplete = sha3.keccak256('LiveDivideComplete(uint64,uint64,uint64,uint64,uint64)');
const EVENT_CODE_DivideStep = sha3.keccak256('LiveDivideStep(uint256,address,uint64,uint64,uint64,uint64,uint256,uint256)');
const EVENT_LiveAirDrop = sha3.keccak256('LiveAirDrop(address,uint256,uint128,uint128,uint256)');

// TronBetLiveDivider
const DIVIDEND_ADDR = conf.tronConfig.tron_bet_live_divider;
// TronBetLive
const PAY_ADDR = conf.tronConfig.tron_bet_live;
// TronBetLivePool
const LIVE_POOL_ADDR = conf.tronConfig.tron_bet_live_pool;

const scanBlocknumFileName = 'scan_live_divs.blocknum';

console.log('EVENT_Divide', EVENT_Divide);
console.log('EVENT_CODE_DivideCreate', EVENT_CODE_DivideCreate);
console.log('EVENT_CODE_DivideComplete', EVENT_CODE_DivideComplete);
console.log('EVENT_CODE_DivideStep', EVENT_CODE_DivideStep);
console.log('EVENT_LiveAirDrop', EVENT_LiveAirDrop);

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
    if (type != 'TriggerSmartContract') continue;
    let value = _contract.parameter.value;
    let contract_address = value.contract_address; //触发合约时有效
    if (contract_address == null) continue;
    if (contract_address === DIVIDEND_ADDR || contract_address === PAY_ADDR || contract_address === LIVE_POOL_ADDR) {
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
          let hexTopics = _log.topics;
          let hexData = _log.data;
          let eventCode = hexTopics[0];
          console.log(eventCode);
          if (eventCode === EVENT_Divide) {
            console.log('-sssssssssssssssssssssssssssssssssssssssss');
            let log = {
              _type: 'dividends_pre',
              round: hexStringToBigNumber(hexTopics[1]).toNumber(),
              trxAmountTotal: hexStringToBigNumber(hexData.substr(0, 64)).toNumber()
            };
            hostSlot = hexStringToBigNumber(hexData.substr(64, 64)).toNumber();
            redis.publish('tron_live_dividends', JSON.stringify(log));
            console.log(log);
          } else if (eventCode === EVENT_CODE_DivideCreate) {
            //
            console.log(_log);
            let log = {
              _type: 'dividends_create',
              round: hexStringToBigNumber(hexTopics[1]).toNumber(),
              trxAmountTotal: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
              tokenAmountTotal: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
              maxHolderIndex: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
              tmCreate: hexStringToBigNumber(hexData.substr(192, 64)).toNumber()
            };
            redis.publish('tron_live_dividends', JSON.stringify(log));
            console.log(log);
            let result = await saveRoundInfo(log);
            if (!result) {
              return false;
            }
          } else if (eventCode === EVENT_CODE_DivideComplete) {
            console.log(_log);
            let log = {
              _type: 'dividends_complete',
              round: hexStringToBigNumber(hexTopics[1]).toNumber(),
              trxAmountTotal: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
              tokenAmountTotal: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
              maxHolderIndex: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
              tmCompleted: hexStringToBigNumber(hexData.substr(192, 64)).toNumber()
            };
            console.log(log);
            redis.publish('tron_live_dividends', JSON.stringify(log));
            let result = await saveCompleteInfo(log);
            if (!result) {
              return false;
            }
          } else if (eventCode === EVENT_CODE_DivideStep) {
            let log = {
              _type: 'dividends_step',
              index: hexStringToBigNumber(hexTopics[1]).toNumber(),
              owner: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
              round: hexStringToBigNumber(hexTopics[3]).toNumber(),
              trxAmountTotal: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
              tokenAmountTotal: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
              maxHolderIndex: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
              tokenAmount: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
              trxAmount: hexStringToBigNumber(hexData.substr(256, 64)).toNumber(),
              txID: txID
            };

            redis.publish('tron_live_dividends', JSON.stringify(log));
            let result = await saveRoundDetail(log);
            if (!result) {
              return false;
            }
          } else if (eventCode === EVENT_LiveAirDrop) {
            let log = {
              player: hexStringToTronAddress(hexTopics[1].substr(24, 40)),
              tokenAmount: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
              fromSec: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
              toSec: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
              txID: txID
            };
            console.log(log);
            let result = await saveAirDropLog(log);
            if (!result) {
              return false;
            }
          }
        }
      }
    }
  }
  return true;
}

async function saveAirDropLog(info) {
  try {
    let sql = 'insert into tron_live.live_airdrop_log(addr, startTs, endTs, betAmount,adAmount, txId, status, confirmedStatus) values(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE adAmount = ?, txId = ?, status = 1,confirmedStatus = 1';
    await query(sql, [info.player, info.fromSec, info.toSec, 0, info.tokenAmount, info.txID, 1, 1, info.tokenAmount, info.txID]);
  } catch (error) {
    console.log(error);
    return false;
  }
  return true;
}

async function saveRoundInfo(info) {
  let sqlDividendsInsert = 'insert into tron_live.live_div_info (round,total_token,total_trx,send_ts,div_state, rank_trx) values (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE total_token = ?,total_trx=?,send_ts=?,div_state=?';
  try {
    console.log("info.trxAmountTotal===>pre", info.trxAmountTotal);
    info.trxAmountTotal = info.trxAmountTotal / 0.9;
    console.log("info.trxAmountTotal===>back", info.trxAmountTotal);

    let hotRank = Math.floor((info.trxAmountTotal * 0.03) / 0.97);
    await query(sqlDividendsInsert, [info.round, info.tokenAmountTotal, info.trxAmountTotal, info.tmCreate, 1, hotRank, info.tokenAmountTotal, info.trxAmountTotal, info.tmCreate, 1]);
  } catch (e) {
    console.log(e);
    return false;
  }
  return true;
}

async function saveRoundDetail(info) {
  try {
    let sqlDividendsDetail = 'insert into tron_live.live_div_detail (round,addr,token,trx,total_token, total_trx,state,tx_id) values (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE tx_id = ?';
    let res = await query(sqlDividendsDetail, [info.round, info.owner, info.tokenAmount, info.trxAmount, info.tokenAmountTotal, info.trxAmountTotal, 3, info.txID, info.txID]);
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}

async function saveCompleteInfo(info) {
  try {
    let sqlDividendsUpdate = 'update tron_live.live_div_info set div_state = 2 where round = ?;';
    await query(sqlDividendsUpdate, [info.round]);
  } catch (error) {
    console.log(error);
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
      console.log('-----finish scan_live_divs block num ', blockNum, ' in ', new Date().getTime() - stime, 'ms');
      blockNum += 1;
    } else {
      console.log('-----------scan_live_divs restart blockNum : ', blockNum);
      await sleep(3000);
    }
  }
}

module.exports = {
  main
};
