const _ = require('lodash')._;
const TronWeb = require('tronweb');
const config = require('../configs/config');
const HttpProvider = TronWeb.providers.HttpProvider;
const log4js = require('../configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');

const TEST_ADDRESS = "TGEJj8eus46QMHPgWQe1FJ2ymBXRm96fn1";

const TRONWEB_NODE_STATE = {
    NODE_BUSY: 2,
    NODE_ENABLE: 1,
    NODE_UNABLE: 0
}

let TRON_WEB_POOL = []; //TronWeb 实例池

class MyTronWeb extends TronWeb {
    constructor(fullNode, solidityNode, eventServer, privateKey, name = "") {
        super(fullNode, solidityNode, eventServer, privateKey);
        this.name = name;
        this.ping = 0;
        this.pingAvg = 0;
        this.last_ping_ts = Date.now();
        this.state = TRONWEB_NODE_STATE.NODE_UNABLE;
        setInterval(() => {
            this.doPing();
        }, 1501);
    }
    onFail() {
        this.fail = this.fail + 1;
        if (this.fail >= 3) {
            this.state = TRONWEB_NODE_STATE.NODE_UNABLE;
        }
    }
    doPing() {
        let _start_ts = Date.now();
        // return this.trx.getBalance(TEST_ADDRESS).then(() => {
        return this.fullNode.request('wallet/getaccount', { "address": TEST_ADDRESS }, 'post').then(() => { //测试fullnode
            return this.solidityNode.request('walletsolidity/getaccount', { "address": TEST_ADDRESS }, 'post'); //测试soliditynode
        }).then(() => {
            let _end_ts = Date.now();
            let ping = _end_ts - _start_ts;
            this.pingAvg = Math.floor((this.ping + ping) / 2);
            this.ping = ping;
            this.state = TRONWEB_NODE_STATE.NODE_ENABLE;
            // console.log(this.fullNode.host, "ping avg", this.pingAvg + " ms", "state", this.state);
        }).catch((error) => {
            this.pingAvg = 999999999;
            this.ping = 999999999;
            this.state = TRONWEB_NODE_STATE.NODE_UNABLE;
            // console.log(this.fullNode.host, "ping avg", this.pingAvg + " ms", "state", this.state);
            loggerError.error("ping tron node by getBalance ==> error", this.fullNode.host, this.solidityNode.host, error.code);
        });
    }
}

let getTronWeb = async () => {
    if (TRON_WEB_POOL.length === 0) {
        await init();
    }
    let _node = _.find(TRON_WEB_POOL, (node) => {
        return node.state && node.state === TRONWEB_NODE_STATE.NODE_ENABLE;
    });
    if(_node.fullNode.host === config.tronConfig.back_tron_url_full){
        loggerDefault.warn("using slave node! fullNode = " + _node.fullNode.host + " solidityNode = "+ _node.solidityNode.host);
    }
    return _node;
}

async function init() {
    let masetrNode = null;
    let slaveNode = null;
    try {
        masetrNode = new MyTronWeb(
            fullNode = new HttpProvider(config.tronConfig.tron_url_full),
            solidityNode = new HttpProvider(config.tronConfig.tron_url_solidity),
            eventServer = config.tronConfig.tron_url_event,
            privateKey = config.tronConfig.defaultPk
        );
    } catch (error) {
        loggerError.error(error);
    }
    try {
        slaveNode = new MyTronWeb(
            fullNode = new HttpProvider(config.tronConfig.back_tron_url_full),
            solidityNode = new HttpProvider(config.tronConfig.back_tron_url_solidity),
            eventServer = config.tronConfig.back_tron_url_event,
            privateKey = config.tronConfig.defaultPk
        );
    } catch (error) {
        loggerError.error(error);
    }

    if (masetrNode) { await masetrNode.doPing(); TRON_WEB_POOL.push(masetrNode); }
    if (slaveNode) { await slaveNode.doPing(); TRON_WEB_POOL.push(slaveNode); }

    setInterval(() => {
        for (let node of TRON_WEB_POOL) {
            node.doPing();
        }
    }, 3000);
}

module.exports.getTronWeb = getTronWeb;