const _ = require('lodash')._;
const TronWeb = require('tronweb');
const config = require('../configs/config');
const nodeConfigs = config.TronWeb.nodes;
const HttpProvider = TronWeb.providers.HttpProvider;
const log4js = require('../configs/log4js.config');
const loggerDefault = log4js.getLogger('default');
const loggerError = log4js.getLogger('error');
const evnets = require('events');
const appEvent = new evnets.EventEmitter();
const defaultPk = config.GAME_MANAGER;

const HTTP_TIME_OUT = config.TronWeb.HTTP_TIME_OUT;
const SCAN_NODE_INTERVAL = config.TronWeb.SCAN_NODE_INTERVAL;
const IGNORE_SOLIDITY_NODE_SCAN = config.TronWeb.IGNORE_SOLIDITY_NODE_SCAN;

const TRONWEB_NODE_STATE = {
    NODE_BUSY: 2,
    NODE_ENABLE: 1,
    NODE_UNABLE: 0
}

let TRON_WEB_POOL = {}; //TronWeb 实例池
let isReady = false;

class MyTronWeb extends TronWeb {
    constructor(fullNode, solidityNode, eventServer, privateKey, name = "unknown") {
        super(fullNode, solidityNode, eventServer, privateKey);
        this.name = name;
        this.ping = 0;
        this.pingAvg = 0;
        this.lost = 0;
        this.last_ping_ts = Date.now();
        this.state = TRONWEB_NODE_STATE.NODE_UNABLE;
    }

    doPing() {
        let _start_ts = Date.now();
        return this.fullNode.request('wallet/getnowblock', {}, 'post')
            .then(() => { //测试solidityNode
                if (IGNORE_SOLIDITY_NODE_SCAN === false) {
                    return this.solidityNode.request('walletsolidity/getnowblock', { "address": TEST_ADDRESS }, 'post'); //测试soliditynode
                } else {
                    return true;
                }
            })
            .then(() => {
                let _end_ts = Date.now();
                let ping = _end_ts - _start_ts;
                this.pingAvg = Math.floor((this.ping + ping) / 2);
                this.ping = ping;
                if (this.lost > 0) loggerDefault.info(this.name + " node lost times reset = 0");
                this.lost = 0;
                this.state = TRONWEB_NODE_STATE.NODE_ENABLE;
                return this.lost;
            }).catch((error) => {
                this.pingAvg = 999999999;
                this.ping = 999999999;
                this.lost = this.lost + 1;
                this.state = TRONWEB_NODE_STATE.NODE_UNABLE;
                return this.lost;
            });
    }
}

let getTronWebBetter = () => {
    let sortedNodePool = _.sortBy(TRON_WEB_POOL, function (item) {
        return item.pingAvg;
    });
    let betterNode = _.find(sortedNodePool, (item) => {
        return item.state != null && item.state === TRONWEB_NODE_STATE.NODE_ENABLE;
    });
    let masterNode = getTronWebByName('master');
    if (betterNode != null && betterNode.name !== "master" && masterNode != null && (masterNode.pingAvg - betterNode.pingAvg < 100)) { 
        betterNode = masterNode;
    }
    if (betterNode != null && betterNode.name !== "master") {
    }
    return betterNode;
}

let getTronWebByName = (name) => {
    name = name || "master";
    let _node = _.find(TRON_WEB_POOL, (node) => {
        return node.name === name && node.state != null && node.state === TRONWEB_NODE_STATE.NODE_ENABLE;
    });
    return _node;
}

let getTronWeb = (name) => {
    //console.log(TRON_WEB_POOL);
    if (_.isEmpty(name) || name === "default" || name === "DEFAULT") {
        return getTronWebBetter();
    } else {
        let _node = _.find(TRON_WEB_POOL, (node) => {
            return node.name === name && node.state != null && node.state === TRONWEB_NODE_STATE.NODE_ENABLE;
        });
        return _node;
    }
}

async function initTronWeb(name) {
    if (name == null || _.isEmpty(name)){
	return;
    }
    console.log("初始化tronweb["+name+ "]"+config[name+"_full"]);
    try {
        return new MyTronWeb(
            fullNode = new HttpProvider(config[name+"_full"], HTTP_TIME_OUT),
            solidityNode = new HttpProvider(config[name+"_solidity"], HTTP_TIME_OUT),
            eventServer = config[name+"_event"],
            privateKey = defaultPk,
            name = name
        );
    } catch (error) {
        loggerError.error("init tronweb fail!", error);
        return null;
    }
}

appEvent.on('scaning', () => {
    let t = setTimeout(async () => {
        clearTimeout(t);
        for (const name of nodeConfigs) {
            let node = TRON_WEB_POOL[name];
            let lost = await node.doPing();
            if (lost > 0) {
                if (lost >= 3) {
                    TRON_WEB_POOL[name] = await initTronWeb(name);
                }
            }
        }
        if (isReady === false) {
            isReady = true;
            appEvent.emit('ready');
        }
        appEvent.emit('scaning');
    }, SCAN_NODE_INTERVAL);
})
async function init() {
    for (const name of nodeConfigs) {
        TRON_WEB_POOL[name] = await initTronWeb(name);
    }
    appEvent.emit('scaning');
}

module.exports.init = init;
module.exports.appEvent = appEvent;
module.exports.getTronWeb = getTronWeb;
