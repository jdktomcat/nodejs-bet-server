const db = require('../utils/utilMysql');
const {app} = require('../configs/config')
const axios = require('axios')
const _ = require('lodash')._
const exec = db.exec;
const execTrans = db.execTrans;

async function getPreRoundInfo(_round, conn) {
    let sql = "select * from rake_div_info where round = ? limit 1;"
    let params = [_round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    // console.log(ret[0]);
    return ret ? ret[0] : null;
}

async function getLastestRoundInfo(conn) {
    let sql = "select * from rake_div_info order by ver desc limit 1;"
    let params = [];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    // console.log(ret[0]);
    return ret ? ret[0] : null;
}

async function getProfitAmount(ts) {
    try {
        let {data} = await axios.get(app.pokerProfitUrl)
        return data.data.amount
    } catch (error) {
        return 0
    }
}

module.exports = {
    getPreRoundInfo,
    getLastestRoundInfo,
    getProfitAmount,
}