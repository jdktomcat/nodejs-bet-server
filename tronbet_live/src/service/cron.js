const usermodel = require('../model/userinfo');
const redisUtil = require('../utils/redisUtil');
const user = require('./user');
const { app } = require('../configs/config');
const db = require('../utils/dbUtil');
const tronUtil = require('../utils/tronUtil');
const _ = require('lodash')._;
const axios = require('axios');

const RankInitTs = app.RankInitTs;

let timer = setInterval(async () => {
  let now = Math.floor(new Date().getTime() / 1000);

  //
  const dividendsDuration = 86400
  let startTs = (Math.floor(now / dividendsDuration)) * dividendsDuration * 1000
  let endTs = now * 1000
  if(startTs === endTs){
    console.log("time error,jump this time",new Date(now),startTs,endTs)
    console.log("跳过这次设置")
  }else{
    let profit = await usermodel.getRealTimeProfitAmount(now);
    let usdt = await usermodel.getRealTimeUSDProfitAmount(now);
  
    // 抽回部分底池 累计有效分红100次 每次抽10万 第500轮开始
    // profit = profit - 200000;
    // 抽回部分底池 累计有效分红100次 每次抽20万 第507轮开始
    // profit = profit - 400000;
  
  
    // 抽回部分底池 累计有效分红100次 每次抽10% 第507轮开始
    // profit = profit * 0.9;
    console.log("profit normal",new Date(now * 1000),startTs,endTs)
    console.log("this time trx profit is",profit)
    //130137.62050057614
    if(profit > 0 && profit <= 300000){
      profit = profit + 580000;
    }
    if(profit > 0 && profit > 300000){
      profit = profit * 0.7;
    }
    console.log("after time trx profit is",profit)
    // 盈利暂时放开 50% 
    // if( profit > 0 ){
    //   profit = profit * 0.5
    // }
    await redisUtil.hset('tronlive:realtime', 'profit', profit);
    await redisUtil.hset('tronlive:realtime', 'usdt', usdt);
  }

}, 70000);

let rankTimer = setInterval(async () => {
  let now = Math.floor(new Date().getTime() / 1000);
  let startTs = RankInitTs + Math.floor((now - RankInitTs) / 604800) * 604800;
  let endTs = startTs + 604800;
  let countDown = endTs - now;
  let amountRank = [];
  let profitRank = [];
  let bonus = await usermodel.getRankBonus(startTs);
  if (!bonus) {
    bonus = 0;
  } else {
    bonus = Number(bonus);
  }
  console.log(bonus);
  let profit = await redisUtil.hget('tronlive:realtime', 'profit');
  if (!profit || profit < 0) {
    profit = 0;
  }

  bonus += profit * 0.015;

  let localAmountRank = await usermodel.getAmountRankData(Math.floor((now - RankInitTs) / 604800) - 1);
  let localProfitRank = await usermodel.getProfitRankData(Math.floor((now - RankInitTs) / 604800) - 1);
  for (let index = 0; index < localAmountRank.length; index++) {
    let _name = await redisUtil.hget('live:user:' + localAmountRank[index].addr, 'name');
    if (!_name) {
      _name = localAmountRank[index].addr;
    }
    let data = await user.getRemoteUserInfo(localAmountRank[index].addr);
    let tmp = {
      rank: index + 1,
      name: _name,
      amount: Math.floor(localAmountRank[index].amount),
      lv: data.data.lv,
      img: data.data.img,
      wardAmount: Math.floor((bonus * 2 * app.rankRate[index]) / 300)
    };
    console.log(app.rankRate[index]);
    amountRank.push(tmp);
  }

  for (let index = 0; index < localProfitRank.length; index++) {
    let _name = await redisUtil.hget('live:user:' + localProfitRank[index].addr, 'name');
    if (!_name) {
      _name = localProfitRank[index].addr;
    }
    let data = await user.getRemoteUserInfo(localProfitRank[index].addr);
    let tmp = {
      rank: index + 1,
      name: _name,
      lv: data.data.lv,
      img: data.data.img,
      amount: Math.floor(localProfitRank[index].amount),
      wardAmount: Math.floor((bonus * app.rankRate[index]) / 300)
    };
    profitRank.push(tmp);
  }

  for (let index = amountRank.length; index < 20; index++) {
    let tmp = {
      rank: index + 1,
      name: '-',
      amount: '-',
      lv: '-',
      img: '10000',
      wardAmount: Math.floor((bonus * 2 * app.rankRate[index]) / 300)
    };
    amountRank.push(tmp);
  }

  for (let index = profitRank.length; index < 20; index++) {
    let tmp = {
      rank: index + 1,
      name: '-',
      amount: '-',
      lv: '-',
      img: '10000',
      wardAmount: Math.floor((bonus * app.rankRate[index]) / 300)
    };
    profitRank.push(tmp);
  }

  let result = {
    countDown,
    amountRank,
    profitRank
  };
  await redisUtil.hset('tronlive:rank:' + startTs, 'allRank', JSON.stringify(result));
}, 120000);

let rankRewardTimer = setInterval(async () => {
  let now = new Date().getTime();
  let interval = 604800;
  let startTs = RankInitTs + Math.floor((now / 1000 - RankInitTs) / interval - 1) * interval;
  let newRound = Math.floor((now / 1000 - RankInitTs) / interval);
  let lastRound = await usermodel.maxAmountRewardRound();
  console.log(lastRound, newRound);

  if (newRound - lastRound <= 1) {
    console.log('not in reward time, check it...');
    return console.log('try next time, ~~~~~~~~~~~~~~~~');
  }

  let bonus = await usermodel.getRankBonus(startTs);
  if (!bonus) {
    bonus = 0;
  } else {
    bonus = Number(bonus);
  }

  let localAmountRank = await usermodel.getAmountRankData(Math.floor((now / 1000 - RankInitTs) / interval - 2));
  let localProfitRank = await usermodel.getProfitRankData(Math.floor((now / 1000 - RankInitTs) / interval - 2));

  let conn = null;
  //快照数据放入日志
  try {
    conn = await db.getConnection();
    if (conn == null) {
      return console.error('Shit, get db connection failed!!!!!!!!!!!!!!');
    }
    conn.beginTransaction();
    for (let index = 0; index < localAmountRank.length; index++) {
      await usermodel.addAmountRankWardLog(
        newRound - 1,
        localAmountRank[index].addr,
        localAmountRank[index].amount,
        Math.floor(((bonus * 2 * app.rankRate[index]) / 300) * 1e6),
        now,
        conn
      );
    }
    for (let index = 0; index < localProfitRank.length; index++) {
      await usermodel.addPayoutRankWardLog(
        newRound - 1,
        localProfitRank[index].addr,
        localProfitRank[index].amount,
        Math.floor(((bonus * app.rankRate[index]) / 300) * 1e6),
        now,
        conn
      );
    }
    conn.commit();
  } catch (error) {
    console.log(error);
    if (conn) conn.rollback();
  } finally {
    if (conn) conn.release();
  }

  // 开始发奖
  for (let index = 0; index < localAmountRank.length; index++) {
    console.log(
      'result[index].addr, wardconf[index]=======>',
      localAmountRank[index].addr,
      Math.floor(((bonus * 2 * app.rankRate[index]) / 300) * 1e6)
    );
    try {
      let tx = await tronUtil.sendRankWard(
        1,
        newRound - 1,
        localAmountRank[index].addr,
        Math.floor(((bonus * 2 * app.rankRate[index]) / 300) * 1e6),
        index
      );
      console.log(tx);
      if (tx.result == true) {
        await usermodel.updateTxidToAmountRankWardLog(newRound - 1, localAmountRank[index].addr, tx.transaction.txID);
      }
    } catch (error) {
      console.log(error);
    }
  }

  for (let index = 0; index < localProfitRank.length; index++) {
    console.log(
      'result[index].addr, wardconf[index]=======>',
      localProfitRank[index].addr,
      Math.floor(((bonus * app.rankRate[index]) / 300) * 1e6)
    );
    try {
      let tx = await tronUtil.sendRankWard(
        2,
        newRound - 1,
        localProfitRank[index].addr,
        Math.floor(((bonus * app.rankRate[index]) / 300) * 1e6),
        index
      );
      console.log(tx);
      if (tx.result == true) {
        await usermodel.updateTxidToPayoutRankWardLog(newRound - 1, localProfitRank[index].addr, tx.transaction.txID);
      }
    } catch (error) {
      console.log(error);
    }
  }
  console.log('send daily rank success, lalalalalalala!!!');
}, 120000);

let LastDividendsTimer = setInterval(async () => {
  let intiTs = 1556164800;
  let now = Math.floor(new Date().getTime() / 1000);
  let startTs = intiTs + Math.floor((now - 1556164800) / 86400) * 86400;
  let res = await usermodel.getLastDividends(startTs);
  if (!_.isEmpty(res)) {
    await redisUtil.hset('tronlive:lastdivs', 'list', JSON.stringify(res));
  } else {
    await redisUtil.hset('tronlive:lastdivs', 'list', JSON.stringify([]));
  }
}, 60000);

let BonusTimer = setInterval(async () => {
  let bonusUrl = 'https://fugaso.com/api.php';
  let priceUrl = 'https://min-api.cryptocompare.com/data/price?fsym=TRX&tsyms=EUR';
  let bonus = await axios.get(bonusUrl);
  bonus = bonus.data;

  if (!bonus.jackpots) return;

  let price = await axios.get(priceUrl);
  price = price.data.EUR;
  if (!price) return;
  let gameIdRes = await redisUtil.hget('tronlive:gameIds', 'ids');
  let gameIds = [];
  if (gameIdRes) {
    gameIds = JSON.parse(gameIdRes);
  }
  let result = {};
  for (let one of gameIds) {
    result[one] = (bonus.jackpots.maxi / price).toFixed(2);
  }
  await redisUtil.hset('tronlive:bonus', 'jackpot', JSON.stringify(result));
}, 120000);
