const userinfo = require('../model/userinfo');
const db = require('../utils/dbUtil');
const log4js = require('../configs/log4js_config');
const logger = log4js.getLogger('print');
const _ = require('lodash')._;
const { tranStatus } = require('../configs/config');
const common = require('../utils/common');
const { errorCode } = require('../utils/errCode');
const redisUtils = require('../utils/redisUtil');
const config = require('../configs/config');

let _GAME_TYPE = "live";
let ACTIVITY_START_TS = config.event.ACTIVITY_START_TS || 0;
let ACTIVITY_END_TS = config.event.ACTIVITY_END_TS || 0;
function sendGameMsg(addr, order_id, trxAmount, currency) {
    let _now = _.now();
    if (_now < ACTIVITY_START_TS || _now > ACTIVITY_END_TS) return;

    if(currency !== 'TRX' && currency !== 'USDT'){
        return;
    }

    if(currency === 'TRX' && trxAmount < 100){
        return [trxAmount, 0, false];
    }

    if(currency === 'USDT' && trxAmount < 10){
        return [trxAmount, 0, false];
    }

    //箱子爆率=投注额^0.527163*0.3%
    //箱子爆率=投注额^0.495424251*0.3%
    let persent = Math.floor(Math.pow(trxAmount, 0.495424251) * 30);
    if (persent > 9000) persent = 9000;
    let _r = _.random(0, 10000);
    let hit = false;
    if (_r <= persent) {
        hit = true;
    }
    if (hit === true) {
        let msg = { addr: addr, order_id: order_id, box_num: 1, game_type: _GAME_TYPE };
        // loggerDefault.info("sendGameMsg", msg);
        redisUtils.redis.publish("game_message", JSON.stringify(msg));
        // appEvent.emit('activity_info', msg); //**  */
    }
    return [trxAmount, persent, hit];
}

function sendSuccessMessage2Client(ctx, httpcode, data) {
  if (httpcode != 403) httpcode = 200;
  if (!data) data = {};
  let result = {
    ...data
  };
  ctx.status = httpcode; //http状态吗， 正常情况下是200， 异常情况返回403
  ctx.body = result;
}

function sendErrorMessage2Client(ctx, httpcode, errno) {
  let result = {
    code: errno || 0,
    message: errorCode[errno] || ''
  };
  ctx.status = httpcode; //http状态吗， 正常情况下是200， 异常情况返回403
  ctx.body = result;
}

function toCpAmount(currency, amount) {
  if(currency == 'BNB') {
      return amount / 1000
  } else {
      return amount 
  }
}

function fromCpAmount(currency, amount) {
  if(currency == 'BNB') {
      return amount * 1000
  } else {
      return amount 
  }
}

async function ping(ctx) {
  let now = Math.floor(new Date().getTime() / 1000);
  return sendErrorMessage2Client(ctx, 200, 0, now);
}

async function identify(ctx) {
  let params = ctx.request.body || ctx.request.query;
  let querys = ctx.request.query;

  let jwtToken = params.payload;

  let key = querys.key;
  let ip = querys.ip;
  let uacode = querys.uacode;

  let isCashout = await redisUtils.hget('sports', 'allCashoutSeting');
  if (isCashout && isCashout == '1') {
    isCashout = true;
  } else {
    isCashout = false;
  }

  try {
    let checkKey = common.verifyUserToken(jwtToken);
    if (!checkKey) return sendErrorMessage2Client(ctx, 403, 1001);

    let user = await userinfo.getUserByKey(key);
    if (_.isEmpty(user)) return sendErrorMessage2Client(ctx, 403, 1001);
    let currency = user[0].currency;
    let balance = await userinfo.getUserBalanceByCurrency(user[0].uid, currency);

    let sessionId = common.getRandomSeed(64);
    if (user[0].sportsSession == null || user[0].sportsSession.length < 40) {
      await userinfo.updateSportsSessionByKey(sessionId, key);
    } else {
      sessionId = user[0].sportsSession;
    }

    if (!isCashout) {
      let tmp1 = await redisUtils.hget('sportsCashoutSeting', user[0].email);
      if (tmp1 && tmp1 == '1') {
        isCashout = true;
      }
    }

    let result = {
      user_id: user[0].email,
      username: user[0].nickName || user[0].email,
      lang: 'EN',
      currency: currency,
      balance: toCpAmount(currency, Math.floor(balance * 1e2)),
      feature_flags: {
        is_cashout_available: true
      },
      session_id: sessionId
    };
    return sendSuccessMessage2Client(ctx, 200, result);
  } catch (error) {
    console.log(error);
    return sendErrorMessage2Client(ctx, 403, 1001);
  }
}

async function getAddition(type = "all") {
  try {
      let multi = await redisUtils.hget('tronlive:sport:addition', "" + type)
      console.log('tronlive:sport:addition', multi)
      if(!multi) return 1
      return Number(multi)
  } catch (error) {
      return 1
  }
}

async function betMake(ctx) {
  //@TODO
  let params = ctx.request.body || ctx.request.query;
  console.log(`${new Date().toJSON()}---> betMake: \n`,params)
  let jwtToken = params.payload;
  try {
    let checkKey = common.verifyUserToken(jwtToken);
    if (!checkKey) return sendErrorMessage2Client(ctx, 403, 1001);

    let datas = checkKey.payload;
    console.log("betMake data is ",datas)
    let currency = datas.currency;
    let addr = datas.player_id;
    let amount = datas.amount / 100;

    let sessionId = datas.session_id;

    if (amount <= 0) return sendErrorMessage2Client(ctx, 400, 2001); // 下注必须是正数金额

    let user = await userinfo.getAccountBySportsSessionId(sessionId);
    if (_.isEmpty(user)) return sendErrorMessage2Client(ctx, 400, 2004);
    let userBalance = await userinfo.getUserBalanceByCurrency(user[0].uid, currency);

    if (userBalance < fromCpAmount(currency, amount)) return sendErrorMessage2Client(ctx, 400, 2001); //余额不足

    let price = await userinfo.getTRXPrice(currency);
    let trxAmount = datas.amount * price * 1e4;

    console.log("datas.transaction : ",JSON.stringify(datas))

    let transactionParams = {
      addr: datas.player_id,
      transactionId: datas.transaction.id,
      betslipId: datas.transaction.betslip_id,
      ts: Math.floor(datas.transaction.timestamp * 1000),
      status: 0,
      amount: fromCpAmount(datas.currency, datas.amount * 1e4),
      crossRateEuro: datas.transaction.cross_rate_euro,
      action: datas.transaction.operation,
      currency: datas.currency,
      adAmount: 0
    };

    let odds = 1;

    let betLogParams = [];
    for (let one of datas.betslip.bets) {
      let cpName = one.competitor_name.join('::') || '';
      if (cpName.length > 64) {
        cpName = cpName.slice(0, 60);
      }
      let tmp = {
        addr: datas.player_id,
        transactionId: datas.transaction.id,
        betslipId: datas.transaction.betslip_id,
        currency: datas.currency,
        types: datas.betslip.type,
        betK: datas.betslip.k,
        sumAmount: fromCpAmount(datas.currency, datas.amount * 1e4),
        betId: one.id,
        sportId: one.sport_id,
        eventId: one.event_id,
        tournamentId: one.tournament_id,
        categoryId: one.category_id,
        live: one.live,
        competitorName: cpName,
        outcomeName: one.outcome_name,
        scheduled: one.scheduled,
        odds: one.odds
      };
      odds = one.odds;
      betLogParams.push(tmp);
    }
    console.log(datas.player_id, ' make bet@', datas.transaction.id, 'amount ===>', Math.floor(datas.amount / 100));
    transactionParams.uid = user[0].uid;

    if (odds < 2 && odds > 1) {
      transactionParams.adAmount = Math.floor(trxAmount * Math.pow(odds - 1, 1.00001));
    } else {
      transactionParams.adAmount = trxAmount;
    }

    // sport 开挖矿倍率活动 
    let _now = _.now();
    if (_now > config.addition.START_TS && _now < config.addition.END_TS){
      // let multi = await getAddition("all")
      console.log("adAmount", config.addition.RATE, transactionParams.adAmount);
      transactionParams.adAmount = transactionParams.adAmount * config.addition.RATE
      console.log("adAmount", config.addition.RATE, transactionParams.adAmount);    
    }

    let conn = null;

    try {
      conn = await db.getConnection();
      if (conn == null) {
        return await sendErrorMessage2Client(ctx, 403, 204);
      }
      conn.beginTransaction();
      await userinfo.userBet(transactionParams, betLogParams, conn);

      if(odds >= 2){
        // console.log("amount", transactionParams.amount)
        sendGameMsg(transactionParams.addr, new Date().getTime(), transactionParams.amount / 1000000, transactionParams.currency);
      }

      conn.commit();
    } catch (error) {
      console.log('======================rollback=======================');
      logger.info(error);
      if (conn) conn.rollback();
      if (conn) conn.release();
      if (error.code === 'ER_DUP_ENTRY') {
        let newBalance = await userinfo.getUserBalanceByCurrency(user[0].uid, currency);

        let result = {
          id: datas.transaction.id,
          ext_transaction_id: datas.transaction.id,
          parent_transaction_id: null,
          user_id: addr,
          operation: 'bet',
          amount: datas.amount,
          currency: datas.currency,
          balance: toCpAmount(datas.currency, Math.floor(newBalance * 1e2))
        };
        return sendSuccessMessage2Client(ctx, 200, result);
      }
      return await sendErrorMessage2Client(ctx, 400, 2004);
    } finally {
      if (conn) conn.release();
    }

    let newBalance = await userinfo.getUserBalanceByCurrency(user[0].uid, currency);

    let result = {
      id: datas.transaction.id,
      ext_transaction_id: datas.transaction.id,
      parent_transaction_id: null,
      user_id: addr,
      operation: 'bet',
      amount: datas.amount,
      currency: datas.currency,
      balance: toCpAmount(datas.currency, Math.floor(newBalance * 1e2))
    };
    return sendSuccessMessage2Client(ctx, 200, result);
  } catch (error) {
    console.log(error);
    return sendErrorMessage2Client(ctx, 403, 1001);
  }
}

async function betCommit(ctx) {
  let params = ctx.request.body;
  console.log(`${new Date().toJSON()}---> betCommit: \n`,params)
  let jwtToken = params.payload;
  try {
    let checkKey = common.verifyUserToken(jwtToken);
    console.log("betCommit checkKey is ",checkKey);
    if (!checkKey) return sendErrorMessage2Client(ctx, 403, 1001);
  } catch (error) {
    return sendErrorMessage2Client(ctx, 403, 1001);
  }
  return sendSuccessMessage2Client(ctx, 200);
  //@TODO
}

async function betSettlement(ctx) {
  let params = ctx.request.body;
  console.log(`${new Date().toJSON()}---> betSettlement: \n`,params)
  let jwtToken = params.payload;
  try {
    let checkKey = common.verifyUserToken(jwtToken);
    if (!checkKey) return sendErrorMessage2Client(ctx, 403, 1001);
    let datas = checkKey.payload;
    console.log("betSettlement datas is: ",datas)
    await userinfo.userBetSettle(datas.bet_transaction_id, datas.status);
    return sendSuccessMessage2Client(ctx, 200);
  } catch (error) {
    console.log(error);
    return sendErrorMessage2Client(ctx, 200);
  }
  //@TODO
}

async function betRefund(ctx) {
  let params = ctx.request.body;
  console.log(`${new Date().toJSON()}---> betRefund: \n`,params)
  let jwtToken = params.payload;
  try {
    let checkKey = common.verifyUserToken(jwtToken);
    if (!checkKey) return sendErrorMessage2Client(ctx, 403, 1001);

    let datas = checkKey.payload;
    console.log("betRefund datas is: ",datas)
    let transactionParams = {
      addr: datas.transaction.ext_player_id,
      transactionId: datas.transaction.id,
      betTransactionId: datas.bet_transaction_id,
      betslipId: datas.transaction.betslip_id,
      ts: Math.floor(datas.transaction.timestamp * 1000),
      status: 10,
      amount: fromCpAmount(datas.transaction.currency, datas.transaction.amount * 1e4),
      action: datas.transaction.operation,
      currency: datas.transaction.currency
    };

    console.log(
      transactionParams.addr,
      'bet refund@',
      transactionParams.transactionId,
      'betId ===>',
      transactionParams.betTransactionId
    );
    let transaction = await userinfo.getTransactionById(datas.bet_transaction_id);
    if (
      _.isEmpty(transaction) ||
      transaction[0].addr != transactionParams.addr ||
      transaction[0].amount != transactionParams.amount
    ) {
      return sendErrorMessage2Client(ctx, 400, 2003);
    }

    if (transaction[0].status == tranStatus.refund || transaction[0].status == tranStatus.rollback) {
      return sendErrorMessage2Client(ctx, 400, 2004);
    }
    let user = await userinfo.getAccountByEmail(transactionParams.addr);
    if (_.isEmpty(user)) return sendErrorMessage2Client(ctx, 400, 2004);
    transactionParams.uid = user[0].uid;

    let conn = null;
    try {
      conn = await db.getConnection();
      if (conn == null) {
        return await sendErrorMessage2Client(ctx, 403, 204);
      }
      conn.beginTransaction();
      await userinfo.userRefund(transactionParams, conn);
      conn.commit();
    } catch (error) {
      console.log('======================rollback=======================');
      logger.info(error);
      if (conn) conn.rollback();
      if (conn) conn.release();
      return await sendErrorMessage2Client(ctx, 400, 2004);
    } finally {
      if (conn) conn.release();
    }

    let newBalance = await userinfo.getUserBalanceByCurrency(user[0].uid, transactionParams.currency);
    let result = {
      id: datas.transaction.id,
      ext_transaction_id: datas.transaction.id,
      parent_transaction_id: datas.bet_transaction_id,
      user_id: transactionParams.addr,
      operation: 'refund',
      amount: transactionParams.amount,
      currency: transactionParams.currency,
      balance: toCpAmount(transactionParams.currency, Math.floor(newBalance * 1e2))
    };
    return sendSuccessMessage2Client(ctx, 200, result);
  } catch (error) {
    console.log(error);
    return sendErrorMessage2Client(ctx, 403, 1001);
  }
}

async function betWin(ctx) {
  let params = ctx.request.body;
  console.log(`${new Date().toJSON()}---> betWin: \n`,params)
  let jwtToken = params.payload;
  try {
    let checkKey = common.verifyUserToken(jwtToken);
    if (!checkKey) return sendErrorMessage2Client(ctx, 403, 1001);

    let datas = checkKey.payload;
    console.log("betWin datas is: ",datas)
    let transactionParams = {
      addr: datas.transaction.ext_player_id,
      transactionId: datas.transaction.id,
      betTransactionId: datas.bet_transaction_id,
      betslipId: datas.transaction.betslip_id,
      ts: Math.floor(datas.transaction.timestamp * 1000),
      status: 50,
      amount: fromCpAmount(datas.transaction.currency, datas.amount * 1e4),
      action: datas.transaction.operation,
      currency: datas.transaction.currency
    };

    console.log(
      transactionParams.addr,
      'bet win@',
      transactionParams.transactionId,
      'betId ===>',
      transactionParams.betTransactionId,
      'win amount ===>',
      Math.floor(transactionParams.amount / 1e6)
    );
    let transaction = await userinfo.getTransactionById(datas.bet_transaction_id);
    if (_.isEmpty(transaction) || transaction[0].addr != transactionParams.addr) {
      return sendErrorMessage2Client(ctx, 400, 2003);
    }
    let user = await userinfo.getAccountByEmail(transactionParams.addr);
    if (_.isEmpty(user)) return sendErrorMessage2Client(ctx, 400, 2004);
    transactionParams.uid = user[0].uid;

    // 状态在取消, 输赢的状态下, 是不能再次调用win的奖励的
    if (transaction[0].status == tranStatus.win) {
      let newBalance = await userinfo.getUserBalance(transactionParams.addr, transactionParams.currency);
      let result = {
        id: datas.transaction.id,
        ext_transaction_id: datas.transaction.id,
        parent_transaction_id: datas.bet_transaction_id,
        user_id: transactionParams.addr,
        operation: 'win',
        amount: transactionParams.amount,
        currency: transactionParams.currency,
        balance: toCpAmount(transactionParams.currency, Math.floor(newBalance * 1e2))
      };
      return sendSuccessMessage2Client(ctx, 200, result);
    }

    if (transaction[0].status == tranStatus.cancel || transaction[0].status == tranStatus.lost) {
      return sendErrorMessage2Client(ctx, 400, 2004);
    }

    let conn = null;
    try {
      conn = await db.getConnection();
      if (conn == null) {
        return await sendErrorMessage2Client(ctx, 403, 204);
      }
      conn.beginTransaction();
      await userinfo.userWin(transactionParams, conn);
      conn.commit();
    } catch (error) {
      console.log('======================rollback=======================');
      logger.info(error);
      if (conn) conn.rollback();
      if (conn) conn.release();
      if (error.code === 'ER_DUP_ENTRY') {
        let newBalance = await userinfo.getUserBalanceByCurrency(user[0].uid, transactionParams.currency);
        let result = {
          id: datas.transaction.id,
          ext_transaction_id: datas.transaction.id,
          parent_transaction_id: datas.bet_transaction_id,
          user_id: transactionParams.addr,
          operation: 'win',
          amount: transactionParams.amount,
          currency: transactionParams.currency,
          balance: toCpAmount(transactionParams.currency, Math.floor(newBalance * 1e2))
        };
        return sendSuccessMessage2Client(ctx, 200, result);
      }
      return await sendErrorMessage2Client(ctx, 400, 2004);
    } finally {
      if (conn) conn.release();
    }

    let newBalance = await userinfo.getUserBalanceByCurrency(user[0].uid, transactionParams.currency);
    let result = {
      id: datas.transaction.id,
      ext_transaction_id: datas.transaction.id,
      parent_transaction_id: datas.bet_transaction_id,
      user_id: transactionParams.addr,
      operation: 'win',
      amount: transactionParams.amount,
      currency: transactionParams.currency,
      balance: toCpAmount(transactionParams.currency, Math.floor(newBalance * 1e2))
    };
    return sendSuccessMessage2Client(ctx, 200, result);
  } catch (error) {
    console.log(error);
    return sendErrorMessage2Client(ctx, 403, 1001);
  }
  //@TODO
}

async function betCancel(ctx) {
  let params = ctx.request.body;
  console.log(`${new Date().toJSON()}---> betCancel: \n`,params)
  let jwtToken = params.payload;
  try {
    let checkKey = common.verifyUserToken(jwtToken);
    if (!checkKey) return sendErrorMessage2Client(ctx, 403, 1001);
    let datas = checkKey.payload;
    console.log("betCancel datas is: ",datas)
    let transactionParams = {
      addr: datas.transaction.ext_player_id,
      transactionId: datas.transaction.id,
      betTransactionId: datas.bet_transaction_id,
      betslipId: datas.transaction.betslip_id,
      ts: Math.floor(datas.transaction.timestamp * 1000),
      reason: datas.reason,
      status: 20,
      amount: fromCpAmount(datas.transaction.currency, datas.transaction.amount * 1e4),
      action: datas.transaction.operation,
      currency: datas.transaction.currency
    };

    console.log(
      transactionParams.addr,
      'bet cancel@',
      transactionParams.transactionId,
      'betId ===>',
      transactionParams.betTransactionId
    );
    let transaction = await userinfo.getTransactionById(datas.bet_transaction_id);
    if (_.isEmpty(transaction) || transaction[0].addr != transactionParams.addr) {
      return sendErrorMessage2Client(ctx, 400, 2003);
    }

    if (transaction[0].status == tranStatus.cancel) {
      return sendErrorMessage2Client(ctx, 400, 2004);
    }

    let user = await userinfo.getAccountByEmail(transactionParams.addr);
    if (_.isEmpty(user)) return sendErrorMessage2Client(ctx, 400, 2004);
    transactionParams.uid = user[0].uid;

    let conn = null;
    try {
      conn = await db.getConnection();
      if (conn == null) {
        return await sendErrorMessage2Client(ctx, 403, 204);
      }
      conn.beginTransaction();
      console.log(transactionParams);
      await userinfo.userCancel(transactionParams, conn);
      conn.commit();
    } catch (error) {
      console.log('======================rollback=======================');
      logger.info(error);
      if (conn) conn.rollback();
      if (conn) conn.release();
      if (error.code === 'ER_DUP_ENTRY') {
        let newBalance = await userinfo.getUserBalance(transactionParams.addr, transactionParams.currency);
        let result = {
          id: datas.transaction.id,
          ext_transaction_id: datas.transaction.id,
          parent_transaction_id: datas.bet_transaction_id,
          user_id: transactionParams.addr,
          operation: transactionParams.action,
          amount: transactionParams.amount,
          currency: transactionParams.currency,
          balance: toCpAmount(transactionParams.currency, Math.floor(newBalance * 1e2))
        };
        return sendSuccessMessage2Client(ctx, 200, result);
      }
      return await sendErrorMessage2Client(ctx, 200, 2004);
    } finally {
      if (conn) conn.release();
    }

    let newBalance = await userinfo.getUserBalanceByCurrency(user[0].uid, transactionParams.currency);
    let result = {
      id: datas.transaction.id,
      ext_transaction_id: datas.transaction.id,
      parent_transaction_id: datas.bet_transaction_id,
      user_id: transactionParams.addr,
      operation: transactionParams.action,
      amount: transactionParams.amount,
      currency: transactionParams.currency,
      balance: toCpAmount(transactionParams.currency, Math.floor(newBalance * 1e2))
    };
    return sendSuccessMessage2Client(ctx, 200, result);
  } catch (error) {
    console.log(error);
    return sendErrorMessage2Client(ctx, 403, 1001);
  }
  //@TODO
}

async function betDiscard(ctx) {
  let params = ctx.request.body;
  console.log(`${new Date().toJSON()}---> betDiscard: \n`,params)
  let jwtToken = params.payload;
  try {
    let checkKey = common.verifyUserToken(jwtToken);
    if (!checkKey) return sendErrorMessage2Client(ctx, 403, 1001);
    let datas = checkKey.payload;
    console.log("betDiscard datas is: ",datas)
    let addr = datas.ext_player_id;
    let transaction_id = datas.transaction_id;
    let transaction = await userinfo.getTransactionByIdAndStatus(transaction_id, tranStatus.bet);
    console.log("transaction", transaction);
    if (_.isEmpty(transaction) || transaction[0].addr != addr) {
      let test = await userinfo.getTransactionById(transaction_id);
      console.log("transaction test", tranStatus.bet, test);
      return sendErrorMessage2Client(ctx, 400, 2003);
    }

    if (transaction[0].status != 0) {
      return sendErrorMessage2Client(ctx, 200, 0);
    }

    // let user = await userinfo.getAccountByEmail(transactionParams.addr);
    let user = await userinfo.getAccountByEmail(addr);
    console.log("user", addr, user);

    if (_.isEmpty(user)) return sendErrorMessage2Client(ctx, 400, 2004);

    let transactionParams = {
      addr: addr,
      betTransactionId: transaction_id,
      amount: transaction[0].amount,
      uid: user[0].uid
    };
    let conn = null;
    try {
      conn = await db.getConnection();
      if (conn == null) {
        return await sendErrorMessage2Client(ctx, 403, 204);
      }
      conn.beginTransaction();
      await userinfo.userDiscard(transactionParams, conn);
      conn.commit();
    } catch (error) {
      console.log('======================rollback=======================');
      logger.info(error);
      if (conn) conn.rollback();
      if (conn) conn.release();
      if (error.code === 'ER_DUP_ENTRY') return sendSuccessMessage2Client(ctx, 200, {});
      return await sendErrorMessage2Client(ctx, 400, 2004);
    } finally {
      if (conn) conn.release();
    }
    return sendErrorMessage2Client(ctx, 200, 0);
  } catch (error) {
    console.log(error);
    return sendErrorMessage2Client(ctx, 403, 1001);
  }
  //@TODO
}

async function betRollback(ctx) {
  let params = ctx.request.body;
  console.log(`${new Date().toJSON()}---> betRollback: \n`,params)
  let jwtToken = params.payload;
  try {
    let checkKey = common.verifyUserToken(jwtToken);
    if (!checkKey) return sendErrorMessage2Client(ctx, 403, 1001);
    let datas = checkKey.payload;
    console.log("betRollback datas is: ",datas)
    let transactionParams = {
      addr: datas.transaction.ext_player_id,
      transactionId: datas.transaction.id,
      betTransactionId: datas.bet_transaction_id,
      betslipId: datas.transaction.betslip_id,
      ts: Math.floor(datas.transaction.timestamp * 1000),
      reason: datas.reason || '',
      status: 40,
      amount: fromCpAmount(datas.transaction.currency, datas.transaction.amount * 1e4),
      action: datas.transaction.operation,
      currency: datas.transaction.currency
    };
    console.log(
      transactionParams.addr,
      'bet rollback@',
      transactionParams.transactionId,
      'betId ===>',
      transactionParams.betTransactionId
    );
    let transaction = await userinfo.getTransactionByIdAndStatus(datas.bet_transaction_id, 50);
    if (_.isEmpty(transaction) || transaction[0].addr != transactionParams.addr) {
      return sendErrorMessage2Client(ctx, 400, 2003);
    }

    // 只有赢了的订单会取消, 其他情况的取消, 都是调用的refund
    if (transaction[0].status != tranStatus.win) {
      return sendErrorMessage2Client(ctx, 400, 2004);
    }

    let user = await userinfo.getAccountByEmail(transactionParams.addr);
    if (_.isEmpty(user)) return sendErrorMessage2Client(ctx, 400, 2004);
    transactionParams.uid = user[0].uid;

    let conn = null;
    try {
      conn = await db.getConnection();
      if (conn == null) {
        return await sendErrorMessage2Client(ctx, 403, 204);
      }
      conn.beginTransaction();
      await userinfo.userRollBack(transactionParams, conn);
      conn.commit();
    } catch (error) {
      console.log('======================rollback=======================');
      logger.info(error);
      if (conn) conn.rollback();
      if (conn) conn.release();
      return await sendErrorMessage2Client(ctx, 400, 2004);
    } finally {
      if (conn) conn.release();
    }

    let newBalance = await userinfo.getUserBalanceByCurrency(user[0].uid, transactionParams.currency);
    let result = {
      id: datas.transaction.id,
      ext_transaction_id: datas.transaction.id,
      parent_transaction_id: datas.bet_transaction_id,
      user_id: transactionParams.addr,
      operation: transactionParams.action,
      amount: transactionParams.amount,
      currency: transactionParams.currency,
      balance: toCpAmount(transactionParams.currency, Math.floor(newBalance * 1e2))
    };
    return sendSuccessMessage2Client(ctx, 200, result);
  } catch (error) {
    console.log(error);
    return sendErrorMessage2Client(ctx, 403, 1001);
  }
}

module.exports = {
  ping,
  identify,
  betMake,
  betCommit,
  betSettlement,
  betRefund,
  betWin,
  betCancel,
  betDiscard,
  betRollback
};
