const io = require('socket.io-client');
const tronBetService = require('./src/service/tronBetService');
const TronWeb = require('TronWeb');
const TrxWallet = require('./src/wallet/TrxWallet');
const _ = require('underscore')._;
let tronBetEvent = tronBetService.tronBetEvent;

let masterPrivateKey = null; //机器人主账号私钥
let masterAddress = null; //机器人主账号地址
let ALL_ROBOTS = new Map();
let socket = null;

class Robot {
    constructor(_address, _privateKey) {
        this.privateKey = _privateKey;
        this.address = _address;
    }
}

function doBet(privateKey, address) {
    tronBetService.getAccount(address).then(async (accountInfo) => {
        //////////////
        let balance = accountInfo.balance || 0;
        if (balance >= default_balance_sun * profit_rate) {//transfer to master
            console.log("transfer to master")
            tronBetService.transfer(privateKey, masterAddress, balance - default_balance_sun);
        } else if (balance < min_balance_sun) {//transfer from master
            console.log("transfer from master")
            let masterAccountInfo = await tronBetService.getAccount(masterAddress);
            let masterBalance = masterAccountInfo.balance;
            let amount = default_balance_sun - balance;
            if (masterBalance < amount) {
                console.error("Robot have no money");
                return
            }
            tronBetService.transfer(masterPrivateKey, address, default_balance_sun - balance);
            waitMoneyEnough(address, default_balance_sun);
            return;
        }

        let max = bet_sun_max;
        let min = bet_sun_min;
        if (max > balance) {
            max = balance;
        }
        let bet_sun = _.random(min, max);
        // console.log(bet_sun,min,max,balance);
        bet_sun = Math.floor(bet_sun/1e6) * 1e6;
        // console.log(bet_sun,min,max,balance);
        let number = _.random(number_min, number_max);
        let _direction = direction;
        if (direction == null || (direction !== 0 && direction !== 1)) {
            _direction = _.random(0, 1);
        }
        let sec = _.random(interval_min, interval_max);

        console.log("*ROBOT* :) (balance:" + Math.floor(balance/1e6) + "trx) do bet in " + sec + " ms", " ==> param{address:" + address + "; amount:" + bet_sun / 1000000 + "trx; number:" + number + "; direction:" + _direction + "}");
        let timer = setTimeout(() => {
            clearTimeout(timer);
            tronBetService.doBet(bet_sun, number, _direction, privateKey.toUpperCase()).then((result) => {
                submitConfirm(address);
            }).catch((e) => {
                console.log(e);
            });
        }, sec);
    });
}

function submitConfirm(address) {
    tronBetService.getWaitOrder(address, (err, data) => {
        if (err) {
            // console.log("submitlater");
            tronBetEvent.emit('submitlater', address);
            return;
        }
        socket.emit("new_order", { address: address, orderId: data.orderId });
    });
}

tronBetEvent.on('submitlater', (_address) => {
    let timer = setTimeout(() => {
        clearTimeout(timer);
        submitConfirm(_address)
    }, 3000);
})

function waitMoneyEnough(addr, val) {
    let id = setInterval(() => {
        tronBetService.getAccount(addr).then((result) => {
            if (result.balance >= val) {
                tronBetEvent.emit("transfer", addr);
                clearInterval(id);
            }
        });
    }, 3000);
}

function onResolve(betResult) {
    let address = TronWeb.address.fromHex(betResult.bettor);
    let robot = ALL_ROBOTS.get(address);
    if (robot) {
        console.log("betResult", betResult.bettor + "_" + betResult.orderId);
        doBet(robot.privateKey, robot.address);
    }
}

function onTransfer(addressHex) {
    let address = TronWeb.address.fromHex(addressHex);
    let robot = ALL_ROBOTS.get(address);
    console.log("onTransfer", address, robot);
    if (robot) {
        doBet(robot.privateKey, robot.address);
    }
}

async function init() {
    let wallet = new TrxWallet({ mnemonic: mnemonic, privateKey: null });
    let trxAccount = wallet.getAccount(0);
    masterPrivateKey = trxAccount.privateKeyHex;
    masterAddress = TronWeb.address.fromPrivateKey(masterPrivateKey);
    let masterAccountInfo = await tronBetService.getAccount(masterAddress);
    if (masterAccountInfo == null) {
        console.log("master account is not exists!");
        return;
    }
    console.log("masterAddress", masterAddress);
    console.log("masterPrivateKey", masterPrivateKey);
    let masterBalance = masterAccountInfo.balance || 0
    console.log("masterBalance", masterBalance);
    if (masterBalance < default_balance_sun) {
        //await tronBetService.transfer(null, masterAddress, 2000 * 1000000); //向机器人主账号转账
        console.log("Robot is so poor!!! The balance < " + default_balance_sun);
        // return;
    }

    tronBetEvent.on("transfer", onTransfer);

    for (let i = 1; i <= robots_count; i++) {
        let trxAccount = wallet.getAccount(i);
        let _privateKey = trxAccount.privateKeyHex;
        let _address = TronWeb.address.fromPrivateKey(_privateKey);
        let robot = new Robot(_address, _privateKey);
        console.log("add robot,", i, robot.address,_privateKey);
        //////
        ALL_ROBOTS.set(robot.address, robot);
        doBet(robot.privateKey, robot.address);
        submitConfirm(robot.address);
    }
}

socket = io(config.dice_robot.socket_server);
socket.on('disconnect', function () {
    console.error("disconnect !!!")
    init();
});
socket.on('bet_info', onResolve);

socket.on('connect', async () => {
    init();
});
