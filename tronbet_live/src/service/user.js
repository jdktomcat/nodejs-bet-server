const tronUtils = require('../utils/tronUtil');
const axios = require('axios');
const log4js = require('../configs/log4js_config');
const loggerDefault = log4js.getLogger('print');
const { app, tronConfig } = require('../configs/config');
const redisUtils = require('../utils/redisUtil');
const usermodel = require('../model/userinfo');
const dbUtil = require('../utils/dbUtil');
const TronWeb = require('tronweb');
const evnets = require('events');
const common = require('../utils/common');
const _ = require('lodash')._;
const userEvent = new evnets.EventEmitter();

const redisUserKeyPrefix = 'live:user:';
const usdtAddress = tronConfig.usdtAddress;

// tronlink 走 user, 账户走 account
async function login(ctx) {
  let params = ctx.request.body;
  let signature = params.sign;
  let addr = params.addr;

  if (!TronWeb.isAddress(addr) || signature == null) {
    return await common.sendMsgToClient(ctx, 1002, 'tron address error!!!');
  }

  //签名校验
  let signResult = await tronUtils.verifySignature(signature, addr);
  if (!signResult) {
    return await common.sendMsgToClient(ctx, 1002, 'sign verify failed!!!!!!!!!');
  }

  let _name = await redisUtils.hget(redisUserKeyPrefix + addr, 'name');
  if (!_name) {
    _name = await tronUtils.getAccountName(addr);
    if (_name == addr) {
      console.log('no nickName found');
    } else {
      await redisUtils.hset(redisUserKeyPrefix + addr, 'name', _name);
    }
  }

  let user = await usermodel.getUserByEmail(addr);
  if (_.isEmpty(user)) {
    user = await usermodel.userRegister(addr, _name == addr ? '' : _name);
  }

  if (user[0].bindStatus != 0) {
    return await common.sendMsgToClient(ctx, 1002, 'addr has bind to account,  please use mail to login');
  }
  //查询余额, 没有查询到
  let balance = await usermodel.getUserBalanceByUid(user[0].uid);
  let tmp = {};
  for (let one of balance) {
    tmp[one.currency] = one.balance;
  }
  let _balance = tmp.TRX || 0;
  let usdtBalance = tmp.USDT || 0;

  //登录日志记录
  await usermodel.userLoginLog(addr);

  let sessionId = common.getRandomSeed(40);

  try {
    await usermodel.updateSessionId(addr, sessionId);
  } catch (error) {
    sessionId = common.getRandomSeed(40);
    await usermodel.updateSessionId(addr, sessionId);
  }
  await redisUtils.hset(redisUserKeyPrefix + addr, 'sessionId', sessionId);

  let data = await getRemoteUserInfo(addr);

  await redisUtils.hset(redisUserKeyPrefix + addr, 'lv', data.data.lv);
  await redisUtils.hset(redisUserKeyPrefix + addr, 'img', data.data.img);

  // 设置默认的货币, 设置为TRX
  let currency = user[0].currency;

  let lanuchOptions = {
    sessionId: `${sessionId}_${currency}`,
    launchUrl: '',
    balance: _balance,
    usdtBalance,
    lv: data.data.lv,
    name: _name,
    img: data.data.img
  };
  return await common.sendMsgToClient(ctx, 0, '', lanuchOptions);
}

async function userBalance(ctx) {
  let params = ctx.request.body;
  let addr = params.addr;

  if (!TronWeb.isAddress(addr)) {
    return await common.sendMsgToClient(ctx, 1012, 'tron address error!!!');
  }

  let _name = await redisUtils.hget(redisUserKeyPrefix + addr, 'name');
  if (!_name) {
    _name = addr;
  }

  let user = await usermodel.getUserByEmail(addr);
  if (_.isEmpty(user)) {
    user = await usermodel.userRegister(addr, _name);
  }

  if (user[0].bindStatus != 0) {
    return await common.sendMsgToClient(ctx, 1010, 'address is locked!!!');
  }

  //查询余额, 没有查询到
  let balance = await usermodel.getUserBalanceByUid(user[0].uid);
  let tmp = {};
  for (let one of balance) {
    tmp[one.currency] = one.balance;
  }
  let _balance = tmp.TRX || 0;
  let usdtBalance = tmp.USDT || 0;

  let lv = await redisUtils.hget(redisUserKeyPrefix + addr, 'lv');
  let img = await redisUtils.hget(redisUserKeyPrefix + addr, 'img');
  if (!img) {
    let data = await getRemoteUserInfo(addr);
    await redisUtils.hset(redisUserKeyPrefix + addr, 'lv', data.data.lv);
    await redisUtils.hset(redisUserKeyPrefix + addr, 'img', data.data.img);
    lv = data.data.lv;
    img = data.data.img;
  }

  let data = {
    balance: _balance,
    usdtBalance,
    name: _name,
    lv: lv,
    img: img
  };
  return await common.sendMsgToClient(ctx, 0, '', data);
}

async function getRemoteUserInfo(addr) {
  let result = { data: {} };
  try {
    let { data } = await axios.get(app.userInfoUrl + addr);
    result = data;
  } catch (error) {
    console.log(error);
  }
  return result;
}

async function withdraw(ctx) {
  let params = ctx.request.body;

  let signature = params.sign;
  let addr = params.addr;
  let currency = params.currency;
  let amount = Math.floor(params.amount * 1e6);

  if (isNaN(amount) || amount < 1) {
    return await common.sendMsgToClient(ctx, 1010, 'amount error');
  }

  if (!currency) {
    return await common.sendMsgToClient(ctx, 1010, 'currency error');
  }

  //当奖池低于-5000000的时候， 停止提现
  let profitMin = app.profitMin;
  let profit = await redisUtils.hget('tronlive:realtime', 'profit');
  if (currency == 'USDT') {
    profitMin = app.profitMinUSDT;
    profit = await redisUtils.hget('tronlive:realtime', 'usdt');
  }
  
  if (!profit || profit < profitMin) {
    console.log("profit",profit, profitMin)
    return await common.sendMsgToClient(ctx, 1008, 'withdraw reached max amount');
  }

  if (!TronWeb.isAddress(addr) || signature == null) {
    return await common.sendMsgToClient(ctx, 1010, 'atron address error!!!');
  }

  if (app.blacklist[addr]) return await common.sendMsgToClient(ctx, 1008, 'withdraw reached max amount');

  //签名校验
  let signResult = await tronUtils.verifySignature(signature, addr);
  if (!signResult) {
    return await common.sendMsgToClient(ctx, 1010, 'sign verify failed!!!!!!!!!');
  }

  //个人每天提现次数限制
  let todayWithdrawTimes = await usermodel.findTodayWithdrawTimes(addr);
  if (todayWithdrawTimes >= app.withdrawMaxTimes) {
    return await common.sendMsgToClient(ctx, 1009, 'withdraw reached max times');
  }

  let withdrawMaxAmount = app.withdrawMaxAmount;
  let withdrawMaxAmountDaily = app.withdrawMaxAmountDaily;
  if (currency == 'USDT') {
    withdrawMaxAmount = app.withdrawMaxAmountUSDT;
    withdrawMaxAmountDaily = app.withdrawMaxAmountUSDTDaily;
  }

  // 每次提现最大额度
  if (amount > withdrawMaxAmount) {
    return await common.sendMsgToClient(ctx, 1008, 'withdraw reached max amount');
  }

  //限制提现金额每天玩家额度50w trx
  let todayAmount = await usermodel.findTodayWithdrawAmount(addr, currency);
  if (Number(todayAmount) + amount > withdrawMaxAmount) {
    return await common.sendMsgToClient(ctx, 1008, 'withdraw reached max amount');
  }

  let totalAmount = await usermodel.findTodayTotalWithdrawAmount(currency);

  //限制提现金额每天总额度250w trx
  if (Number(totalAmount) + amount >= withdrawMaxAmountDaily)
    return await common.sendMsgToClient(ctx, 1008, 'withdraw reached max amount');

  let wOrderId = common.getRandomSeed(64);

  let user = await usermodel.getUserByEmail(addr);
  if (_.isEmpty(user)) {
    return await common.sendMsgToClient(ctx, 1010, 'amount error');
  }

  if (user[0].bindStatus != 0) {
    return await common.sendMsgToClient(ctx, 1010, 'addr has bind to account,  please use mail to login');
  }

  //查询余额, 没有查询到
  let balance = await usermodel.getUserBalanceByCurrency(user[0].uid, currency);

  if (balance * 1e6 < amount) {
    return await common.sendMsgToClient(ctx, 1010, 'amount error');
  }

  let conn = null;
  try {
    // 1 扣除余额
    conn = await dbUtil.getConnection();
    conn.beginTransaction();
    await usermodel.userWithdrawPre(user[0].uid, addr, wOrderId, currency, addr, amount, conn);
    conn.commit();

    try {
      if (currency == 'TRX') {
        userEvent.emit('transferTrx', addr, amount, wOrderId);
      }
      if (currency == 'USDT') {
        userEvent.emit('transferTRC20', addr, amount, wOrderId, usdtAddress);
      }
    } catch (error) {
      loggerDefault.error(error);
    }
  } catch (error) {
    conn.rollback();
    loggerDefault.error(error);
    return await common.sendMsgToClient(ctx, 1010, 'amount not enough');
  } finally {
    if (conn) conn.release();
  }

  return await common.sendMsgToClient(ctx, 0, '', { balance: balance - amount / 1e6 });
}

userEvent.on('transferTrx', (addr, amount, wOrderId) => {
  // 2 尝试转trx给玩家
  let timer = setTimeout(async () => {
    clearTimeout(timer);
    try {
      let status = usermodel.getUserWithDrawStatus(wOrderId, addr);

      if (!_.isEmpty(status)) {
        console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
      }

      console.log('addr, amount, wOrderId----------------', addr, amount, wOrderId);
      let result = await tronUtils.tronExec(tronConfig.withdrawAddr, 'Withdraw(address,uint256,uint256)', 5e6, 0, [
        { type: 'address', value: addr },
        { type: 'uint256', value: amount },
        { type: 'uint256', value: '0x' + wOrderId }
      ]);
      console.log(result);
      if (result.result != true) {
        userEvent.emit('transferTrx', addr, amount, wOrderId);
      } else {
        let maxConfirmTimes = 5; //20 seconds
        userEvent.emit('trxConfirm', addr, amount, wOrderId, result.transaction.txID, maxConfirmTimes);
      }
    } catch (error) {
      loggerDefault.error(error);
      await common.sleep(2000); //延迟两秒在尝试
      userEvent.emit('transferTrx', addr, amount, wOrderId);
    }
  }, 300);
});

//trx 确认
userEvent.on('trxConfirm', (addr, amount, wOrderId, txId, tryTimes) => {
  loggerDefault.info('-----------trxConfirm----------');
  let timer = setTimeout(async () => {
    clearTimeout(timer);
    try {
      if (!tryTimes || tryTimes <= 0) {
        loggerDefault.error('tx confirmed max times', { addr, amount, wOrderId, txId });
        userEvent.emit('transferTrx', addr, amount, wOrderId);
        return;
      }
      let confirmResult = await tronUtils.isTxSuccesssed(txId);
      if (!confirmResult) {
        loggerDefault.info('confirm txid', { addr, amount, wOrderId, txId }, tryTimes - 1);
        userEvent.emit('trxConfirm', addr, amount, wOrderId, txId, tryTimes - 1);
        return;
      }
      let res1 = await usermodel.finishedWithdrawLog(addr, txId, wOrderId);
    } catch (error) {
      loggerDefault.error(error);
    }
  }, 10000);
});

userEvent.on('transferTRC20', (addr, amount, wOrderId, tokenAddr) => {
  // 2 尝试转TRC20给玩家
  let timer = setTimeout(async () => {
    clearTimeout(timer);
    try {
      let status = usermodel.getUserWithDrawStatus(wOrderId, addr);

      if (!_.isEmpty(status)) {
        console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
      }

      console.log('addr, amount, wOrderId, tokenAddr----------------', addr, amount, wOrderId, tokenAddr);
      let result = await tronUtils.tronExec(
        tronConfig.livePayAddr,
        'WithdrawTrc20(address,address,uint256,uint256)',
        5e6,
        0,
        [
          { type: 'address', value: addr },
          { type: 'address', value: tokenAddr },
          { type: 'uint256', value: amount },
          { type: 'uint256', value: '0x' + wOrderId }
        ]
      );
      console.log(result);
      if (result.result != true) {
        userEvent.emit('transferTRC20', addr, amount, wOrderId, tokenAddr);
      } else {
        let maxConfirmTimes = 5; //20 seconds
        userEvent.emit('TRC20Confirm', addr, amount, wOrderId, tokenAddr, result.transaction.txID, maxConfirmTimes);
      }
    } catch (error) {
      loggerDefault.error(error);
      await common.sleep(2000); //延迟两秒在尝试
      userEvent.emit('transferTRC20', addr, amount, wOrderId, tokenAddr);
    }
  }, 300);
});

//trc20 确认
userEvent.on('TRC20Confirm', (addr, amount, wOrderId, tokenAddr, txId, tryTimes) => {
  loggerDefault.info('-----------TRC20Confirm----------');
  let timer = setTimeout(async () => {
    clearTimeout(timer);
    try {
      if (!tryTimes || tryTimes <= 0) {
        loggerDefault.error('tx20 confirmed max times', { addr, amount, wOrderId, tokenAddr, txId });
        userEvent.emit('transferTRC20', addr, amount, wOrderId, tokenAddr);
        return;
      }
      let confirmResult = await tronUtils.isTxSuccesssed(txId);
      if (!confirmResult) {
        loggerDefault.info('TRC20 confirm txid', { addr, amount, wOrderId, tokenAddr, txId }, tryTimes - 1);
        userEvent.emit('TRC20Confirm', addr, amount, wOrderId, tokenAddr, txId, tryTimes - 1);
        return;
      }
      await usermodel.finishedWithdrawLog(addr, txId, wOrderId);
    } catch (error) {
      loggerDefault.error(error);
    }
  }, 10000);
});

async function games(ctx) {
  let data = await redisUtils.hget('tronlive:gamelist', 'games');
  try {
    data = JSON.parse(data);
  } catch (error) {
    data = [];
  }
  return await common.sendMsgToClient(ctx, 0, '', data);
}

async function verifySession(ctx) {
  let params = ctx.request.body;
  let sessionId = params.session_id;
  if (sessionId == null) {
    return await common.sendMsgToClient(ctx, 1012, 'tron address error!!');
  }

  let tmp = sessionId.split('_');
  if (tmp.length < 2) {
    return await common.sendMsgToClient(ctx, 1012, 'tron address error!!');
  }

  let res = await usermodel.getAccountBySessionId(tmp[0]);
  if (_.isEmpty(res)) {
    return await common.sendMsgToClient(ctx, 1012, 'tron address error!!');
  }
  if (res[0].currency != tmp[1]) {
    return await common.sendMsgToClient(ctx, 1012, 'tron address error!!');
  }

  return await common.sendMsgToClient(ctx, 0, 'success');
}

async function realTimeProfit(ctx) {
  let profit = await redisUtils.hget('tronlive:realtime', 'profit');
  let usdt = await redisUtils.hget('tronlive:realtime', 'usdt');
  if (!profit) {
    profit = 0;
  }
  if (!usdt) {
    usdt = 0;
  }

  let result = {};
  result = { amount: Math.floor(profit * 0.97) };
  result.trx = { amount: Math.floor(profit * 0.97) };
  result.usdt = { amount: Math.floor(usdt * 0.97) };

  return await common.sendMsgToClient(ctx, 0, '', result);
}

async function getAddLiveTrxToAntePool(ctx) {
  let data = null;
  let res = await redisUtils.hget('tronlive:lastdivs', 'list');
  if (!res) {
    data = [];
  } else {
    data = JSON.parse(res);
  }
  return await common.sendMsgToClient(ctx, 0, '', data);
}

async function getJackPotDetail(ctx) {
  let data = null;
  let res = await redisUtils.hget('tronlive:bonus', 'jackpot');
  if (!res) {
    data = [];
  } else {
    data = JSON.parse(res);
  }
  return await common.sendMsgToClient(ctx, 0, '', data);
}

async function getKey(ctx) {
  let params = ctx.request.body;
  let signature = params.sign;
  let currency = params.currency;
  let addr = params.addr;

  if (!TronWeb.isAddress(addr) || signature == null) {
    return await common.sendMsgToClient(ctx, 1002, 'tron address error!!!');
  }

  if (!currency) {
    return await common.sendMsgToClient(ctx, 1010, 'currency error');
  }

  //签名校验
  let signResult = await tronUtils.verifySignature(signature, addr);
  if (!signResult) {
    return await common.sendMsgToClient(ctx, 1002, 'sign verify failed!!!!!!!!!');
  }

  let _name = await redisUtils.hget(redisUserKeyPrefix + addr, 'name');
  if (!_name) {
    _name = await tronUtils.getAccountName(addr);
    if (_name == addr) {
      console.log('no nickName found');
    } else {
      await redisUtils.hset(redisUserKeyPrefix + addr, 'name', _name);
    }
  }

  //查询余额, 没有查询到
  let user = await usermodel.getUserByEmail(addr);
  if (_.isEmpty(user)) {
    user = await usermodel.userRegister(addr, _name == addr ? '' : _name);
  }
  if (user[0].bindStatus != 0) {
    return await common.sendMsgToClient(ctx, 1002, 'addr has bind to account,  please use mail to login');
  }

  let balance = await usermodel.getUserBalanceByUid(user[0].uid);
  let tmp = {};
  for (let one of balance) {
    tmp[one.currency] = one.balance;
  }
  let _balance = tmp.TRX || 0;
  let usdtBalance = tmp.USDT || 0;

  //登录日志记录
  await usermodel.userLoginLog(addr);

  let key = common.getRandomSeed(48);

  try {
    await usermodel.updateUserKey(addr, key);
  } catch (error) {
    key = common.getRandomSeed(48);
    await usermodel.updateUserKey(addr, key);
  }
  await redisUtils.hset(redisUserKeyPrefix + addr, 'userKey', key);

  let data = await getRemoteUserInfo(addr);

  await redisUtils.hset(redisUserKeyPrefix + addr, 'lv', data.data.lv);
  await redisUtils.hset(redisUserKeyPrefix + addr, 'img', data.data.img);

  await usermodel.setCurrency(currency, user[0].uid);

  let lanuchOptions = {
    userKey: key,
    balance: _balance,
    usdtBalance,
    lv: data.data.lv,
    name: _name,
    img: data.data.img
  };
  return await common.sendMsgToClient(ctx, 0, '', lanuchOptions);
}

module.exports = {
  login,
  withdraw,
  userBalance,
  games,
  verifySession,
  realTimeProfit,
  getRemoteUserInfo,
  getAddLiveTrxToAntePool,
  getJackPotDetail,
  getKey
};
