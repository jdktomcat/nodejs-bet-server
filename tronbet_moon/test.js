const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 11, ROUNDING_MODE: BigNumber.ROUND_FLOOR })
const _ = require('lodash')._;
const sha3 = require('js-sha3');
const sha3_256 = sha3.sha3_256;
const bigNumberUtil = require('./src/utils/utilBigNumber');
const config = require('./src/configs/config');
const APP_KEY = config.moon.APP_KEY;
const RANDOM_SALT_1 = config.moon.RANDOM_SALT_1;
const RANDOM_SALT_2 = config.moon.RANDOM_SALT_2;
const RANDOM_SALT_3 = config.moon.RANDOM_SALT_2;
const log4js = require('./src/configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const loggerError = log4js.getLogger('error');

let tempRdm = "";
//生成随机数 ***
function createRandom() {
    let _now = Date.now() + 2018;
    let _random = _.random(1000000000, 9999999999) - 1949;
    let _result = sha3_256(sha3_256(APP_KEY + _now + RANDOM_SALT_1) + _random + RANDOM_SALT_2 + tempRdm + RANDOM_SALT_3);
    tempRdm = _result;
    return _result;
}


function compute(_hash) {
    let x = (new BigNumber(_hash, 16)).mod(104000000000).minus(4000000000).toNumber() / 100000000000;
    if (x < 0.01) {
        x = 0;
    }
    let ret = bigNumberUtil.toFixed((new BigNumber(1)).div((new BigNumber(1)).minus(x)).toNumber());
    if (ret > 9999) {
        ret = 9999;
    }
    return ret;
}

function compute1(x) {
    return Number(
        (new BigNumber(1)).div(
            (new BigNumber(1)).minus(x)
        ).toNumber()
    ); // 1
}

function test() {
    for (let i = 0; i < 10000; i++) {
        let _hash = createRandom();
        let _result = compute(_hash);
        // if(_result>99){
        //     console.log(_hash)
        //     console.log("",i,_result);
        // }
        loggerDefault.info(i, _result);
        if (_result > 99) {
            loggerError.error(i, _result);
        }
    }
}

function test1() {
    console.log(compute1(0.9998999864));
}

// test();

// compute("daf8a36bb2787233042d04c61fbf8a521981d05d255d179b8734d3f7ce30cffc");


function hextoString(hex) {
    const arr = hex.split('');
    let out = '';
    for (let i = 0; i < arr.length / 2; i++) {
        let tmp = `0x${arr[i * 2]}${arr[i * 2 + 1]}`;
        out += String.fromCharCode(tmp);
    }
    return out;
}

console.log(hextoString("65666665637469766520636f6e6e656374696f6e3a30206c74206d696e456666656374697665436f6e6e656374696f6e3a31"));