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


const addOldUser = async function (username,passwd,role) {
    let t = `insert into tron_bet_admin.user(username,passwd,role) values (?,?,?)`
    const rs = await raw(t,[username,passwd,role])
    return rs
}

const removeOldUser = async function (name) {
    let t = `delete from tron_bet_admin.user where username=?`
    const rs = await raw(t,[name])
    return rs
}

const removeNewUser = async function (name) {
    let t = `delete from tron_bet_admin.backend_user where username=?`
    const rs = await raw(t,[name])
    return rs
}


module.exports = {
    addUser,
    queryUser,
    addOldUser,
    removeOldUser,
    removeNewUser,
}