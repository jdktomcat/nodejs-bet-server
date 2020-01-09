const _ = require('lodash')._;
const TronWeb = require('tronweb');
const config = require('../configs/config');
const nodeConfigs = config.tronConfig.node;
const HttpProvider = TronWeb.providers.HttpProvider;
const log4js = require('../configs/log4js.config');
const loggerDefault = log4js.getLogger('default');
const loggerError = log4js.getLogger('error');
const evnets = require('events');
const appEvent = new evnets.EventEmitter();
const defaultPk = config.tronConfig.node.master.defaultPk;

const HTTP_TIME_OUT = config.tronConfig.HTTP_TIME_OUT;
const SCAN_NODE_INTERVAL = config.tronConfig.SCAN_NODE_INTERVAL;
const IGNORE_SOLIDITY_NODE_SCAN = config.tronConfig.IGNORE_SOLIDITY_NODE_SCAN;

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
        // return this.trx.getBalance(TEST_ADDRESS).then(() => {
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
                // loggerDefault.info(this.name, this.fullNode.host, "ping avg", this.pingAvg + " ms", "state", this.state);
                return this.lost;
            }).catch((error) => {
                this.pingAvg = 999999999;
                this.ping = 999999999;
                this.lost = this.lost + 1;
                this.state = TRONWEB_NODE_STATE.NODE_UNABLE;
                // console.log(this.fullNode.host, "ping avg", this.pingAvg + " ms", "state", this.state);
                // console.error(error);
                // loggerDefault.warn("ping tron node by getBalance ==> error", this.name, this.fullNode.host, this.solidityNode.host, error.code);
                // loggerError.error("ping tron node by getBalance ==> error", this.name, this.fullNode.host, this.solidityNode.host, error.code);
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
    // console.log("betterNode.ping",betterNode.name,betterNode.pingAvg);
    let masterNode = getTronWebByName('master');
    // console.log("masterNode",masterNode.name,masterNode.pingAvg);
    if (betterNode != null && betterNode.name !== "master" && masterNode != null && (masterNode.pingAvg - betterNode.pingAvg < 100)) { //主节点延时在100ms可接受范围内优先选用masterNode
        // console.log("using master node");
        betterNode = masterNode;
    }
    if (betterNode != null && betterNode.name !== "master") {
        // loggerDefault.warn("getTronWebBetter =>", betterNode.name, betterNode.pingAvg);
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
    if (_.isEmpty(name) || name === "default" || name === "DEFAULT") {
        return getTronWebBetter();
    } else {
        let _node = _.find(TRON_WEB_POOL, (node) => {
            return node.name === name && node.state != null && node.state === TRONWEB_NODE_STATE.NODE_ENABLE;
        });
        return _node;
    }
}

async function initTronWeb(name, cfg) {
    if (name == null || _.isEmpty(name)) return;
    cfg = cfg || nodeConfigs[name];
    try {
        return new MyTronWeb(
            fullNode = new HttpProvider(cfg.url_full, HTTP_TIME_OUT),
            solidityNode = new HttpProvider(cfg.url_solidity, HTTP_TIME_OUT),
            eventServer = cfg.url_event,
            privateKey = defaultPk || cfg.defaultPk,
            name = name
        );
    } catch (error) {
        loggerError.error("init tronweb fail!", error);
        return null;
    }
}

appEvent.on('scaning', () => {
    // loggerDefault.info("new scan");
    let t = setTimeout(async () => {
        clearTimeout(t);
        for (let name in TRON_WEB_POOL) {
            let node = TRON_WEB_POOL[name];
            let lost = await node.doPing();
            if (lost > 0) {
                // loggerDefault.warn("node " + name + " lost " + lost);
                if (lost >= 3) {
                    // loggerDefault.warn("node " + name + " reset!!!");
                    TRON_WEB_POOL[name] = await initTronWeb(name, nodeConfigs[name]);
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
    for (let name in nodeConfigs) {
        let cfg = nodeConfigs[name];
        TRON_WEB_POOL[name] = await initTronWeb(name, cfg);
    }

    //不使用setInterval,避免超时期间不停发起新的请求
    appEvent.emit('scaning');
}

module.exports.init = init;
module.exports.appEvent = appEvent;
module.exports.getTronWeb = getTronWeb;