const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 2, ROUNDING_MODE: BigNumber.ROUND_FLOOR })

let toFixed = (val) => {
    let x = new BigNumber(val, 10);
    return x.toNumber();
}

module.exports.toFixed = toFixed
