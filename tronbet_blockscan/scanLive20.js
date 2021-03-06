const conf = require('./src/configs/config');
const xhr = require('axios');
const fs = require('fs');
const db = require('./src/utils/utilMysql');
const _ = require('underscore')._;
const sha3 = require('js-sha3');
const TronWeb = require('tronweb');
const moment = require('moment');
const BigNumber = require('bignumber.js');
// 更新用orm
const {sequelize, rawQuery, updateQuery} = require('./src/utils/mysqlUtils')

const EVENT_LIVE_USER_TRC20_TRANSFER = sha3.keccak256('Transfer(address,address,uint256)');
const EVENT_LIVE_USER_TRC20_WITHDRAW = sha3.keccak256('LivePayWithdrawTrc20(uint256,address,address,uint256)');

// LivePay
const LIVEPAY_ADDRESS = conf.tronConfig.live_pay;
// USDT
const USDT_ADDRESS = conf.tronConfig.usdt_address;
const USDT_POOL_OWNER = conf.tronConfig.usdt_pool_owner;

const scanBlocknumFileName = 'scanLive20.blocknum';

console.log('EVENT_LIVE_USER_TRC20_TRANSFER', EVENT_LIVE_USER_TRC20_TRANSFER);
console.log('EVENT_LIVE_USER_TRC20_WITHDRAW', EVENT_LIVE_USER_TRC20_WITHDRAW);

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
  let timestamp = raw_data.timestamp;
  let sign = tx.signature ? tx.signature[0] : '';
  let res = null;
  for (let _contract of contract) {
    let type = _contract.type;
    if (type != 'TriggerSmartContract') continue;

    let value = _contract.parameter.value;
    let owner_address = value.owner_address; //发起人地址
    let to_address = value.to_address; //转账合约时有效
    let contract_address = value.contract_address; //触发合约时有效

    let call_value = value.call_value || 0; //涉及金额 (单位:sun)
    let data = value.data; //触发合约时有效
    if (contract_address == null) continue;

    if (contract_address === USDT_ADDRESS || contract_address === LIVEPAY_ADDRESS) {
      //玩家下单之后事件通知
      let txInfo = await gettransactioninfobyid(txID);
      let logs = txInfo.log;
      if (txInfo.resMessage) {
        res.resMessage = hextoString(txInfo.resMessage);
      }
      if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
        for (let _log of logs) {
          let event_contract_address = '41' + _log.address;
          let hexTopics = _log.topics;
          let hexData = _log.data;
          let eventCode = hexTopics[0];
          if (eventCode === EVENT_LIVE_USER_TRC20_TRANSFER) {
            let currency = 'TRX';
            if (contract_address == USDT_ADDRESS) {
              currency = 'USDT';
            }
            if (`41${hexTopics[1].substr(24, 40)}` == USDT_POOL_OWNER) {
              continue;
            }
            if (`41${hexTopics[2].substr(24, 40)}` !== LIVEPAY_ADDRESS) {
              continue;
            }
            console.log(_log);
            let log = {
              _fromAddr: hexStringToTronAddress(hexTopics[1].substr(24, 40)),
              _amount: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
              _txId: txID,
              _ts: timestamp,
              _currency: currency
            };
            console.log(log);
            let result = await saveLiveUserRechargeLog(log);
            if (!result) {
              return false;
            }
          } else if (eventCode === EVENT_LIVE_USER_TRC20_WITHDRAW) {
            console.log(_log);
            let currency = 'TRX';
            if (`41${hexData.substr(24, 40)}` == USDT_ADDRESS) {
              currency = 'USDT';
            }
            let log = {
              _orderId: hexTopics[1],
              _fromAddr: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
              _amount: hexStringToBigNumber(hexData.substr(64, 64)).toNumber(),
              _tx_id: txID,
              _ts: timestamp,
              _currency: currency
            };
            console.log(log);
            let result = await saveLiveUserWithdrawLog(log);
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

async function saveLiveUserRechargeLog(info) {
  // let accountSql = 'select uid from tron_live.live_account where email = ?';
  // let sql = 'insert into tron_live.live_cb_deposit_log(uid, currency, addr, amount, txId, ts) values (?, ?, ?, ?, ?, ?)';
  // let sql2 =
  //   'insert into tron_live.live_balance(uid, addr, currency, tag, balance) values (?,?,?,?,?) on DUPLICATE KEY UPDATE addr = ?, tag = ?, balance = balance + ?;';
  // let conn = null;
  // try {
  //   let res = await db.query(accountSql, [info._fromAddr]);
  //   let uid = -1;
  //   if (_.isEmpty(res)) {
  //     let user = await userRegister(info._fromAddr, info._currency);
  //     uid = user[0].uid;
  //   } else {
  //     uid = res[0].uid;
  //   }
  //   conn = await db.getConnection();
  //   if (conn == null) {
  //     throw new Error('conn is null !!!');
  //   }
  //   conn.beginTransaction();
  //   await db.execTrans(sql, [uid, info._currency, info._fromAddr, info._amount, info._txId, info._ts], conn);
  //   await db.execTrans(sql2, [uid, info._fromAddr, info._currency, '', info._amount, info._fromAddr, '', info._amount], conn);
  //   conn.commit();
  // } catch (e) {
  //   console.log(e);
  //   if (conn) conn.rollback();
  //   if (e.code == 'ER_DUP_ENTRY') return true;
  //   return false;
  // } finally {
  //   if (conn) conn.release();
  // }
  // return true;
  /**
   * new version
   */
  if(info._ts <= 1594425600000){
    // 2020-07-11之前的数据不同步
    return true
  }else {
    return await sequelize.transaction(async (t) => {
      //
      let accountSql = 'select uid from tron_live.live_account where email = ?';
      let sql = 'insert into tron_live.live_cb_deposit_log(uid, currency, addr, amount, txId, ts) values (?, ?, ?, ?, ?, ?)';
      let sql2 =
          'insert into tron_live.live_balance(uid, addr, currency, tag, balance) values (?,?,?,?,?) on DUPLICATE KEY UPDATE addr = ?, tag = ?, balance = balance + ?;';
      //t
      let res = await rawQuery(accountSql, [info._fromAddr], t);
      let uid = -1;
      if (_.isEmpty(res)) {
        // let user = await userRegister(info._fromAddr, info._currency);
        let tmp1_sql = 'insert into tron_live.live_account(email, currency) values (?, ?)';
        await updateQuery(tmp1_sql, [info._fromAddr, info._currency], t);
        //
        let tmp1_uidSql = 'select * from tron_live.live_account where email = ?';
        let user = await rawQuery(tmp1_uidSql, [info._fromAddr], t);
        uid = user[0].uid;
      } else {
        uid = res[0].uid;
      }
      //
      await updateQuery(sql, [uid, info._currency, info._fromAddr, info._amount, info._txId, info._ts], t);
      await updateQuery(sql2, [uid, info._fromAddr, info._currency, '', info._amount, info._fromAddr, '', info._amount], t);
      //
      return true
    }).catch(e => {
      console.log("saveLiveUserRechargeLogTRC20_error:" + e.toString())
      return false
    })
  }
}

// async function userRegister(addr, currency) {
//   let sql = 'insert into tron_live.live_account(email, currency) values (?, ?)';
//   let res = await db.exec(sql, [addr, currency]);
//
//   let uidSql = 'select * from tron_live.live_account where email = ?';
//   let user = await db.exec(uidSql, [addr]);
//   return user;
// }

async function saveLiveUserWithdrawLog(info) {
  // try {
  //   let sql = 'update tron_live.live_cb_withdraw_log set status = 1, txId = ? where addr = ? and orderId = ?';
  //   let res = await db.query(sql, [info._tx_id, info._fromAddr, info._orderId]);
  // } catch (error) {
  //   console.log(error);
  //   return false;
  // }
  // return true;
  //
  return await sequelize.transaction(async (t) => {
    let sql = 'update tron_live.live_cb_withdraw_log set status = 1, txId = ? where addr = ? and orderId = ?';
    await updateQuery(sql, [info._tx_id, info._fromAddr, info._orderId], t);
    return true
  }).catch(e => {
    console.log("saveLiveUserWithdrawLogTRC20_error:" + e.toString())
    return false
  })
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
      console.log('-----finish scanLive20 block num ', blockNum, ' in ', new Date().getTime() - stime, 'ms');
      blockNum += 1;
    } else {
      console.log('-----------scanLive20 restart blockNum : ', blockNum);
      await sleep(3100);
    }
  }
}

module.exports = {
  main
};
