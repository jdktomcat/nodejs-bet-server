const _ = require('lodash')._;
const TronWeb = require('tronweb');
const config = require('../configs/config');
const log4js = require('../configs/log4js.config');

const HttpProvider = TronWeb.providers.HttpProvider;
const loggerError = log4js.getLogger('error');

const TEST_ADDRESS = "TGEJj8eus46QMHPgWQe1FJ2ymBXRm96fn1";
const NODE_UNABLE = 0;
const NODE_ENABLE = 1; 
const PING_INTERVAL = 9000;

let TRON_WEB_POOL = []; //TronWeb 实例池

function injectPromise(func, ...args) {
    return new Promise((resolve, reject) => {
        func(...args, (err, res) => {
            if (err)
                reject(err);
            else resolve(res);
        });
    });
}

function promiseInjector(scope) {
    return (func, ...args) => {
        return injectPromise(func.bind(scope), ...args);
    }
}

class TronWebExt extends TronWeb {
    constructor(fullNode, solidityNode, eventServer, privateKey) {
        super(fullNode, solidityNode, eventServer, privateKey);
        this.latestPing = Date.now() - PING_INTERVAL;

        this.fullState = NODE_UNABLE;
        this.solidityState = NODE_UNABLE;

        this.priority = 1; 
        this.nodeId = 1;  

        this.injectPromiseExt = promiseInjector(this); 
    }

    async doPing() {
        this.latestPing = Date.now();

        await this.fullNode.request('wallet/getaccount', { "address": TEST_ADDRESS }, 'post').then((account) => {
            this.fullState = NODE_ENABLE;
        }).catch((ex) => {
            this.fullState = NODE_UNABLE;
            loggerError.error("Ping fullNode[%s] failed: %s", this.fullNode.host, ex.code);
        });

        await this.solidityNode.request('walletsolidity/getaccount', { "address": TEST_ADDRESS }, 'post').then((account) => {
            this.solidityState = NODE_ENABLE;     
        }).catch((ex) => {
            loggerError.error("Ping solidityNode[%s] failed: %s", this.solidityNode.host, ex.code);
            this.solidityState = NODE_UNABLE;     
        });
    }

    getTransactionInfoUnconfirmed(transactionID, callback = false) {
        if (!callback) {
            return this.injectPromiseExt(this.getTransactionInfoUnconfirmed, transactionID);
        }
            
        this.fullNode.request('wallet/gettransactioninfobyid', { "value": transactionID }, 'post').then(transaction => {
            callback(null, transaction);
        }).catch(err => {
            callback(err);
        });
    }

    getConfirmedBlockByNumber(blockID, callback = false) {
        if (!callback) {
            return this.injectPromiseExt(this.getConfirmedBlockByNumber, blockID);
        }

        this.solidityNode.request('walletsolidity/getblockbynum', { num: parseInt(blockID) }, 'post').then(block => {
            if (!Object.keys(block).length) {
                return callback('Block not found');
            }  
            callback(null, block);
        }).catch(err => {
            callback(err)
        });
    }
}

// nodeType: 1(full)/2(solidity)/3(both)
async function getTronWeb(nodeType = 1) {
    if (TRON_WEB_POOL.length === 0) {
        await init();
    }
    for (let i = 0; i < TRON_WEB_POOL.length; ++i) {
        let node = TRON_WEB_POOL[i];
        if (nodeType == 1) {
            if (node.fullState == NODE_ENABLE) {
                return node;
            }
        } else if(nodeType == 2) {
            if (node.solidityState == NODE_ENABLE) {
                return node;
            }
        } else {
            if (node.fullState == NODE_ENABLE && node.solidityState == NODE_ENABLE) {
                return node;
            }
        }
    }
    return null;
}

// 按优先级找一个Id不一样的节点, 如果找不到Id不一样的, 返回一个优先级最高的, 再没有就返回null
async function getTronWebNot(excludeId, nodeType = 1) {
    if (TRON_WEB_POOL.length === 0) {
        await init();
    }

    let firstFind = null;
    for (let i = TRON_WEB_POOL.length - 1; i >= 0; --i) {
        let node = TRON_WEB_POOL[i];
        if (nodeType == 1) {
            if (node.fullState != NODE_ENABLE) { continue; }  
        } else if (nodeType == 2) {
            if (node.solidityState != NODE_ENABLE) { continue; } 
        } else {
            if (node.fullState != NODE_ENABLE || node.solidityState != NODE_ENABLE) { continue; } 
        }

        if (firstFind == null) { 
            firstFind = node;
        }

        if (node.nodeId != excludeId) {
            return node;
        }
    }
    return firstFind;
}

async function init() {
    let nodeCfg = config.tronConfig.tronNode;
    let privateKey = config.tronConfig.defaultPk;
    let cfgIndex = 0;
    for (let cfg of nodeCfg) {
        cfgIndex += 1;
        try {
            let fullNode = new HttpProvider(cfg.fullUrl);
            let solidityNode = new HttpProvider(cfg.solidityUrl);
            let tronWebNode = new TronWebExt(fullNode, solidityNode, 'https://api.trongrid.io', privateKey);
            tronWebNode.priority = cfg.priority || cfgIndex;    // 节点优先级
            tronWebNode.nodeId = cfgIndex;                      // 节点Id

            await tronWebNode.doPing();

            TRON_WEB_POOL.push(tronWebNode);
            TRON_WEB_POOL.sort((lhs, rhs) => { lhs.priority < rhs.priority; });
        } catch(e) {
            loggerError.error(e);
        }
    }

    setInterval(() => {
        for (let node of TRON_WEB_POOL) {
            let tmNow = Date.now();
            if (tmNow - node.latestPing >= PING_INTERVAL) {
                node.doPing();
            } 
        }
    }, 5000);
}

module.exports.getTronWeb = getTronWeb;
module.exports.getTronWebNot = getTronWebNot;
