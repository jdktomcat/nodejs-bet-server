process.env.NODE_ENV = 'production'
const tronUtils = require("../src/utils/tronUtil");
const common = require("../src/utils/common");
const { tronConfig } = require('../src/configs/config');

async function withDraw(user) {
    let result = await tronUtils.tronExec(
        tronConfig.withdrawAddr,
        "Withdraw(address,uint256,uint256)",
        5e6,
        0,
        [
            { type: "address", value: user.addr },
            { type: "uint256", value: user.toPay },
            { type: "uint256", value: "0x" + user.orderId }
        ]
    );
    console.log(result);
}

async function fix() {
    let users = [
    ];
    let addrs = [
        { addr: "TFLYd2Bk7CtsfQFpLnm2fKp2CsSwTDGmx2", toPay: 250*10000*1000000 },
    ];
    for (let item of addrs) {
        let obj = {};
        obj.addr = item.addr;
        obj.toPay = item.toPay;
        obj.orderId ="ff61dd81fff75a5a69c4049474dde50305fea0aaed83fd94950ff6fff93f13ff";//防止重复发送 
        users.push(obj);
    }
    for (let one of users) {
        console.log(one)
        await withDraw(one);
    }
}

async function main() {
    await fix()
    process.exit(0);
}

main().catch(e=>{
    console.log(e)
    process.exit(1)
})
