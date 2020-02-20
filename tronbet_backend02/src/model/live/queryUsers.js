const {raw} = require("./../utils/dbutils")

const getAccount = async function (email) {
    let sql = `
        select
            b.email, 
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
        params.push(email)
        sql += 'and b.email = ?'
    }else {
        return []
    }
    const t = await raw(sql, params)
    return t
}


class QueryUsers {

    static async getAccount(email) {
        const data = await getAccount(email)
        return data
    }
}

module.exports = QueryUsers