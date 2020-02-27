// const redisUtil = require("./src/utils/redisUtil");
// const axios = require("axios");
// const game = require("./src/service/games");
//
// async function gameGames() {
//   let games = await game.parseGames();
//   await redisUtil.hset("tronlive:gamelist", "games", JSON.stringify(games));
//   console.log(games);
// }
//
// async function main() {
//   await gameGames();
//   process.exit(0);
// }
//
// main();


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

async function main() {
    await burn();
    process.exit(0);
}

main();


