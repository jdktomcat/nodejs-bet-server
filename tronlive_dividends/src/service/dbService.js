const db = require('../utils/utilMysql');
const {app} = require('../configs/config')
const axios = require('axios')
const _ = require('lodash')._
const exec = db.exec;
const execTrans = db.execTrans;

async function getPreRoundInfo(_round, conn) {
    let sql = "select * from tron_live.live_div_info where round = ? limit 1;"
    let params = [_round];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    // console.log(ret[0]);
    return ret ? ret[0] : null;
}

async function getLastestRoundInfo(conn) {
    let sql = "select * from tron_live.live_div_info order by ver desc limit 1;"
    let params = [];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    // console.log(ret[0]);
    return ret ? ret[0] : null;
}

async function getProfitAmount(ts) {
    try {
        let {data} = await axios.get(app.liveProfitUrl)
        return data.data.amount
    } catch (error) {
        return 0
    }
}

async function addLiveFix() {
    const sql2 = `insert into tron_live.live_fix_log (amount,ts) values (?,?)`
    await exec(sql2, []);
}

async function getRealTimeProfitAmount(ts) {
    let startTs = (Math.floor(ts / app.duration)) * app.duration * 1000
    let endTs = ts * 1000
    let sql = "select sum(Amount) amount from tron_live.live_action_log where ts >= ? and ts < ? and action = ? and txStatus = 1"
    let betAmount = await exec(sql, [startTs, endTs, 'bet'])
    let resultAmount = await exec(sql, [startTs, endTs, 'result'])

    if (!_.isEmpty(betAmount)) {
        betAmount = betAmount[0].amount || 0
    } else {
        betAmount = 0
    }

    if (!_.isEmpty(resultAmount)) {
        resultAmount = resultAmount[0].amount || 0
    } else {
        resultAmount = 0
    }

    return betAmount - resultAmount
}

module.exports = {
    getPreRoundInfo,
    getLastestRoundInfo,
    getProfitAmount,
    getRealTimeProfitAmount,
    addLiveFix,
}