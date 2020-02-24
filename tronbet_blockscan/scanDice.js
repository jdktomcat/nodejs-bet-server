const conf = require('./src/configs/config');
const xhr = require('axios');
const fs = require('fs');
const { query } = require('./src/utils/utilMysql');
const _ = require('underscore')._;
const TronWeb = require('tronweb');
const moment = require('moment');

const scanBlocknumFileName = 'scanDice.blocknum';

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
  if (transactions && !_.isEmpty(transactions) && _.isArray(transactions) && transactions.length > 0) {
    let txCount = transactions ? transactions.length : 0;
    console.log('-----------------------------------------------------------------------------------------------------------------');
    console.log('TRX区块:' + blockNumber + '; 出块时间:' + moment(ts).format('YYYY-MM-DD HH:mm:ss') + '; transactionnum:' + txCount + '; blockId:' + blockData.blockID);
    let app_txs = {};
    for (let txInfo of transactions) {
      if (txInfo.ret[0].contractRet != 'SUCCESS') {
        continue;
      }
      let result = await alysisTxs(txInfo);
      if (!result) {
        console.log('-------------------blockNumber----------failed---', blockNumber);
        return false;
      }
    }
  }
  return true;
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
      } else if (contract_address === conf.tronConfig.diceOrderAddr) {
        let info = {
          addr: hexStringToTronAddress1(owner_address),
          trID: txID,
          ts: timestamp,
          sign: sign
        };
        let result = await saveDB(info);
        //keep data failed, try again
        if (!result) {
          return result;
        }
      }
    }
  }
  return true;
}

async function saveDB(info) {
  let preBlock = await query('SELECT count(1) cnt from dice_user_order where tx_id = ?;', [info.trID]);
  if (preBlock && preBlock[0].cnt > 0) {
    console.log('----trx---', info.trID, '-----has in db---');
    return true;
  }
  // let querySql = "select max(order_id) order_id from dice_user_order where addr = ?"
  // let datas = await query(querySql, [info.addr])
  // let nextOrderId = 1
  // if (datas && datas[0].order_id) {
  //     nextOrderId = datas[0].order_id + 1
  // }
  try {
    let result = await query('insert into dice_user_order(tx_id, ts, sign, addr, order_id) select ?,?,?,?,count(1) + 1 from dice_user_order where addr = ?;', [info.trID, info.ts, info.sign, info.addr, info.addr]);
    console.log(result.affectedRows, '----');
  } catch (e) {
    console.log('insert db failed-------');
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
    console.log("now blockId is ",blockData.blockID,blockNum,_.isEmpty(blockData))
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

async function main() {
  let blockNum = await getMaxBlockNum();
  while (true) {
    let stime = new Date().getTime();
    let result = await scanNext(blockNum);
    if (result) {
      await RecordBlockNum(blockNum);
      console.log('-----finish scan dice block num ', blockNum, ' in ', new Date().getTime() - stime, 'ms');
      blockNum += 1;
    } else {
      console.log('-----------restart dice blockNum : ', blockNum);
      await sleep(3000);
    }
  }
}

module.exports = {
  main
};
