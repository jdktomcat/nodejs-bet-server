const _ = require('underscore')._;
const TronWeb = require('tronweb');
const config = require('../configs/config');
const HttpProvider = TronWeb.providers.HttpProvider;
const events = require('events');
const pingEvent = new events.EventEmitter();
const log4js = require('../configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');

let LIST_TRON_WEB = [
    {
        tronWeb: new TronWeb(
            fullNode = new HttpProvider(config.tronConfig.tron_url_full),
            solidityNode = new HttpProvider(config.tronConfig.tron_url_solidity),
            eventServer = config.tronConfig.tron_url_event,
            privateKey = false
        ),
        ping: 0,
        avg: 999999999,
        times: 0,
        name: "master"
    },
    {
        tronWeb: new TronWeb(
            fullNode = new HttpProvider(config.tronConfig.back_tron_url_full),
            solidityNode = new HttpProvider(config.tronConfig.back_tron_url_solidity),
            eventServer = config.tronConfig.back_tron_url_event,
            privateKey = false
        ),
        ping: 0,
        avg: 999999999,
        times: 0,
        name: "slave"
    },
]

function ping(index, times, _callback) {
    let node = LIST_TRON_WEB[index]
    let tronWeb = node.tronWeb;
    let start_ts = Date.now();
    tronWeb.trx.getBalance('TGEJj8eus46QMHPgWQe1FJ2ymBXRm96fn1').then(() => {
        let ping = Date.now() - start_ts;
        let avg = Math.floor((node.ping + ping) / 2);
        node.ping = ping;
        node.avg = avg;
        node.times = times;
        // loggerDefault.info(node.name,node.ping,node.avg,node.times);
        _callback(null, true);
    }).catch((error) => {
        loggerError.error(error);
        node.ping = 999999999;
        node.avg = 999999999;
        node.times = times;
        _callback(null, true);
    });
}

pingEvent.on('pingNext', getBetterNode);

function getBetterNode(times, _init) {
    times = (times || 0) + 1;//第几次检测
    let delay = times === 1 ? 1 : 2500;
    let timer = setInterval(() => {
        clearTimeout(timer);
        for (let index = 0; index < LIST_TRON_WEB.length; index++) {
            ping(index, times, () => {
                let no_return = _.find(LIST_TRON_WEB, function (element) { return element.times !== times; });
                if (no_return == null) {
                    pingEvent.emit("pingNext", times);
                    if (_init) _init();
                }
            });
        }
    }, delay);
}

function init() {
    return new Promise((resolve, reject) => {
        getBetterNode(0, () => {
            resolve(true);
        });
    });
}

function getTronWeb() {
    // let _list = _.sortBy(LIST_TRON_WEB, 'avg');
    // let bettor_node = _list[0];
    // if (bettor_node.avg > 0 && bettor_node.avg < 999999999) {
    //     loggerDefault.info("bettor_node", "name:" + bettor_node.name, "ping:" + bettor_node.ping, "avg:" + bettor_node.avg);
    //     return bettor_node.tronWeb;
    // } else {
    //     loggerError.error("WTF!!!TronWeb is not ready!!!");
    //     return null;
    // }

    // let LIST_TRON_WEB = _.sortBy(LIST_TRON_WEB, 'avg');
    let master_node = LIST_TRON_WEB[0];
    let slave_node = LIST_TRON_WEB[1];
    if (master_node.avg > 0 && master_node.avg < 999999999) { //优先使用主节点
        // loggerDefault.info("user master_node", "ping:" + master_node.ping, "avg:" + master_node.avg);
        return master_node.tronWeb;
    } else if (slave_node.avg > 0 && slave_node.avg < 999999999) { //不得以使用备用节点
        loggerError.error("user slave_node", "ping:" + slave_node.ping, "avg:" + slave_node.avg);
        return slave_node.tronWeb;
    } else {
        loggerError.error("WTF!!!TronWeb is not ready!!!");
        return null;
    }
}

module.exports.init = init;
module.exports.getTronWeb = getTronWeb;