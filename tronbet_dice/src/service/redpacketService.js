const _ = require('lodash')._;
const seedrandom = require('seedrandom');
const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 4, ROUNDING_MODE: BigNumber.ROUND_FLOOR });
const TronWeb = require('tronweb');
const tronUtil = require('../utils/tronUtil');
const modelRain = require('../models/modelRain');
const config = require('../configs/config');
const events = require('events');
let raineEvent = new events.EventEmitter();
const SALT = config.dice.RANDOM_SALT_3;
const RAIN_MIN_ID = config.dice.RAIN_MIN_ID;
const redpacketContractAddress = config.dice.redpacketContractAddress;
const redis = require('ioredis').createClient(
    {
        host: config.redisConfig.host,
        port: config.redisConfig.port,
        password: config.redisConfig.pwd,
        db: config.redisConfig.db
    }
);

//最小发红包 sun * count
class RedPacket {
    constructor(id, addr, ts, count, total, salt, type = 0, left) {
        if (total <= 0 || count <= 0 || total < count) {
            throw new Error("Get away!Poor!");
        }
        this.id = id;
        this.addr = addr;
        this.ts = ts;
        this.count = count;
        this.total = Math.floor(total); //单位:sun
        this.salt = salt;
        this.left = left || count;

        if (count === 1) {
            this.type = 1;
        } else {
            this.type = type;
        }

        if (this.type === 0) {
            let randomNum = [];
            let amount = [];
            let rngTotal = 0;
            let seed = this.id + "_" + this.addr + "_" + this.ts + "_" + this.count + "_" + this.total + "_" + this.salt;
            // console.log("random seed", seed);
            let rng = seedrandom(seed);
            for (let i = 1; i <= count; i++) {
                let val = rng();
                randomNum.push(val);
                rngTotal = rngTotal + val;
            }

            let temp_amount = 0;
            for (let i = 0; i < count; i++) {
                let _percent = null;
                let _amount = null;
                if (i === count - 1) {
                    _amount = Math.floor(this.total - temp_amount);
                } else {
                    let randomVal = new BigNumber(randomNum[i], 10);
                    _percent = (new BigNumber(randomVal.div(rngTotal), 10)).toNumber(); //占比
                    _amount = Math.floor(_percent * this.total);
                    if (_amount < 1) {
                        _amount = 1;
                    }
                    temp_amount = temp_amount + _amount;
                }
                amount.push(_amount);
            }
            // console.log("x", a.toNumber(), b.toNumber());

            this.amount = amount;
        } else if (this.type === 1) {
            let amount = [];
            let temp_amount = 0;
            let val = Math.floor(this.total / this.count);
            for (let i = 0; i < count; i++) {
                if (i === count - 1) {
                    amount.push(this.total - temp_amount);
                } else {
                    temp_amount = temp_amount + val;
                    amount.push(val);
                }
            }
            this.amount = amount;
        }

        let data = {
            id: this.id,
            addr: this.addr,
            ts: this.ts,
            count: this.count,
            total: this.total,
            salt: this.salt,
            left: this.left,
            amount: JSON.stringify(this.amount)
        }

        let key = "rain:info:" + this.id;
        for (let k in data) {
            redis.hset(key, k, data[k]);
        }
        // redis.hmset(key, data);
        // redis.lpush("rain:queue", this.id);
    }

    getByIndex(_index) {
        let idx = (_index || 0) - 1;
        // console.log(this.amount[idx]);
        return this.amount[idx];
    }

    take(addr, _callback) { //已抢/已空->红包详情
        redis.hset("rain:log:" + this.id, addr, 0, (err, res) => { //首次领取
            if (err) {
                _callback({ result: "FAIL" })
                return
            }
            let _idx = Number(res);
            if (_idx === 0) { //覆盖一个旧域
                console.warn("take twice redpacket!");
                _callback({ result: "FAIL" })
                return
            }
            // if (res != null) {
            //     console.warn("take twice redpacket!");
            //     _callback({ result: "FAIL" })
            //     return
            // }
            redis.hget("rain:info:" + this.id, "left", async (err, res) => { //还有剩余红包
                if (err) {
                    _callback({ result: "FAIL" });
                    return
                }
                if (Number(res) <= 0) {
                    console.warn("empty redpacket!");
                    _callback({ result: "FAIL" });
                    await getNextRain(this.id);
                    return
                }
                redis.hincrby("rain:info:" + this.id, "left", -1, async (err, res) => { //领取
                    if (err) {
                        console.error(err);
                        _callback({ result: "FAIL" })
                        return
                    }
                    let left = Number(res);
                    if (left >= 0) {
                        this.left = left;
                        let index = this.count - left;
                        let amount = this.getByIndex(index);
                        redis.hset("rain:log:" + this.id, addr, index, async (err, res) => {
                            sendTrx(this.id, this.addr, this.total, this.count, this.ts, addr, index, amount);
                            if (left === 0) {
                                await getNextRain(this.id)
                            }
                            if (_callback) {
                                let senderName = (await redis.hget("app:dice:player:" + this.addr, "name")) || "";
                                if (this.addr === "TGKpnHx8RrnmFdJ27Cc4aqV7CH329RqFs5") {
                                    senderName = "Admin";
                                } else if (this.addr === "TYGVyrQsqVtTYLBsSGEnH8YX3J88WZKJt1") {
                                    senderName = "Ben_MOD";
                                }
                                let receiverName = (await redis.hget("app:dice:player:" + addr, "name")) || "";
                                _callback({ result: "SUCCESS", index, amount, receiver: addr, receiverName, sender: this.addr, senderName });
                            }
                        });
                    } else {
                        if (_callback) {
                            _callback({ result: "FAIL" });
                        }
                        await getNextRain(this.id)
                    }
                });
            });
        })
    }
}

function sendTrx(rain_id, sender, total_sun, count, send_ts, receiver, no, amount) {
    tronUtil.tronExec(redpacketContractAddress, "recviveRain(uint256,address,uint256)", 2000000, 0, [{ type: "uint256", value: rain_id }, { type: "address", value: receiver }, { type: "uint256", value: amount }], null, null, (err, result) => {
        if (err) return;
        if (result.result === true) {
            let tx_id = result.transaction.txID;
            // console.log("sendTrx by tx:", tx_id);
            saveLog(rain_id, sender, total_sun, count, send_ts, receiver, no, amount, tx_id);
        }
    });
}

function saveLog(rain_id, sender, total_sun, count, send_ts, receiver, no, amount, tx_id) {
    modelRain.addRainLog(rain_id, sender, total_sun, count, send_ts, receiver, no, amount, tx_id);
}

async function getNextRain(cur_id) {
    let next_id = cur_id + 1;
    // console.log("getNextRain", next_id);
    let nextRainInfo = await redis.hgetall("rain:info:" + next_id);
    if (nextRainInfo) {
        await redis.set("active:rain:id", next_id);
        let rain_info = await redis.hgetall("rain:info:" + next_id);
        ACTIVE_RAIN = new RedPacket(Number(rain_info.id), rain_info.addr, Number(rain_info.ts), Number(rain_info.count), Number(rain_info.total), rain_info.salt, 0);
    } else {
        await redis.del("active:rain:id");
        ACTIVE_RAIN = null;
    }
    raineEvent.emit("new_rain");
}

async function load() {
    let active_rain_id = await redis.get("active:rain:id");
    // console.log("load active_rain_id", active_rain_id);
    if (active_rain_id == null) return;
    active_rain_id = Number(active_rain_id);
    let rain_info = await redis.hgetall("rain:info:" + active_rain_id);
    // console.log("cur rain_info", rain_info);
    ACTIVE_RAIN = new RedPacket(Number(rain_info.id), rain_info.addr, Number(rain_info.ts), Number(rain_info.count), Number(rain_info.total), rain_info.salt, 0, Number(rain_info.left));
}

let ACTIVE_RAIN = null;
let MAX_EMPTY_RAIN_ID = null;

async function getRainList() {
    let active_rain_id = await redis.get("active:rain:id");
    // console.log("get active_rain_id", active_rain_id);
    if (active_rain_id == null) return [];
    if (MAX_EMPTY_RAIN_ID && MAX_EMPTY_RAIN_ID >= active_rain_id) return [];

    let ret = [];
    let rain = await redis.hgetall("rain:info:" + active_rain_id);
    // console.log("rain",rain)
    let data = {
        id: rain.id,
        sender: rain.addr,
        senderName: (await redis.hget("app:dice:player:" + rain.addr, "name")) || "",
        ts: rain.ts,
        count: rain.count,
        total: rain.total,
        left: rain.left,
        // detail: rain.amount
    }
    if (data.left <= 0) {
        data.left = 0;
        if (MAX_EMPTY_RAIN_ID) {
            if (MAX_EMPTY_RAIN_ID < active_rain_id) MAX_EMPTY_RAIN_ID = active_rain_id;
        } else {
            MAX_EMPTY_RAIN_ID = active_rain_id;
        }
    }

    // TODO:
    if (data.sender === "TGKpnHx8RrnmFdJ27Cc4aqV7CH329RqFs5") {
        data.senderName = "Admin"
    } else if (data.sender === "") {
        data.senderName = "Ben_Mod"
    }
    // TODO:

    let logs = await redis.hgetall("rain:log:" + data.id);
    logs = logs || [];
    let rain_losg = [];
    if (logs != null) {
        for (let addr in logs) {
            let index = logs[addr];
            let _amount = rain.amount[index];
            rain_losg.push({
                receiver: addr,
                receiverName: (await redis.hget("app:dice:player:" + addr, "name")) || "",
                index: logs[addr],
                amount: _amount,
                ts: 1
            });
        }
    }
    // console.log("left =>", data.left)
    data.logs = rain_losg;
    ret.push(data);
    return ret;
}

function take(id, addr, _callback) {
    // console.log("client take", id, addr);
    // console.log("ACTIVE_RAIN", ACTIVE_RAIN);
    if (ACTIVE_RAIN && ACTIVE_RAIN.id === id) {
        ACTIVE_RAIN.take(addr, async (rain_log) => {
            // console.log("rain_log", rain_log);
            if (_callback == null) return;
            if (rain_log.result === "FAIL") return;
            let rain_list = await getRainList();
            _callback(rain_list, rain_log);
        });
    }
}

module.exports.take = take;
module.exports.getRainList = getRainList;
module.exports.listen = listen;
module.exports.raineEvent = raineEvent;

async function listen() {
    await load();
    setInterval(() => {
        // console.log("rain listen");
        tronUtil.tronQuery(redpacketContractAddress, "getMaxRainIndex()", [], null, null, async (err, result) => {
            if (err) return;
            if (result) {
                // console.log("bbb",result);
                let data = result;
                let maxRainIndex = hexStringToBigNumber(data.substr(0, 64)).toNumber();
                // console.log("maxRainIndex",maxRainIndex);
                let max_rain_id = await redis.get("max:rain:id");
                if (max_rain_id != null) {
                    max_rain_id = Number(max_rain_id);
                } else {
                    max_rain_id = 0;
                }
                // console.log("redis max_rain_id", max_rain_id, "block maxRainIndex", maxRainIndex, max_rain_id >= maxRainIndex);
                if (max_rain_id >= maxRainIndex) return;
                for (let id = max_rain_id + 1; id <= maxRainIndex; id++) {
                    // console.log("--->",RAIN_MIN_ID,id);
                    if (RAIN_MIN_ID >= id) continue; //忽略指定红包ID
                    // console.log("getRainInfo -->", id);
                    tronUtil.tronQuery(redpacketContractAddress, "getRainInfo(uint256)", [{ type: 'uint256', value: id }], null, null, async (err, result) => {
                        if (err) { console.error(err); return }
                        // console.log(result);
                        if (result) {
                            let data = result;
                            // console.log(data);
                            let rainIndex = hexStringToBigNumber(data.substr(0, 64)).toNumber();
                            let owner = hexStringToTronAddress(data.substr(88, 40));
                            let rainTime = hexStringToBigNumber(data.substr(128, 64)).toNumber();
                            let originalTrxAmount = hexStringToBigNumber(data.substr(192, 64)).toNumber();
                            let originalCount = hexStringToBigNumber(data.substr(256, 64)).toNumber();
                            let recvTrxAmount = hexStringToBigNumber(data.substr(320, 64)).toNumber();
                            let recvCount = hexStringToBigNumber(data.substr(384, 64)).toNumber();

                            redis.exists("rain:info:" + rainIndex, async (err, res) => {
                                if (err) return;
                                //console.log("res", res)
                                if (Number(res) > 0) return;
                                // console.log("new_rain", rainIndex);
                                // console.log("rain_info", rainIndex, owner, rainTime, originalTrxAmount, originalCount, recvTrxAmount, recvCount);
                                let newRainInfo = new RedPacket(rainIndex, owner, rainTime, originalCount, originalTrxAmount, SALT, 0);
                                await redis.set("max:rain:id", rainIndex);
                                if (ACTIVE_RAIN == null) {
                                    ACTIVE_RAIN = newRainInfo;
                                    redis.set("active:rain:id", newRainInfo.id);
                                    raineEvent.emit("new_rain");
                                }
                            })
                        }
                    });
                }
                // }
            }
        })
    }, 1501);
}

//十六进制字符串转Tron账号
function hexStringToTronAddress(_hexStr) {
    return TronWeb.address.fromHex('41' + _hexStr);
}

//十六进制字符串转BigNumber
function hexStringToBigNumber(_hexStr) {
    return new BigNumber(_hexStr, 16);
}