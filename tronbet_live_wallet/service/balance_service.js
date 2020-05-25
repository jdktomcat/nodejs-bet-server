const model = require("./../model/model")

const parseParams = function (params) {
    console.log("request params: ", params)
    let k = {}
    Object.keys(params).forEach(e => {
        let v = params[e] || ''
        if (v !== '') {
            k[e] = v
        }
    })
    const amount = params.amount || 0
    if (amount <= 0) {
        throw new Error("amount error!")
    }
    return k
}

class opBalance {

    static async query(params) {
        const condition = {
            where: {
                addr: params.addr,
                currency: params.currency,
            }
        }
        const data = await model.getOne(condition)
        return data
    }

    static async addBalance(rawParams) {
        const params = parseParams(rawParams)
        const amount = params.amount || 0
        const condition = {
            addr: params.addr,
            amount: amount,
            currency: params.currency,
        }
        const msg = await model.addBalance(condition)
        return msg
    }

    static async decreaseBalance(rawParams) {
        const params = parseParams(rawParams)
        const amount = params.amount || 0
        const condition = {
            addr: params.addr,
            amount: amount,
            currency: params.currency,
        }
        const msg = await model.decreaseBalance(condition)
        return msg
    }

}

module.exports = opBalance