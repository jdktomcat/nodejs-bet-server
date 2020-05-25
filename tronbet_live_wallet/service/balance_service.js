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
    if (amount < 0) {
        throw new Error("amount error!")
    }
    // uid 还是addr
    const uid = params.uid || ''
    const addr = params.addr || ''
    console.log("uid is ",uid)
    console.log("addr is ",addr)
    console.log("uid === '' && addr === '' ",uid === '' && addr === '')
    if (uid === '' && addr === '') {
        // request params:  { uid: 33749, currency: 'TRX', amount: 500000 }
        throw new Error("uid and addr is empty!")
    }
    //
    if (uid === '') {
        // 使用addr
        const t = {
            addr: params.addr,
            currency: params.currency,
            amount: amount,
        }
        return t
    } else if (addr === '') {
        // 使用uid
        const t = {
            uid: params.uid,
            currency: params.currency,
            amount: amount,
        }
        return t
    }
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
        const params = parseParams(rawParams)
        const msg = await model.addBalance(params)
        return msg
    }

    static async decreaseBalance(rawParams) {
        const params = parseParams(rawParams)
        const msg = await model.decreaseBalance(params)
        return msg
    }

}

module.exports = opBalance