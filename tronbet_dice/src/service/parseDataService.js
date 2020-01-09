const _ = require('lodash')._;
module.exports.createPlayerInfo = (_addr, _name, _createTs, _count, _total, _payout) => {
    return {
        addr: _addr || "", //tron地址（唯一）
        name: _name || "", //昵称（唯一）
        createTs: parseInt(Date.now() / 1000),//创建时间
        lv: 1, //等级（根据count计算）
        count: _count || 0, //总场数
        total: _total || 0, //总投注
        payout: _payout || 0, //总赔付
    }
}

module.exports.createBetLogInfo = (_orderid, _bettor, _name, _direction, _number, _roll, _amount, _payout, _multiplier, _ts, _isWin, _isHighRoller, _isRareWins, _tokeType, _tokenName) => {
    return {
        orderId: _orderid || 0,
        bettor: _bettor || "", //tron地址（唯一）
        name: _name || "", //昵称（唯一）
        number: _number || 0, //所猜数字
        direction: _direction || 0,//命中数字
        roll: _roll || 0,//命中数字
        trx_amount: _amount || 0,//下注额
        sunAmount: (_amount || 0) * 1e6,
        payout: _payout || 0,//赔付额
        multiplier: _multiplier || 1,
        ts: _ts || 0,//下注时间
        isWin: _payout > 0 ? true : false,//是否胜利
        isHighRoller: _isHighRoller || false, //是否是高额赔付
        isRareWins: _isRareWins || false, //是否是低胜率赔付
        tokeType: _tokeType || "trx", //trx trc20 trc10
        tokenName: _tokenName || "TRX",
    }
}

module.exports.createChatInfo = (_addr, _name, _lv, _msg, _type, _ts) => {
    return {
        addr: _addr || "", //tron地址（唯一）
        name: _name || "", //昵称（唯一）
        lv: _lv || 1,//等级（根据count计算）
        msg: _msg || "", //消息内容
        type: _type || "en",//消息类型
        ts: _ts || 0,//消息时间
    }
}

module.exports.createRankInfo = (_addr, _name, _lv, _val, _type) => {
    return {
        addr: _addr || "", //tron地址（唯一）
        name: _name || "", //昵称（唯一）
        lv: _lv || 1,//等级（根据count计算）
        val: _val || "", //排行判断依据值
        type: _type || "en",//排行榜类型
    }
}

module.exports.createSysInfo = (_count, _total, _payout) => {
    return {
        count: _count,//总场次
        total: _total || 0,//总投注额
        payout: _payout || 0,//总赔付 -->total won of players
        // profit:_profit || 0,//总盈利 (total - payout)
    }
}

module.exports.createADInfo = (_content, _url) => {
    return {
        content: _content || "",//广告文字
        url: _url || "",//广告链接
    }
}

let ROLL_PAYOUT_MAP = new Map();
const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 4, ROUNDING_MODE: BigNumber.ROUND_FLOOR });

let ROLL_MIN = 0;
let ROLL_MAX = 99;
for (let i = ROLL_MIN; i <= ROLL_MAX; ++i) {
    // let val = 98 / (i - 1) - 1;
    let val = new BigNumber(98.5, 10);
    val = val.div(i);
    val = new BigNumber(val, 10);
    ROLL_PAYOUT_MAP.set(i, val);
}
// console.log(ROLL_PAYOUT_MAP);

function calcPayout(under, amount) {
    if (!_.isNumber(under) || !_.isNumber(amount) || _.isNaN(under || _.isNaN(amount))) {
        throw new Error("calcPayout => param type is wrong!");
    }
    if (Math.floor(under) !== under) {
        throw new Error("calcPayout => the param [under] should be integer!");
    }
    if (under < ROLL_MIN || under > ROLL_MAX) {
        console.log(under);
        throw new Error("calcPayout => the param [under] should >= " + ROLL_MIN + " and <= " + ROLL_MAX);
    }

    amount = new BigNumber(amount, 10);
    let rate = ROLL_PAYOUT_MAP.get(under);
    let payout = new BigNumber(rate.times(amount).toNumber(), 10).toNumber();
    let multiplier = rate.toNumber();
    // console.log("payout = amount * multiplier  => ", payout, amount.toNumber(), multiplier);
    return { payout: payout, amount: amount.toNumber(), multiplier: multiplier };
}
// console.log(calcPayout(34, 100));

module.exports.calcPayout = calcPayout;