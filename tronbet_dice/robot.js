const io = require('socket.io-client');
const _ = require('lodash')._;
const events = require('events');
const config = require('./src/configs/config');
const gameDice = require('./gameDice');
const tronNodePool = require('./src/service/tronNodePool');
const tronUtil = require('./src/utils/tronUtil');
const TrxWallet = require('./src/wallet/TrxWallet');

async function init() {
    await tronNodePool.init();
}

let ROBOT_COUNT = 20;
let MIN_ROBOT_TRX = 1.5;
let MIN_MASTER_TRX = 100;
let SEND_TO_ROBOT_TRX = 10;

tronNodePool.appEvent.on('ready', () => {
    console.log("onReady");
    let wallet = TrxWallet.fromMnemonic(config.dice_robot.mnemonic);
    // console.log(wallet.getAccount(0));
    // let masterWallet = wallet.getAccount(0);
    // let masterAddr = masterWallet.address;
    // let masterPk = masterWallet.privateKeyHex;
    // for (let idx = 3; idx <= 3; idx++) {
    //     let acc = wallet.getAccount(idx);
    //     let addr = acc.address;
    //     let pk = acc.privateKeyHex;
    //     console.log("Robot",idx,addr);
    //     tronUtil.getAccount(addr, null, null, (err, res) => {
    //         if (res != null && res.balance != null && res.balance >= MIN_ROBOT_TRX * 1e6) {
    //             console.log("I have money!", addr, res.balance / 1e6 + " TRX");
    //             let robot = new Robot(addr, pk);
    //             robot.login();
    //         } else {
    //             tronUtil.getAccount(masterAddr, null, null, (err, res) => {
    //                 if (res != null && res.balance != null && res.balance >= MIN_MASTER_TRX * 1e6) {
    //                     tronUtil.sendTrx(addr, SEND_TO_ROBOT_TRX * 1e6, null, masterPk, (err, res) => {
    //                         if (res != null) {
    //                             console.log("I come back!", addr, SEND_TO_ROBOT_TRX + " TRX");
    //                             let robot = new Robot(addr, pk);
    //                             robot.login();
    //                         }
    //                     });
    //                 } else {
    //                     // console.log("Master is so poor!", masterAddr, res.balance / 1e6 + " TRX");
    //                 }
    //             });
    //         }
    //     });
    // }

    let defaultPK = '';
    let robot = new Robot('TAHAyhFkRz37o6mYepBtikrrnCNETEFtW5',defaultPK);
})

init();

function Robot(_addr, _pk) {
    console.log("new robot! addr:" + _addr + " pk:" + _pk);
    this.begin_ts = 0;
    this.end_ts = 0;
    this.lost_count = 0; //连续等待次数
    this.last_order_id = 0; //最新已解决订单数
    this.timeout_wait_confirmed = null;
    this.timeout_wait_result = null;
    this.timeout_retry_order = null;
    this.tx = null;

    this.myAddress = _addr;
    this.myPrivateKey = _pk;

    this.appEvent = new events.EventEmitter();
    this.appEvent.on("wait_confirmed", (tx_id) => {
        this.timeout_wait_confirmed = setTimeout(() => {
            clearTimeout(this.timeout_wait_confirmed);
            this.waitOrderConfirmed(tx_id);
        }, 3000);
    });
    this.appEvent.on("retry_order", (trx, num, dir, pk) => {
        this.timeout_retry_order = setTimeout(() => {
            clearTimeout(this.timeout_retry_order);
            this.createOrder(trx, num, dir, pk);
        }, 1000);
    });
    this.appEvent.on('wait_result', () => {
        this.timeout_wait_result = setTimeout(() => {
            clearTimeout(this.timeout_wait_result);
            this.waitOrderResult();
        }, 1000);
    })

    this.socket = io(config.dice_robot.socket_server);
    this.socket.on('disconnect', function () {
        console.error("disconnect !!!");
    });
    this.socket.on('login_info', () => {
        this.onLoginReturn.apply(this);
    });
    this.socket.on('bet_info', (data) => {
        if (data.bettor !== this.myAddress) {
            return;
        }
        this.onDiceResultReturn.call(this, data);
    });
    this.socket.on('connect', () => {
        console.log("connect");
    });
    this.login = () => {
        console.log("I come back!" + this.myAddress);
        this.socket.emit('login', { addr: this.myAddress });
    }
    this.onLoginReturn = () => {
        console.log("onLoginReturn");
        this.timeout_retry_order = setTimeout(() => {
            clearTimeout(this.timeout_retry_order);
            this.createOrder(1, 5, 1, this.myPrivateKey);
        }, 200)
    }

    this.createOrder = (trx, num, dir, pk) => {
        // console.log("begin createOrder");
        this.tx = "";
        clearTimeout(this.timeout_wait_confirmed);
        clearTimeout(this.timeout_retry_order);
        clearTimeout(this.timeout_wait_result);
        gameDice.getOrder(this.myAddress, pk, (err, result) => {
            if (err) {
                console.error("createOrder->getOrder->fail", err);
                this.appEvent.emit('retry_order', trx, num, dir, pk);
                return;
            };
            let order_id = result.orderid;
            this.begin_ts = _.now();
            if (result.roll === 255 && result.orderid !== 0) {
                this.lost_count = 0;
                if (order_id <= this.last_order_id && this.last_order_id > 0) { //已推送相应order已 完成，仍然读取到之前订单未解决
                    console.warn("当前待解决订单 <= 已完成订单 last_order_id，可能被回滚了", this.last_order_id, order_id, _.now());
                    // let t = setTimeout(() => {
                    //     clearTimeout(t);
                    //     this.createOrder(trx, num, dir, pk);
                    // }, 3000)
                    // return;
                }
                console.log('send confirmed order ' + order_id + '!!!');
                this.socket.emit('new_order', { address: this.myAddress, orderId: order_id, state: 1 }); //确认提交
                this.appEvent.emit('wait_result');
            } else {
                gameDice.doBetCommon(trx * 1e6, num, dir, pk, (err, txRet) => {
                    if (err) {
                        console.error("createOrder->doBetCommon->fail", err);
                        console.error("createOrder->doBetCommon->fail", trx, num, dir, pk);
                        this.appEvent.emit('retry_order', trx, num, dir, pk);
                        return;
                    }
                    if (txRet != null && txRet.result === true && txRet.transaction != null && !_.isEmpty(txRet.transaction.txID)) {
                        let pending_order_id = order_id;
                        // console.log('send pending order ' + pending_order_id + '???', txRet.transaction.txID);
                        this.tx = txRet.transaction.txID;
                        this.socket.emit('new_order', { address: this.myAddress, orderId: pending_order_id, state: 2 });//预提交
                        this.appEvent.emit("wait_confirmed", this.tx);
                    } else {
                        console.warn("txRet problem", txRet);
                        this.createOrder(trx, num, dir, pk);
                        return;
                    }
                });
            }
        });
    }

    this.onDiceResultReturn = (data) => {
        let _ts = _.now() - this.begin_ts;
        this.begin_ts = 0;
        if (data.orderId > this.last_order_id) {
            if (this.last_order_id !== 0 && data.orderId > this.last_order_id + 1) {
                console.warn("looooooooost order ==>" + (this.last_order_id + 1) + " last_order_id=" + this.last_order_id + " result_order_id=" + data.orderId);
            }
            this.tx = "";
            clearTimeout(this.timeout_retry_order)
            clearTimeout(this.timeout_wait_confirmed);
            clearTimeout(this.timeout_wait_result);
            console.log("==> √√√ order_id:[" + data.bettor + ":" + data.orderId + (data.direction === 0 ? "] under:" : "] over:") + data.number + " roll:"
                + data.roll + " cost:" + (_ts / 1e3).toFixed(2) + "s");
            this.last_order_id = data.orderId;
            let t = setTimeout(() => {
                clearTimeout(t);
                this.createOrder(1, 5, 1, this.myPrivateKey);
            }, 1000);
        }
    }

    this.waitOrderConfirmed = (tx_id) => {
        if (tx_id !== this.tx || _.isEmpty(this.tx)) {
            return;
        }
        tronUtil.isTxSuccess(tx_id, null, null, (err, res) => {
            if (err != null || res == null) {
                // console.error("waitOrderConfirmed->isTxSuccess->fail",err);
                // console.log("tx unknown", tx_id);
                this.appEvent.emit("wait_confirmed", tx_id);
                return;
            }
            if (res === true) {
                console.log("tx success", tx_id);
                gameDice.getOrder(this.myAddress, this.myPrivateKey, (err, result) => {
                    if (err) {
                        console.error("waitOrderConfirmed->getOrder->fail", err);
                        this.appEvent.emit("wait_confirmed", tx_id);
                        return;
                    }
                    if (result.roll === 255) {
                        // console.log('send confirmed order ' + result.orderid + '!!!', tx_id);
                        this.socket.emit('new_order', { address: this.myAddress, orderId: result.orderid, state: 1 }); //确认提交
                        this.appEvent.emit('wait_result');
                    } else { //WTF 虽然tx成功，但是订单还是已解决状态
                        if (result.orderid <= this.last_order_id) {//可能被回滚了
                            // console.log("!!!maybe tx roll back", tx_id);
                            this.createOrder(1, 5, 1, this.myPrivateKey);
                        } else if (result.orderid > this.last_order_id) { //可能漏单了
                            // console.log("!!!maybe order lost", tx_id);
                            this.createOrder(1, 5, 1, this.myPrivateKey);
                        }
                    }
                });
            } else {
                console.log("××× tx fail", tx_id,res);
                this.createOrder(1, 5, 1, this.myPrivateKey);
            }
        });
    }

    this.waitOrderResult = () => {
        gameDice.getOrder(this.myAddress, null, (err, result) => {
            if (err) {
                console.error("waitOrderResult->getOrder->fail", err);
                this.appEvent.emit("wait_result");
                return;
            }
            if (result.roll === 255) {
                // console.log('send confirmed order ' + result.orderid + '!!!');
                this.socket.emit('new_order', { address: this.myAddress, orderId: result.orderid, state: 1 }); //确认提交
                this.appEvent.emit("wait_result");
            } else { //WTF 虽然tx成功，但是订单还是已解决状态
                if (result.orderid <= this.last_order_id) {//可能被回滚了
                    console.log("maybe tx roll back");
                    this.createOrder(1, 5, 1, this.myPrivateKey);
                }
                // else if (result.orderid > this.last_order_id) { //可能漏单了
                //     console.log("maybe order lost");
                //     this.createOrder(1, 5, 1, this.myPrivateKey);
                // }
            }
        });
    }
}