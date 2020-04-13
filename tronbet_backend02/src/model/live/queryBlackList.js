const {raw} = require("./../utils/dbutils")

const queryBlackList = async (params) => {
    const {addr} = params
    let sql = "select * from tron_live.live_black_list where addr = ?"
    let res = await raw(sql, [addr])
    return res
}

const addBlackList = async (params) => {
    const {addr} = params
    //
    let sql0 = "select * from tron_live.live_black_list where addr = ?"
    let res0 = await raw(sql0, [addr])
    if(res0.length === 0){
        let sql = "insert into tron_live.live_black_list (addr,ts) values (?,?)"
        await raw(sql, [addr,Date.now()])
        return {
            message : '新增成功'
        }
    }else {
        return {
            message : '该地址已经存在'
        }
    }
}

module.exports = {
    queryBlackList,
    addBlackList
}