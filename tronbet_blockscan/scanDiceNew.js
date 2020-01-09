const conf = require("./src/configs/config");
const xhr = require("axios");
const fs = require("fs");
const { query, getConnection,execTrans } = require("./src/utils/utilMysql");
const _ = require("underscore")._;
const TronWeb = require("tronweb");
const moment = require("moment");
const sha3 = require("js-sha3");
const BigNumber = require("bignumber.js");

const scanBlocknumFileName = "scanDice.blocknum";
const EVENT_DiceCreate = sha3.keccak256(
  "DiceCreate(uint256,address,uint256,uint256,uint256)"
);
// 4a0276f32d1dc1f56ff4e6491876a2f2512eb9ed7e9da8307716b6204e3c6340
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function RecordBlockNum(block_num) {
  try {
    fs.writeFile(scanBlocknumFileName, block_num, (err, data) => {});
  } catch (e) {
    console.log("Failed....");
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
    url: conf.tronConfig.tron_url_solidity + "/walletsolidity/getnowblock",
    method: "post",
    data: {}
  });
  return data;
}

async function getBlockData(blockNum) {
  let { data } = await xhr({
    url: conf.tronConfig.tron_url_solidity + "/walletsolidity/getblockbynum",
    method: "post",
    data: {
      num: blockNum
    }
  });
  return data;
}

async function alysisBlockData(blockData, blockNumber) {
  let ts = blockData.block_header.raw_data.timestamp;
  let transactions = blockData.transactions;
  if (
    transactions &&
    !_.isEmpty(transactions) &&
    _.isArray(transactions) &&
    transactions.length > 0
  ) {
    let txCount = transactions ? transactions.length : 0;
    console.log(
      "-----------------------------------------------------------------------------------------------------------------"
    );
    console.log(
      "TRX区块:" +
        blockNumber +
        "; 出块时间:" +
        moment(ts).format("YYYY-MM-DD HH:mm:ss") +
        "; transactionnum:" +
        txCount +
        "; blockId:" +
        blockData.blockID
    );
    let app_txs = {};
    for (let txInfo of transactions) {
      if (txInfo.ret[0].contractRet != "SUCCESS") {
        continue;
      }
      let result = await alysisTxs(txInfo);
      if (!result) {
        console.log(
          "-------------------blockNumber----------failed---",
          blockNumber
        );
        return false;
      }
    }
  }
  return true;
}

async function gettransactioninfobyid(txID) {
  let { data } = await xhr({
    url:
      conf.tronConfig.tron_url_solidity +
      "/walletsolidity/gettransactioninfobyid",
    method: "post",
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
  let sign = tx.signature ? tx.signature[0] : "";
  let res = null;
  for (let _contract of contract) {
    let type = _contract.type;
    if (type === "TriggerSmartContract") {
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
        //玩家下单之后事件通知
        let txInfo = await gettransactioninfobyid(txID);
        let logs = txInfo.log;
        if (logs && _.isArray(logs) && !_.isEmpty(logs)) {
          for (let _log of logs) {
            let hexTopics = _log.topics;
            let hexData = _log.data;
            let eventCode = hexTopics[0];
            if (eventCode === EVENT_DiceCreate) {
              let log = {
                _orderId: hexStringToBigNumber(
                  hexTopics[1].substr(0, 64)
                ).toNumber(),
                _fromAddr: hexStringToTronAddress(hexTopics[2].substr(24, 40)),
                _number: hexStringToBigNumber(hexData.substr(0, 64)).toNumber(),
                _direction: hexStringToBigNumber(
                  hexData.substr(64, 64)
                ).toNumber(),
                _amount: hexStringToBigNumber(
                  hexData.substr(128, 64)
                ).toNumber(),
                _sign: sign,
                _tx_id: txID,
                _ts: timestamp
              };
              console.log("log", log);
              let result = await saveDiceOrder(log);
              //keep data failed, try again
              if (!result) {
                return result;
              }
            }
          }
        }

        // let info = {
        //   addr: hexStringToTronAddress1(owner_address),
        //   trID: txID,
        //   ts: timestamp,
        //   sign: sign
        // };
      }
    }
  }
  return true;
}

async function saveDB(info) {
  try {
    let result = await query(
      "insert into dice_user_order(tx_id, ts, sign, addr, order_id) select ?,?,?,?,count(1) + 1 from dice_user_order where addr = ?;",
      [info.trID, info.ts, info.sign, info.addr, info.addr]
    );
    console.log(result.affectedRows, "----");
  } catch (e) {
    console.log("insert db failed-------");
    return false;
  }
  return true;
}

async function saveDiceOrder(info) {
  let sql =
    "insert into tron_bet_admin.dice_user_order(tx_id, ts, sign, addr, order_id) values (?, ?, ?, ?, ?) ON DUPLICATE KEY update ts = ?, tx_id = ?, sign = ?";
  let conn = null;
  try {
    conn = await getConnection();
    if (conn == null) {
      throw new Error("conn is null !!!");
    }
    conn.beginTransaction();
    await execTrans(
      sql,
      [
        info._tx_id,
        info._ts,
        info._sign,
        info._fromAddr,
        info._orderId,
        info._ts,
        info._tx_id,
        info._sign
      ],
      conn
    );
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

function hexStringToBigNumber(_hexStr) {
  return new BigNumber(_hexStr, 16);
}

EMPTY_ADDRESS = "0000000000000000000000000000000000000000";
function hexStringToTronAddress(_hexStr) {
  if (_hexStr === EMPTY_ADDRESS) {
    return "";
  }
  return TronWeb.address.fromHex("41" + _hexStr);
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

async function main() {
  let blockNum = await getMaxBlockNum();
  while (true) {
    let stime = new Date().getTime();
    let result = await scanNext(blockNum);
    if (result) {
      await RecordBlockNum(blockNum);
      console.log(
        "-----finish scan dice new blockNum ",
        blockNum,
        " in ",
        new Date().getTime() - stime,
        "ms"
      );
      blockNum += 1;
    } else {
      console.log("-----------restart dice new blockNum : ", blockNum);
      await sleep(3000);
    }
  }
}

module.exports = {
  main
};
