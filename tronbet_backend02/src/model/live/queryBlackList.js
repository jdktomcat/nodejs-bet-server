const {raw} = require("./../utils/dbutils")

const queryBlackList = async (params) => {
    const {addr} = params
    let sql = "select * from tron_live.live_black_list where addr = ?"
    let res = await raw(sql, [addr])
    return res
}

const addBlackList = async (params) => {
    const {addr} = params
    let sql = "insert into tron_live.live_black_list (addr,ts) values (?,?)"
    let res = await raw(sql, [addr,Date.now()])
    return res
}

module.exports = {
    queryBlackList,
    addBlackList
}