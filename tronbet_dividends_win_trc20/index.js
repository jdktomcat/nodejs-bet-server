const Redis = require('ioredis');
const moment = require('moment');
const events = require('events');
const appEvent = new events.EventEmitter();
const BigNumber = require('bignumber.js');
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');
const config = require('./src/configs/config');
const tronNodePool = require('./src/service/tronNodePool');
const init_ts = config.app.init_ts; // 初始截止时间戳
const duration = config.app.duration; // 每轮有效时间（秒）
const time_out = config.app.time_out; // 超时时间（秒）
const dividends_addr = config.app.dividends_addr; // 分红合约地址
const staker_addr = config.app.staker_addr;
let defaultPK = config.tronConfig.node.master.defaultPk;

const ignore_round_in_db = config.app.ignore_round_in_db || 0; // 忽略数据库中不存在的轮次
const snapshotValidDuration = config.app.snapshotValidDuration; // 快照有效期
const dividendStatus = config.app.dividendStatus;

const dbService = require('./src/service/dbService');
const tronSrv = require('./src/service/tronService');

let curDividendIndex = 0;
let isBusy = false;

process.on('uncaughtException', error => {
  loggerError.error('!!!!!! uncaughtException>', error);
});

process.on('unhandledRejection', error => {
  loggerError.error('!!!!!! unhandledRejection', error.stack);
});

appEvent.on('snapshot_created', doNextSnapshot);
appEvent.on('snapshot_retry', doNextSnapshot);
appEvent.on('snapshot_completed', createDividend);
appEvent.on('dividend_created', doNextDividend);
appEvent.on('dividend_completed', dividendCompleted);
appEvent.on('dividend_processing', dividendProcessing);
appEvent.on('dividend_retry', doNextDividend);
appEvent.on('scan', scan);

// 获取本轮分红信息
async function getRoundInfo() {
  let roundInfo = {};
  try {
    roundInfo = await getDivideInfoFromBlock();
  } catch (error) {
    loggerDefault.info('getRoundInfo() -> can not get roundinfo: ', error);
    roundInfo.busy = true;
    return roundInfo;
  }

  if (roundInfo.curStatus != dividendStatus.COMPLETE_DIVIDEND && roundInfo.curStatus != dividendStatus.INIT) {
    roundInfo.busy = true;
    loggerDefault.info('getRoundInfo() -> 正在分红 round: ' + roundInfo.round);
    return roundInfo;
  }
  if (roundInfo == null || roundInfo.round === 0) {
    loggerDefault.info('getRoundInfo() -> 从未分红');
    roundInfo = {
      round: 0,
      curStatus: 0,
      nextStaker: 0,
      nextStakingIndex: 0,
      stakerCnt: 0,
      completeTime: 0,
      curDividendIndex: 0,
      start: init_ts,
      busy: false,
      passRound: 0
    };
  } else {
    loggerDefault.info('getRoundInfo() -> roundInfo: ', roundInfo);
  }

  // 已完成
  let preStart = roundInfo.start;
  setNextRound(roundInfo);
  if (roundInfo.passRound == 0) {
    loggerDefault.info(
      'getRoundInfo() -> 本轮分红 round ' + roundInfo.round + ' 将在正常时间截止:',
      moment(roundInfo.start * 1000).format('YYYY-MM-DD HH:mm:ss')
    );
  } else {
    loggerDefault.info(
      'getRoundInfo() -> 本轮分红 round ' +
        roundInfo.round +
        ' 已超时, 上轮分红时间: ' +
        moment(preStart * 1000).format('YYYY-MM-DD HH:mm:ss') +
        ' 推迟 [' +
        roundInfo.passRound +
        '] 轮 至: ',
      moment(roundInfo.start * 1000).format('YYYY-MM-DD HH:mm:ss')
    );
  }
  return roundInfo;
}

// 从链上获取数据分红轮次信息
function getDivideInfoFromBlock() {
  return new Promise((resolve, reject) => {
    tronSrv.queryTransaction(dividends_addr, 'getCurrentDivideInfo()', [], async (err, result) => {
      if (err) reject(err);
      if (result == null || result.result == null) {
        loggerDefault.warn('getDivideInfoFromBlock() -> getCurrentDivideInfo() 查询结果为空!');
        reject('Data is empty');
      }
      if (result.result.result === true) {
        let data = result.constant_result[0];
        // loggerDefault.info(data);
        let dataLen = 64;
        let index = 0;
        let round = tronSrv.hexStringToBigNumber(data.substr(index++ * dataLen, dataLen)).toNumber();
        let curStatus = tronSrv.hexStringToBigNumber(data.substr(index++ * dataLen, dataLen)).toNumber();
        let nextStaker = tronSrv.hexStringToBigNumber(data.substr(index++ * dataLen, dataLen)).toNumber();
        let nextStakingIndex = tronSrv.hexStringToBigNumber(data.substr(index++ * dataLen, dataLen)).toNumber();
        let stakerCnt = tronSrv.hexStringToBigNumber(data.substr(index++ * dataLen, dataLen)).toNumber();
        let completeTime = tronSrv.hexStringToBigNumber(data.substr(index++ * dataLen, dataLen)).toNumber();
        let curDividendIndex = tronSrv.hexStringToBigNumber(data.substr(index++ * dataLen, dataLen)).toNumber();
        let start = tronSrv.hexStringToBigNumber(data.substr(index++ * dataLen, dataLen)).toNumber();
        // loggerDefault.info({ round, curStatus, nextStaker, nextStakingIndex, stakerCnt, completeTime, curDividendIndex, start })
        resolve({
          round,
          curStatus,
          nextStaker,
          nextStakingIndex,
          stakerCnt,
          completeTime,
          curDividendIndex,
          start
        });
      }
    });
  });
}

// 从链上获取质押信息
function getWinStakerStateFromBlock() {
  return new Promise((resolve, reject) => {
    tronSrv.queryTransaction(staker_addr, 'isPaused()', [], async (err, result) => {
      if (err) reject(err);
      if (result == null || result.result == null) {
        loggerDefault.warn('getWinStakerStateFromBlock() -> isPaused() 查询结果为空!');
        reject('Data is empty');
      }
      if (result.result.result === true) {
        let data = result.constant_result[0];
        // loggerDefault.info(data);
        let isPaused = tronSrv.hexStringToBigNumber(data.substr(0, 64)).toNumber();
        // loggerDefault.info({ isPaused })
        resolve({ isPaused });
      }
    });
  });
}

// 质押整体快照
async function createStakeSnapshot() {
  isBusy = true;
  tronSrv.commitTransaction(dividends_addr, 'createStakeSnapshot()', 20000000, 0, [], defaultPK, (err, res) => {
    if (err) {
      isBusy = false;
      loggerError.error('createStakeSnapshot() -> createStakeSnapshot fail: ', err);
    }
    if (res.result === true) {
      isBusy = true;
      loggerDefault.info('createStakeSnapshot() -> createStakeSnapshot success: ', res);
    } else {
      isBusy = false;
      loggerDefault.error('createStakeSnapshot() -> createStakeSnapshot fail: ', res);
    }
  });
}

// 单用户质押快照
async function doNextSnapshot(snapshotEvent) {
  let stakerCnt = snapshotEvent.stakerCnt || 0;
  loggerDefault.info('doNextSnapshot() -> stakerCnt: ' + stakerCnt);
  let count_success = 0;
  for (let idx = 0; idx < stakerCnt; idx++) {
    isBusy = true;
    await (async () => {
      return new Promise((reslove, reject) => {
        tronSrv.commitTransaction(
          dividends_addr,
          'doNextSnapshot(uint256)',
          10000000,
          0,
          [{ type: 'uint256', value: 1 }],
          defaultPK,
          (err, res) => {
            if (err) loggerError.error(err);
            if (res == null || res.result == null || res.result === false) {
              loggerDefault.warn('doNextSnapshot() -> doNextSnapshot fail: ', res);
            } else if (res.result === true) {
              count_success++;
              loggerDefault.info('doNextSnapshot() -> success @ index: ' + idx + ' tx_id: ' + res.txID);
            }
            reslove();
          }
        );
      });
    })();
  }

  // retry error
  loggerDefault.info('doNextSnapshot() -> count_success: ' + count_success + ' / stakerCnt: ' + stakerCnt);
  if (count_success < stakerCnt) {
    appEvent.emit('snapshot_retry', { stakerCnt: stakerCnt - count_success });
  }
}

// 创建分红
async function createDividend() {
  isBusy = true;
  let trc20Arr = [config.app.TRC20TokenType.usdt.addr];
  trc20Arr = trc20Arr.map(_ => '0x' + _.substr(2, 40));

  tronSrv.commitTransaction(
    dividends_addr,
    'createDividend(uint256,address[])',
    20000000,
    0,
    [{ type: 'uint256', value: 0 }, { type: 'address[]', value: trc20Arr }],
    defaultPK,
    (err, res) => {
      if (err) {
        isBusy = false;
        loggerError.error('createDividend() -> createDivide fail:', err);
      }
      if (res.result === true) {
        isBusy = true;
        loggerDefault.info('createDividend() -> createDivide success:', res);
      } else {
        isBusy = false;
        loggerDefault.error('createDividend() -> createDivide fail:', res);
      }
    }
  );
}

// 持续分红
async function doNextDividend(dividendEvent) {
  let nextStakingIndex = dividendEvent.nextStakingIndex || 0;
  loggerDefault.info('doNextDividend() -> nextStakingIndex: ' + nextStakingIndex);
  let count_success = 0;
  for (let idx = 0; idx <= nextStakingIndex; idx++) {
    isBusy = true;
    await (async () => {
      return new Promise((reslove, reject) => {
        tronSrv.commitTransaction(
          dividends_addr,
          'doNextDividend(uint256)',
          10000000,
          0,
          [{ type: 'uint256', value: 1 }],
          defaultPK,
          (err, res) => {
            if (err) loggerError.error(err);
            if (res == null || res.result == null || res.result === false) {
              loggerDefault.warn('doNextDividend() -> fail:', res);
            } else if (res.result === true) {
              count_success++;
              loggerDefault.info('doNextDividend() -> success @ index: ' + idx + ' tx_id: ' + res.txID);
            }
            reslove();
          }
        );
      });
    })();
  }

  loggerDefault.info(
    'doNextDividend() -> count_success: ' + count_success + ' / nextStakingIndex: ' + nextStakingIndex
  );
  if (count_success <= nextStakingIndex) {
    appEvent.emit('dividend_retry', { nextStakingIndex: nextStakingIndex - count_success });
  }
}

// 分红进行
async function dividendProcessing(dividendEvent) {
  curDividendIndex = dividendEvent.dividIndex;
  loggerDefault.info('dividendProcessing() -> got: ' + curDividendIndex);
}

// 分红完成
async function dividendCompleted(dividendEvent) {
  loggerDefault.info('dividendCompleted() -> round: ' + dividendEvent.round);
  isBusy = false;
  curDividendIndex = 0;
}

async function init() {
  loggerDefault.info('init() -> start');
  let roundInfo = await getRoundInfo();

  if (roundInfo.busy) {
    let curStatus = roundInfo.curStatus;

    loggerDefault.info('init() -> 启动时上轮分红未结束, status: ', curStatus);

    if (curStatus == dividendStatus.INIT_SNAPSHOT) {
      // doNextSnapshot
      loggerDefault.info('init() -> 当前快照到第 ' + roundInfo.nextStaker + ' 位');
      appEvent.emit('snapshot_retry', { stakerCnt: roundInfo.stakerCnt });
    }
    if (curStatus == dividendStatus.DOING_SNAPSHOT) {
      // doNextSnapshot
      loggerDefault.info('init() -> 当前快照到第 ' + roundInfo.nextStaker + ' 位');
      appEvent.emit('snapshot_retry', { stakerCnt: roundInfo.stakerCnt - roundInfo.nextStaker + 1 });
    }
    if (curStatus == dividendStatus.COMPLETE_SNAPSHOT) {
      // createDividend
      let now = Math.floor(new Date().getTime() / 1000);
      if (now - roundInfo.completeTime < snapshotValidDuration) {
        appEvent.emit('snapshot_completed', roundInfo);
      }
    }
    if (curStatus == dividendStatus.INIT_DIVIDEND) {
      // doNextDividend
      loggerDefault.info('init() -> 当前分红到第 ' + roundInfo.curDividendIndex + ' 位');
      appEvent.emit('dividend_retry', { nextStakingIndex: roundInfo.nextStakingIndex });
    }
    if (curStatus == dividendStatus.DOING_DIVIDEND) {
      // doNextDividend
      loggerDefault.info('init() -> 当前分红到第 ' + roundInfo.curDividendIndex + ' 位');
      appEvent.emit('dividend_retry', { nextStakingIndex: roundInfo.nextStakingIndex - roundInfo.curDividendIndex });
    }
  }
}

// 扫描区块链数据
function scan() {
  let timer = setTimeout(async () => {
    clearTimeout(timer);
    if (isBusy) {
      // 正在分红
      return appEvent.emit('scan');
    }
    let roundInfo = await getRoundInfo();
    if (roundInfo.busy) {
      return appEvent.emit('scan');
    }

    let now = Math.floor(Date.now() / 1000);
    if (now < roundInfo.start) {
      loggerDefault.info(
        'scan() -> Round: ' + roundInfo.round + ' 未到分红时间, 还差: ' + (roundInfo.start - now) + ' 秒'
      );
    } else {
      let preRound = roundInfo.round - 1;
      if (preRound > 0 && preRound > ignore_round_in_db) {
        let preRoundInfo = await dbService.getPreRoundInfo(preRound);
        if (preRoundInfo) {
          loggerDefault.warn('scan() -> 上一轮 [' + preRound + '] 结果未入库');
          return appEvent.emit('scan');
        }
      }
      // 先判断质押状态, 再转账, 后分红
      try {
        let { isPaused } = await getWinStakerStateFromBlock();
        if (!isPaused) {
          isBusy = true;
          await createStakeSnapshot(roundInfo.round);
        }
      } catch (error) {
        loggerDefault.info('scan() -> can not getWinStakerStateFromBlock: ', error);
      }
    }
    return appEvent.emit('scan');
  }, 3000);
}

// 订阅Redis消息
function subscribe() {
  const redisObserver = Redis.createClient({
    host: config.redisConfig.host,
    port: config.redisConfig.port,
    password: config.redisConfig.pwd,
    db: config.redisConfig.db
  });

  redisObserver.subscribe('tron_win_trc20_dividends', (err, res) => {
    if (err) {
      loggerError.error(err);
      loggerDefault.info('subscribe() -> 订阅频道 [tron_win_trc20_dividends] 失败');
      process.exit(0);
    }
    loggerDefault.info('subscribe() -> 订阅频道 [tron_win_trc20_dividends] 成功');
  });

  redisObserver.on('message', (channel, message) => {
    loggerDefault.info('subscribe() -> channel: ' + channel, message);
    message = JSON.parse(message);
    let _type = message._type;
    switch (_type) {
      case 'dividends_snapshot_started':
        appEvent.emit('snapshot_created', message);
        break;
      case 'dividends_snapshot_completed':
        appEvent.emit('snapshot_completed', message);
        break;
      case 'dividends_create':
        appEvent.emit('dividend_created', message);
        break;
      case 'dividends_step':
        appEvent.emit('dividend_processing', message);
        break;
      case 'dividends_complete':
        appEvent.emit('dividend_completed', message);
        break;
    }
  });

  redisObserver.on('error', error => {
    loggerError.error(error);
    loggerDefault.info('无法连接Redis!!!');
    process.exit(0);
  });
}

// 休眠
function sleep(time = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

// 设置下一轮时间
function setNextRound(roundInfo) {
  let now = Math.floor(Date.now() / 1000);
  roundInfo.round++;
  // console.log(`上次分红时间: `, new Date(roundInfo.start * 1000).toLocaleString());
  let start = Math.floor((now - init_ts) / duration) * duration + init_ts;
  // console.log(`当前分红时间: `, new Date(start * 1000).toLocaleString());
  if (start + time_out < now) {
    start += duration;
  }
  // 已经分完
  if (roundInfo.start > start) {
    start += duration;
  }
  // console.log(`下一次分红时间: `, new Date(start * 1000).toLocaleString());
  roundInfo.passRound = Math.floor((start - roundInfo.start) / duration);
  // console.log(`错过轮数: `, roundInfo.passRound);
  roundInfo.start = start;
}

async function app() {
  await subscribe(); // 订阅

  await tronNodePool.init();

  await sleep(5000);

  await init(); // 检查

  await scan(); // 扫描

  // blockscan 一定要先运行到当前块, 然后启动 dividend
}

app();
