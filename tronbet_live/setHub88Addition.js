// const redisUtil = require("./src/utils/redisUtil");
// const axios = require("axios");

// // hub88倍率
// // let hub88Gamelist = [
// //   {
// //     name: "Jingle spin",
// //     gameId: 1323,
// //     num: 1
// //   },
// //   {
// //     name: "Jack and the beanstalk",
// //     gameId: 1314,
// //     num: 1
// //   },
// //   {
// //     name: "onzo\'s Quest",
// //     gameId: 1300,
// //     num: 1
// //   },
// //   {
// //     name: "Aloha! Cluster Pays",
// //     gameId: 1164,
// //     num: 1
// //   },
// //   {
// //     name: "Dazzle me",
// //     gameId: 1248,
// //     num: 1
// //   },
// //   {
// //     name: "Pyramid: Quest for Immortality",
// //     gameId: 1355,
// //     num: 1
// //   },
// //   {
// //     name: "Steam tower",
// //     gameId: 1381,
// //     num: 1
// //   }
// // ];


// let hub88Gamelist = [
//   { name: 'Torch of Fire', gameId: 619, num: 1 },
//   { name: 'Hidden Kingdom', gameId: 620, num: 1 },
//   { name: 'Magic Forest', gameId: 621, num: 1 },
//   { name: 'Heroes Empire', gameId: 622, num: 1 },
//   { name: 'China Charms', gameId: 623, num: 1 },
//   { name: 'Lucky Express', gameId: 624, num: 1 },
//   { name: 'Lost Saga', gameId: 625, num: 1 },
//   { name: 'Basketball Pro', gameId: 626, num: 1 },
//   { name: 'Football Pro', gameId: 627, num: 1 },
//   { name: 'Enchanted Cash', gameId: 639, num: 1 }
// ]

// async function getAdditionByGameId(GameID) {
//   try {
//     let multi = await redisUtil.hget("tronlive:hub88:addition", "" + GameID);
//     console.log("tronlive:hub88:addition", multi);
//     if (!multi) return 1;
//     return Number(multi);
//   } catch (error) {
//     console.log(error);
//     return 1;
//   }
// }

// async function getAddition() {
//   for (let item of hub88Gamelist) {
//     await getAdditionByGameId(item.gameId);
//   }
// }

// async function setAdditionByGameId(gameInfo) {
//   let redisRes = await redisUtil.hset(
//     "tronlive:hub88:addition",
//     "" + gameInfo.gameId,
//     gameInfo.num
//   );
//   console.log("redisRes", gameInfo.name, redisRes);
// }

// async function setAddition() {
//   for (let item of hub88Gamelist) {
//     await setAdditionByGameId(item);
//   }
// }

// async function main() {
//   await setAddition();
//   await getAddition();
//   process.exit(0);
// }

// main();


// let prdCfg = {};
// try {
//   prdCfg = require('/data/tronbet_config/config');
//   // prdCfg = require("/data/tronbet_config/config_test");
// } catch (error) {
//   console.log("using app config");
// }

// const TronWeb = require("tronweb");
// const HttpProvider = TronWeb.providers.HttpProvider;
// const fullNode = new HttpProvider(prdCfg.master_full);
// const solidityNode = new HttpProvider(prdCfg.master_solidity);
// const eventServer = prdCfg.master_event;
// const privateKey = prdCfg.operatorDice_pk;

// let tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

// const contract_address = prdCfg.contract.TronBetDiceDev; //合约地址

// //获取合约
// async function getContractInstance() {
//   let contractInstance = await tronWeb.contract().at(contract_address);
//   return contractInstance;
// }

// async function setDiceRate(gameId, startDate, endDate, rate) {
//   console.log(gameId, startDate, endDate, rate);
//   let contractInstance = await getContractInstance();
//   const transactionID = await contractInstance
//     .setGamePromotion(gameId, startDate, endDate, rate)
//     .send()
//     .catch(error => {
//       console.log(error);
//     });
//   console.log(transactionID);
//   return transactionID;
// }

// // gameId分辨是1代表DICE,2代表Moon,3代表Ring,4代表RingPvp
// let gameId = [1, 2, 3, 4];
// let startTime = new Date("2020-01-04 9:00:00").getTime() / 1000;
// let endTime = new Date("2020-01-05 9:00:00").getTime() / 1000;
// const rateInit = 10000;
// let rate = 1.8 * rateInit;

// // setDiceRate(gameId[0], startTime, endTime, rate);
// // setDiceRate(gameId[1], startTime, endTime, rate);
// // setDiceRate(gameId[2], startTime, endTime, rate);
// setDiceRate(gameId[3], startTime, endTime, rate);


let prdCfg = {};
try {
  prdCfg = require('/data/tronbet_config/config');
  // prdCfg = require("/data/tronbet_config/config_test");
} catch (error) {
  console.log("using app config");
}

const TronWeb = require("tronweb");
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider(prdCfg.master_full);
const solidityNode = new HttpProvider(prdCfg.master_solidity);
const eventServer = prdCfg.master_event;
const privateKey = prdCfg.operatorDice_pk;

let tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

const contract_address = prdCfg.contract.TronBetPool20; //合约地址

//获取合约
async function getContractInstance() {
  let contractInstance = await tronWeb.contract().at(contract_address);
  return contractInstance;
}

async function burn() {
  let contractInstance = await getContractInstance();
  const transactionID = await contractInstance
    .burnWin()
    .send()
    .catch(error => {
      console.log(error);
    });
  console.log(transactionID);
  return transactionID;
}

burn();
