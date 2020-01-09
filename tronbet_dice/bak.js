async function onReady() {
    console.log("Robot is ready!!!");

    socket = io(config.dice_robot.socket_server);
    socket.on('disconnect', function () {
        console.error("disconnect !!!");
    });

    socket.on('login_info', onLoginReturn);
    socket.on('bet_info', onDiceResultReturn);

    socket.on('connect', async () => {
        socket.emit('login', { addr: myAddress });
    });
}

function onLoginReturn(data) {
    console.log("onLoginReturn");
    let t = setTimeout(() => {
        clearTimeout(t);
        // process.exit(0);
        createOrder(1, 5, 1, myPrivateKey);
    }, 200)
}

function createOrder(trx, num, dir, pk) {
    gameDice.getOrder(myAddress, myPrivateKey, (err, result) => {
        if (err) return;
        let order_id = result.orderid;
        begin_ts = _.now();
        if (result.roll === 255) {
            lost_count = 0;
            if (order_id <= last_order_id) { //已推送相应order已 完成，仍然读取到之前订单未解决
                console.warn("已完成order完成，仍然读取到旧数据，可能被回滚了", last_order_id, order_id);
                createOrder(trx, num, dir, myPrivateKey);
                return;
            }
            console.log('send confirmed order ' + order_id + '!!!');
            socket.emit('new_order', { address: myAddress, orderId: order_id, state: 1 }); //确认提交
        } else {
            gameDice.doBetCommon(trx * 1e6, num, dir, pk, (err, txRet) => {
                if (err) return console.error(err);
                if (txRet != null && txRet.result === true && txRet.transaction != null && !_.isEmpty(txRet.transaction.txID)) {
                    let pending_order_id = order_id;
                    console.log('send pending order ' + pending_order_id + '???', txRet.transaction.txID);
                    socket.emit('new_order', { address: myAddress, orderId: pending_order_id, state: 2 });//预提交
                    appEvent.emit("wait_confirmed", txRet.transaction.txID);
                } else {
                    console.warn("txRet problem", txRet);
                    createOrder(trx, num, dir, myPrivateKey);
                    return;
                }
            });
        }
    });
}

let to_wait_confirmed = null;

function onDiceResultReturn(data) {
    let _ts = _.now() - begin_ts;
    begin_ts = 0;
    if (data.orderId > last_order_id) {
        clearTimeout(to_wait_confirmed);
        console.log("==> √√√ order_id:[" + data.orderId + (data.direction === 0 ? "] under:" : "] over:") + data.number + " roll:" + data.roll + " cost:" + (_ts / 1e3).toFixed(2) + "s", "last_order_id:" + last_order_id);
        last_order_id = data.orderId;
        let t = setTimeout(() => {
            clearTimeout(t);
            createOrder(1, 5, 1, myPrivateKey);
        }, 1000);
    }
}

appEvent.on("wait_confirmed", (tx_id) => {
    waitOrderConfirmed(tx_id);
})

function waitOrderConfirmed(tx_id) {
    to_wait_confirmed = setTimeout(() => {
        clearTimeout(to_wait_confirmed);
        tronUtil.isTxSuccess(tx_id, null, null, (err, res) => {
            if (err != null || res == null) {
                console.log("tx unknown", tx_id);
                appEvent.emit("wait_confirmed", tx_id);
                return;
            }
            if (res === true) {
                console.log("tx success", tx_id);
                gameDice.getOrder(myAddress, myPrivateKey, (err, result) => {
                    if (err) console.error(err);
                    if (result.roll === 255) {
                        console.log('send confirmed order ' + result.orderid + '!!!', tx_id);
                        socket.emit('new_order', { address: myAddress, orderId: result.orderid, state: 1 }); //确认提交
                    } else { //WTF 虽然tx成功，但是订单还是已解决状态
                        if (result.orderid <= last_order_id) {//可能被回滚了
                            console.log("maybe tx roll back");
                            createOrder(1, 5, 1, myPrivateKey);
                        } else if(result.orderid > last_order_id){ //可能漏单了
                            console.log("maybe order lost");
                            createOrder(1, 5, 1, myPrivateKey);
                        }
                    }
                });
            } else {
                console.log("tx fail", tx_id);
                createOrder(1, 5, 1, myPrivateKey);
            }
        });
    }, 1000);
}
