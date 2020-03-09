const {raw} = require("./../utils/dbutils")

const formatData = (data) => {
    data.forEach(e => {
        if (['TRX','USDT'].includes(e.currency)) {
            e.balance = e.balance / 1e6
        } else {
            e.balance = e.balance / 1e9
        }
    })
}

const getAccount = async function (email) {
    let sql = `
        select
            b.email,
            a.uid, 
            a.addr,
            a.balance,
            a.currency
            from live_balance a 
            left join live_account b
            on a.uid = b.uid
        where a.uid = b.uid
    `
    let params = []
    if(email !== ''){
        params = [email,email]
        sql += 'and b.email = ? or a.addr = ?'
    }else {
        return []
    }
    const t = await raw(sql, params)
    formatData(t)
    return t
}


const getAllBalance = async function (currency) {
    let sql = `select uid,addr, balance/? as balance,currency from live_balance where currency = ? order by balance desc`
    let params = []
    if (['TRX','USDT'].includes(currency)) {
        params.push(1000000)
    } else {
        params.push(1000000000)
    }
    params.push(currency)
    const t = await raw(sql, params)
    return t
}

class QueryUsers {

    static async getAccount(email) {
        const data = await getAccount(email)
        return data
    }

    static async getBalanceFile(params) {
        const data = await getAllBalance(params)
        const keys = Object.keys(data[0])
        let sbody = ''
        keys.forEach(e => {
            sbody += e + "\t"
        })
        sbody = sbody.trim()
        sbody += "\n"
        //
        data.forEach(e => {
            keys.forEach((k) => {
                let t = e[k] || 0
                sbody = sbody + t + '\t'
            })
            sbody = sbody.trim()
            sbody += '\n'
        })
        return sbody
    }
}

module.exports = QueryUsers