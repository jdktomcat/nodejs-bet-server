const conf = require('./src/configs/config');
const xhr = require('axios');
const fs = require('fs');
const { query } = require('./src/utils/utilMysql');
const _ = require('underscore')._;
const TronWeb = require('tronweb');
const moment = require('moment');
const sha3 = require('js-sha3');
const BigNumber = require('bignumber.js');

const redis = require('ioredis').createClient({
  host: conf.redisConfig.host,
  port: conf.redisConfig.port,
  password: conf.redisConfig.pwd,
  db: conf.redisConfig.db
});

const EVENT_SNAPSHOT_STARTED = sha3.keccak256('SnapshotStarted(uint32,uint64,uint32)');
const EVENT_SNAPSHOT_COMPLETED = sha3.keccak256('SnapshotCompleted(uint32,uint64,uint32)');
const EVENT_WIN_DIVIDEND_CREATE = sha3.keccak256('WinDividendCreate(uint256,uint64,uint256,uint256[],uint32,uint32)');
const EVENT_WIN_DIVIDEND_STEP = sha3.keccak256('WinDividendStep(uint256,uint256,address,uint64)');
const EVENT_WIN_DIVIDEND_COMPLETE = sha3.keccak256('WinDividendComplete(uint256,uint256,uint256[],uint32,uint32)');
const EVENT_WIN_DIVIDEND_TRANSFERTRC20 = sha3.keccak256('TransferTRC20(address,address,uint256)');

// WinDividend
const WIN_DIVIDEND = conf.tronConfig.win_dividend;
// USDT
const USDT_ADDRESS = conf.tronConfig.usdt_address;

const scanBlocknumFileName = 'scan_win_divs20.blocknum';

console.log('EVENT_SNAPSHOT_STARTED', EVENT_SNAPSHOT_STARTED);
console.log('EVENT_SNAPSHOT_COMPLETED', EVENT_SNAPSHOT_COMPLETED);
console.log('EVENT_WIN_DIVIDEND_CREATE', EVENT_WIN_DIVIDEND_CREATE);
console.log('EVENT_WIN_DIVIDEND_STEP', EVENT_WIN_DIVIDEND_STEP);
console.log('EVENT_WIN_DIVIDEND_COMPLETE', EVENT_WIN_DIVIDEND_COMPLETE);
console.log('EVENT_WIN_DIVIDEND_TRANSFERTRC20', EVENT_WIN_DIVIDEND_TRANSFERTRC20);

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
    console.log(
      '-----------------------------------------------------------------------------------------------------------------'
    );
    console.log(
      'TRX区块:' +
        blockNumber +
        '; 出块时间:' +
        moment(ts).format('YYYY-MM-DD HH:mm:ss') +
        '; transactionnum:' +
        txCount +
        '; blockId:' +
        blockData.blockID
    );
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
    if (contract_address === WIN_DIVIDEND) {
      //玩家下单之后事件通知
      let txInfo = await gettransactioninfobyid(txID);
      let logs = txInfo.log;
      if (txInfo.resMessage) {
        res.resMessage = hextoString(txInfo.resMessage);
      }
      // console.log('logs', logs, 'end');
      if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
        for (let _log of logs) {
          // loggerDefault.info("_log",_log);
          let event_contract_address = '41' + _log.address;
          let hexTopics = _log.topics;
          let hexData = _log.data;
          let eventCode = hexTopics[0];
          console.log(eventCode);
          if (eventCode === EVENT_SNAPSHOT_STARTED) {
            let log = {
              _type: 'dividends_snapshot_started',
              snapshotCnt: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
              totalStakingAmount: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
              stakerCnt: hexStringToBigNumber(hexData.substr(128, 64)).toNumber()
            };
            redis.publish('tron_win_trc20_dividends', JSON.stringify(log));
            console.log(log);
          } else if (eventCode === EVENT_SNAPSHOT_COMPLETED) {
            console.log(_log);
            let log = {
              _type: 'dividends_snapshot_completed',
              snapshotCnt: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
              totalStakingAmount: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
              stakingInfoLength: hexStringToBigNumber(hexData.substr(128, 64)).toNumber()
            };
            redis.publish('tron_win_trc20_dividends', JSON.stringify(log));
            console.log(log);
          } else if (eventCode === EVENT_WIN_DIVIDEND_CREATE) {
            console.log(_log);
            let log = {
              _type: 'dividends_create',
              round: hexStringToBigNumber(hexTopics[1]).toNumber(),
              totalStakingAmount: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
              trxTrc10: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
              nextStakingIndex: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
              start: hexStringToBigNumber(hexData.substr(256, 64)).toNumber()
            };
            let trc20s = hexStringToBigNumber(hexData.substr(320, 64)).toNumber();
            for (let i = 0; i < trc20s; i++) {
              let trc20Addr = hexData.substr(384 + i * 64 + 2, 40);
              let amount = hexStringToBigNumber(hexData.substr(384 + i * 64 + 42, 22)).toNumber();
              await saveRoundInfo(log, trc20Addr, amount);
            }
            redis.publish('tron_win_trc20_dividends', JSON.stringify(log));
            console.log(log);
          } else if (eventCode === EVENT_WIN_DIVIDEND_STEP) {
            let log = {
              _type: 'dividends_step',
              round: hexStringToBigNumber(hexTopics[1]).toNumber(),
              dividIndex: hexStringToBigNumber(hexTopics[2].substr(0, 64)).toNumber(),
              player: hexStringToTronAddress(hexTopics[3].substr(24, 40)),
              stakingAmnt: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
              txID: txID
            };

            for (let l of logs) {
              if (`41${l.address}` == WIN_DIVIDEND) {
                let topics = l.topics;
                let data = l.data;

                let event = topics[0];
                if (event === EVENT_WIN_DIVIDEND_TRANSFERTRC20) {
                  let player = hexStringToTronAddress(topics[1].substr(24, 40));
                  if (player == log.player) {
                    let trc20Addr = topics[2].substr(24, 40);
                    let amount = hexStringToBigNumber(data.substr(0, 64)).toNumber();
                    console.log(log);
                    await saveRoundDetail(log, trc20Addr, amount);
                  }
                }
              }
            }
            redis.publish('tron_win_trc20_dividends', JSON.stringify(log));
          } else if (eventCode === EVENT_WIN_DIVIDEND_COMPLETE) {
            let log = {
              _type: 'dividends_complete',
              round: hexStringToBigNumber(hexTopics[1]).toNumber(),
              nextStakingIndex: hexStringToBigNumber(hexData.substr(128, 64)).toNumber(),
              end: hexStringToBigNumber(hexData.substr(192, 64)).toNumber(),
              txID: txID
            };
            console.log(log);
            redis.publish('tron_win_trc20_dividends', JSON.stringify(log));
            await saveCompleteInfo(log);
          }
        }
      }
    }
  }
  return true;
}

async function saveRoundInfo(info, trc20Addr, amount) {
  let now = new Date().getTime();
  let { currency, addr } = getCurrency(trc20Addr);
  let sql = `INSERT INTO tron_live.win_trc20_div_info
    (round, total_token, amount, start, trc20, currency, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE updated_at = ?`;
  try {
    await query(sql, [info.round, info.totalStakingAmount, amount, info.start, addr, currency, now, now, now]);
  } catch (e) {
    console.log(e);
    return false;
  }
  return true;
}

async function saveRoundDetail(info, trc20Addr, amount) {
  let now = new Date().getTime();
  let { currency, addr } = getCurrency(trc20Addr);

  try {
    let sql = `INSERT INTO tron_live.win_trc20_div_detail
    (round, addr, token, amount, tx_id, trc20, currency, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE updated_at = ?`;

    await query(sql, [info.round, info.player, info.stakingAmnt, amount, info.txID, addr, currency, now, now, now]);
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}

async function saveCompleteInfo(info) {
  try {
    let sql = `UPDATE tron_live.win_trc20_div_info SET state = 2, end = ? WHERE round = ?;`;
    await query(sql, [info.end, info.round]);
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

function getCurrency(address) {
  if (address.length == 40) {
    address = `41${address}`;
  }

  let currency = 'unkn';
  let addr = TronWeb.address.fromHex(address);
  if (address == USDT_ADDRESS) {
    currency = 'USDT';
  }
  return { currency, addr };
}

async function main() {
  let blockNum = (await getMaxBlockNum()) + 1;
  while (true) {
    let stime = new Date().getTime();
    let result = await scanNext(blockNum);
    if (result) {
      await RecordBlockNum(blockNum);
      console.log('-----finish scan_win_divs20 block num ', blockNum, ' in ', new Date().getTime() - stime, 'ms');
      blockNum += 1;
    } else {
      console.log('-----------scan_win_divs20 restart blockNum : ', blockNum);
      await sleep(3000);
    }
  }
}

module.exports = {
  main
};
