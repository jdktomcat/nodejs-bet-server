const _ = require('lodash')._;
const config = require('./src/configs/config');
const tronUtil = require('./src/utils/tronUtil');
const taskModel = require('./src/models/taskModel');
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('default');
// const loggerError = log4js.getLogger('error');

const reset_ts = config.app.reset_ts;
const reset_interval = config.app.reset_interval;
const min_lv = config.app.min_lv;
const top_task_id = config.app.top_task_id;
const tasks_config = config.app.tasks_config;
const defaultPk = config.tronConfig.defaultPk;

const TASK_STATE = {
    LV_LIMIT: 0,
    RUNNING: 1,
    COMPLETE: 2,
    AWARD: 3
}

let redisObserver = null;
let redis = null;
let ROUND = 0;

//订阅Redis消息
function initRedis() {
    redis = require("ioredis").createClient(
        {
            host: config.redisConfig.host,
            port: config.redisConfig.port,
            password: config.redisConfig.pwd,
            db: config.redisConfig.db
        }
    );

    redisObserver = require("ioredis").createClient(
        {
            host: config.redisConfig.host,
            port: config.redisConfig.port,
            password: config.redisConfig.pwd,
            db: config.redisConfig.db
        }
    );

    redisObserver.subscribe('task_message', (err, res) => {
        if (err) {
            loggerDefault.error(err);
            loggerDefault.info("订阅频道 [task_message] 失败");
            process.exit(0);
        }
        loggerDefault.info("订阅频道 [task_message] 成功");
    });

    redisObserver.subscribe('task_award', (err, res) => {
        if (err) {
            loggerDefault.error(err);
            loggerDefault.info("订阅频道 [task_award] 失败");
            process.exit(0);
        }
        loggerDefault.info("订阅频道 [task_award] 成功");
    });

    redisObserver.on('message', async (channel, message) => {
        // loggerDefault.info("channel:" + channel, message);
        if (message == null) return;
        message = JSON.parse(message);
        let addr = message.addr;
        let lv = Number(await redis.hget("player:info:" + addr, "lv"));
        if (lv < min_lv) return;
        if (channel === "task_message") {
            // loggerDefault.info("task_message =>", message);
            handleMsg(message);
        } else if (channel === "task_award") {
            // loggerDefault.info("task_award =>", message);
            sendAward(addr, message.task_id, lv)
        }
    });

    redisObserver.on('error', (error) => {
        loggerDefault.error(error);
        loggerDefault.info("无法连接Redis!!!");
        process.exit(0);
    });
}

async function initCD() {
    setInterval(async () => {
        let _round = Math.floor((_.now() - reset_ts) / reset_interval) + 1;
        if (_round > ROUND) {
            ROUND = _round;
            await redis.hset("app:info", "task_round", ROUND);
            loggerDefault.info("当前轮次", ROUND);
            redis.publish("from_task_app", JSON.stringify({ round: ROUND, event_type: "task_reset" }));
        }
    }, 1000);
}

async function init() {
    await tronUtil.init();
    await initCD();
    await initRedis();
}

//发送奖励
async function sendAward(addr, task_id, lv = 0) { //轮次，地址，任务编号，玩家等级，奖励金额，领奖时间戳
    let _task_status = Number(await redis.hget('task:' + addr + ":" + ROUND, task_id + "_status") || TASK_STATE.RUNNING);
    loggerDefault.info("sendAward", addr, task_id, _task_status);
    if (_task_status !== TASK_STATE.COMPLETE) return;
    let trx = 0;
    let cfg = tasks_config[task_id];
    let _trx_config = cfg.trx;
    if (_.isObject(_trx_config)) {
        for (let _lv in _trx_config) {
            if (lv < _lv) {
                break;
            } else {
                trx = _trx_config[_lv];
            }
        }
    } else {
        trx = cfg.trx;
    }

    loggerDefault.info("任务奖励 =>", addr, "task_id:" + task_id, "lv:" + lv, "trx:" + trx);

    if (trx > 0) {
        let sendTrx_tx = await tronUtil.sendTrx(addr, trx * 1e6, defaultPk);
        if (sendTrx_tx.result === true) {
            await redis.hset('task:' + addr + ":" + ROUND, task_id + "_status", TASK_STATE.AWARD);
            await taskModel.addTaskLog(ROUND, addr, lv, task_id, cfg.need, cfg.need, trx, sendTrx_tx.transaction.txID);
        }
    } else {
        await redis.hset('task:' + addr + ":" + ROUND, task_id + "_status", TASK_STATE.AWARD);
        await taskModel.addTaskLog(ROUND, addr, lv, task_id, cfg.need, cfg.need, trx, "");
    }
}

//处理任务数据
async function handleMsg(message) {
    //console.log("message",message);
    let task_id = message.task_id;
    if (task_id == null || task_id > top_task_id) return;
    let addr = message.addr;
    if (_.isEmpty(addr)) return;
    // let val = message.val;
    // let key = 'task:' + addr + ":" + ROUND;
    let result = await completeTask(addr, task_id);
    if (result === true) {
        // let all_task_status = Number(await redis.hget(key, top_task_id + "_status"));
        // if (all_task_status && (all_task_status === TASK_STATE.COMPLETE || all_task_status === TASK_STATE.AWARD)) {
        //     loggerDefault.info("All tasks had complete!!!", addr)
        //     return;
        // }
        // let allDone = true;
        // for (let id in tasks_config) {
        //     let t_status = Number(await redis.hget(key, id + "_status"));
        //     // loggerDefault.info("?task", id, " status", t_status);
        //     if (id != top_task_id && (t_status == null || t_status === TASK_STATE.LV_LIMIT || t_status === TASK_STATE.RUNNING)) {
        //         allDone = false;
        //         break;
        //     }
        // }
        // if (allDone === true) {
        //     // loggerDefault.info("TOPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP TASK !!!");
        //     await completeTask(addr, top_task_id);
        // }
        // redis.publish("from_task_app", JSON.stringify({ addr: addr, task_id: task_id, state: TASK_STATE.COMPLETE, event_type: "task_state_changed" }));

        for (let id in tasks_config) {
            if (id > top_task_id) {
                await completeTask(addr, id);
            }
        }
        redis.publish("from_task_app", JSON.stringify({ addr: addr, task_id: task_id, state: TASK_STATE.COMPLETE, event_type: "task_state_changed" }));

        //clear pre_round
        let pre_3_round_key = 'task:' + addr + ":" + (ROUND - 3);
        redis.hgetall(pre_3_round_key, (err, res) => {
            if (err == null && res != null) {
                redis.del(pre_3_round_key);
            }
        })
    }
}

async function completeTask(addr, task_id) {
    console.log("completeTask",addr,task_id);
    let cfg = tasks_config[task_id];
    if (cfg == null) return false;
    let key = 'task:' + addr + ":" + ROUND;
    let status = Number(await redis.hget(key, task_id + "_status")); //状态
    loggerDefault.info("task handle =>", key, addr, "task_id:" + task_id, "status:" + status);
    if (status == TASK_STATE.LV_LIMIT || status === TASK_STATE.RUNNING) { //任务未开始 或者 任务正在进行 且 已达标
        let _now_value = Number(await redis.hincrby(key, task_id + "_now", 1)); //任务进度加一
        if (_now_value >= cfg.need) {
            loggerDefault.info("任务完成 =>", key, addr, "task_id:" + task_id, "now:" + _now_value, "status:TASK_STATE.COMPLETE");
            redis.hset(key, task_id + "_status", TASK_STATE.COMPLETE);
            return true;
        } else {
            loggerDefault.info("任务前进 =>", key, addr, "task_id:" + task_id, "status:" + TASK_STATE.RUNNING);
            if (status == null) redis.hset(key, task_id + "_status", TASK_STATE.RUNNING);
            return false;
        }
    } else {
        loggerDefault.info(task_id, ' ... ');
        return false;
    }
}

init();