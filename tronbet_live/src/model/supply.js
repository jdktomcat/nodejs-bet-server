const tronUtils = require("../utils/tronUtil");
const common = require("../utils/common");
const config = require('../configs/config');
const db = require('../utils/dbUtil')

async function withDraw(user) {
    const addr = config.tronConfig.withdrawAddr
    const params = [
        {type: "address", value: user.addr},
        {type: "uint256", value: user.toPay},
        {type: "uint256", value: "0x" + user.orderId}
    ]
    let result = await tronUtils.tronExec(
        addr,
        "Withdraw(address,uint256,uint256)",
        5e6,
        0,
        params
    );
    console.log(result);
    return result
}

/**
 * format
 * {
 *     "address1": 1233333,
 *     "address2": 44444,
 *     "address3": 1000000,
 * }
 * @param params
 * @returns {Promise<void>}
 */
async function supplyTrxToAddrByBatch(arr) {
    /**
     *  arr =   [{address: 'dadasdas',pay: 123333000000 }]
     */
    const tmp = arr.slice(0)
    for (let one of tmp) {
        await supplyTrxToAddr(one);
    }
}


async function supplyTrxToAddr(query) {
    const id = common.getRandomSeed(64)
    const arrs = {
        addr: query.address,
        toPay: Number(query.pay) * 1000000,
        orderId: id
    }
    console.log("debug params--->", arrs)
    const t = await withDraw(arrs);
    return t
}

async function addReissueRecord(address, amount, tx_id, operator) {
    let sql = "insert into live_reissue_record(address,amount,tx_id,currency,operator,ts) values (?,?,?,?,?,?)"
    await db.exec(sql, [address, amount, tx_id, 'TRX', operator, Date.now()])
}


module.exports = {
    supplyTrxToAddr,
    supplyTrxToAddrByBatch,
    addReissueRecord,
}