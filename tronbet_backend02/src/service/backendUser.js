const {raw} = require("../model/utils/dbutils")

const addUser = async function (name,pwd,role) {
    let t = `insert into tron_bet_admin.backend_user(username,password,role) values (?,?,?)`
    const rs = await raw(t,[name,pwd,role])
    return rs
}

const queryUser = async function (name) {
    let t = `select username,password from tron_bet_admin.backend_user where username=?`
    const rs = await raw(t,[name])
    return rs
}

module.exports = {
    addUser,
    queryUser,
}