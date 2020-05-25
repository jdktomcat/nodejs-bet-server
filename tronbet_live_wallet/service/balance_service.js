const model = require("./../model/model")

const parseParams = async function (params) {
    console.log("request params: ", params)
    let k = {}
    Object.keys(params).forEach(e => {
        let v = params[e] || ''
        if (v !== '') {
            k[e] = v
        }
    })
    if (!['TRX','USDT'].includes(params.currency)) {
        throw new Error("currency error!")
    }
    const amount = params.amount || 0
    if (amount < 0) {
        throw new Error("amount error!")
    }
    // uid 还是addr
    const uid = params.uid || ''
    let addr = params.addr || ''
    if (uid === '' && addr === '') {
        throw new Error("uid and addr is empty!")
    }
    if (addr === '') {
        const balanceInfo = await model.getOne({
            where: {
                uid: params.uid,
                currency: params.currency,
            }
        })
        addr = balanceInfo.addr
    }
    const t = {
        addr: addr,
        currency: params.currency,
        amount: amount,
    }
    return t
}

class opBalance {

    static async query(params) {
        const condition = {
            where: params
        }
        const data = await model.getOne(condition)
        return data
    }

    static async addBalance(rawParams) {
        const params = await parseParams(rawParams)
        const msg = await model.addBalance(params)
        return msg
    }

    static async decreaseBalance(rawParams) {
        const params = await parseParams(rawParams)
        const msg = await model.decreaseBalance(params)
        return msg
    }

}

module.exports = opBalance