
const { BigNumber } = require('bignumber.js')
const userinfo = require('../model/userinfo')
const redisUtils = require('../utils/redisUtil')
const common = require('../utils/common')

function stringToUtf8ByteArray(str) {
    // TODO(user): Use native implementations if/when available
    var out = [], p = 0;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 128) {
        out[p++] = c;
      } else if (c < 2048) {
        out[p++] = (c >> 6) | 192;
        out[p++] = (c & 63) | 128;
      } else if (
          ((c & 0xFC00) == 0xD800) && (i + 1) < str.length &&
          ((str.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
        // Surrogate Pair
        c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
        out[p++] = (c >> 18) | 240;
        out[p++] = ((c >> 12) & 63) | 128;
        out[p++] = ((c >> 6) & 63) | 128;
        out[p++] = (c & 63) | 128;
      } else {
        out[p++] = (c >> 12) | 224;
        out[p++] = ((c >> 6) & 63) | 128;
        out[p++] = (c & 63) | 128;
      }
    }
    return out;
}

function utf8ByteArrayToString(bytes) {
    // TODO(user): Use native implementations if/when available
    var out = [], pos = 0, c = 0;
    while (pos < bytes.length) {
      var c1 = bytes[pos++];
      if (c1 < 128) {
        out[c++] = String.fromCharCode(c1);
      } else if (c1 > 191 && c1 < 224) {
        var c2 = bytes[pos++];
        out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
      } else if (c1 > 239 && c1 < 365) {
        // Surrogate Pair
        var c2 = bytes[pos++];
        var c3 = bytes[pos++];
        var c4 = bytes[pos++];
        var u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) -
            0x10000;
        out[c++] = String.fromCharCode(0xD800 + (u >> 10));
        out[c++] = String.fromCharCode(0xDC00 + (u & 1023));
      } else {
        var c2 = bytes[pos++];
        var c3 = bytes[pos++];
        out[c++] =
            String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
      }
    }
    return out.join('');
}

function bytesArray2hexStr(bytesArray) {
  const hexByteMap = '0123456789abcdef';
  let retStr = '';
  let length = bytesArray.length;
  var charCode;
  for (let i = 0; i < length; ++i) {
    charCode = bytesArray[i];
    retStr += hexByteMap.charAt(charCode >> 4);
    retStr += hexByteMap.charAt(charCode & 0x0f);
  }
  return retStr;
}

function hexStr2bytesArray(hesStr) {
  let outArray = [];
  let halfLength = hesStr.length / 2;
  for (let i = 0; i < halfLength; ++i) {
      let tmp = `0x${ hesStr[i * 2] }${ hesStr[i * 2 + 1] }`;
      outArray[i] = tmp;
  }
  return outArray;
}

function string2hexStr(str) {
  return bytesArray2hexStr(stringToUtf8ByteArray(str));
}

function hexStr2string(hexStr) {
  return utf8ByteArrayToString(hexStr2bytesArray(hexStr));
}

function hexStringToBigNumber(hexStr) {
    return new BigNumber('0x' + hexStr);
}

function hexStringToAddress(hexStr) {
    if (hexStr.length == 64) {
        return '0x' + hexStr.substr(24, 40);
    } else {
        return hexStr;
    }
}

function randomString(range) {
    let str = "",
      arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
        'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
        'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        '-'];
  
    for (let i = 0; i < range; i++) {
      pos = Math.round(Math.random() * (arr.length - 1));
      str += arr[pos];
    }
    return str;
}

function sleep(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout))
}


async function getUniqueKey() {
    let uniCode = common.getRandomSeed(15)
    let hasCode = await redisUtils.hget('charity:key', uniCode)
    if (hasCode) return await getUniqueKey()
    await redisUtils.hset('charity:key', uniCode, 1)
    return uniCode
}

/**
 * 
 * @param donateInfo 中的信息如下：
 * addr  捐款玩家地址
 * amount 捐款金额
 * ts  时间， ltc的时间准确， 慎用
 * txId 交易tx
 * blockNum  区块高度
 * types    币种类型 ether，ltc
 */
async function dealDonates(donateInfo) {
    //TODO 这里处理有玩家捐款的逻辑， 如果处理报错， 直接return false， 会尝试重试扫描该区块
    // 如果是用其他语言开发的逻辑， 这里建议使用redis发布消息， 在其他进程是消费
    // 只有在异常的时候， 需要返回false
    // 其他情况返回true
    // let uniCode = await getUniqueKey()
    let now = new Date().getTime()
    if (now > 1560531600000) {
      console.log('==================over time==================')
      return true
    }
    console.log(donateInfo)
    let result = []
    if (donateInfo.coinType == 'trx') {
      result = await genTrxDonates(donateInfo)
    } else if (donateInfo.coinType == 'bnb') {
      result = await genBnBDonates(donateInfo)
    } else if (donateInfo.coinType == 'ltc') {
      result = await genLtcDonates(donateInfo)
    }
    try {
      return await userinfo.addCharityCode(result)
    } catch (error) {
      console.log(error)
      return false
    }
    return true
}

async function genTrxDonates(donateInfo) {
  let amount = donateInfo.amount
  if (amount < 150) {
    return []
  } else if (amount >= 150 && amount < 599) {
    return await genArrDonatesInfo(donateInfo, 1)
  } else if (amount >= 600 && amount < 1499) {
    return await genArrDonatesInfo(donateInfo, 5)
  } else if (amount >= 1500 && amount < 2999) {
    return await genArrDonatesInfo(donateInfo, 15)
  } else if (amount >= 3000 && amount < 14999) {
    return await genArrDonatesInfo(donateInfo, 32)
  } else if (amount >= 15000 && amount < 29999) {
    return await genArrDonatesInfo(donateInfo, 170)
  } else if (amount >= 30000 && amount < 59999) {
    return await genArrDonatesInfo(donateInfo, 360)
  } else if (amount >= 60000 && amount < 149999) {
    return await genArrDonatesInfo(donateInfo, 760)
  } else if (amount >= 150000) {
    return await genArrDonatesInfo(donateInfo, 2000)
  } 
}

async function genLtcDonates(donateInfo) {
  let amount = donateInfo.amount
  if (amount < 0.05) {
    return []
  } else if (amount >= 0.05 && amount < 0.2) {
    return await genArrDonatesInfo(donateInfo, 1)
  } else if (amount >= 0.2 && amount < 0.5) {
    return await genArrDonatesInfo(donateInfo, 5)
  } else if (amount >= 0.5 && amount < 1) {
    return await genArrDonatesInfo(donateInfo, 15)
  } else if (amount >= 1 && amount < 5) {
    return await genArrDonatesInfo(donateInfo, 32)
  } else if (amount >= 5 && amount < 10) {
    return await genArrDonatesInfo(donateInfo, 170)
  } else if (amount >= 10 && amount < 20) {
    return await genArrDonatesInfo(donateInfo, 360)
  } else if (amount >= 20 && amount < 50) {
    return await genArrDonatesInfo(donateInfo, 760)
  } else if (amount >= 50) {
    return await genArrDonatesInfo(donateInfo, 2000)
  } 
}

async function genBnBDonates(donateInfo) {
  let amount = donateInfo.amount
  if (amount < 0.15) {
    return []
  } else if (amount >= 0.15 && amount < 0.6) {
    return await genArrDonatesInfo(donateInfo, 1)
  } else if (amount >= 0.6 && amount < 1.5) {
    return await genArrDonatesInfo(donateInfo, 5)
  } else if (amount >= 1.5 && amount < 3) {
    return await genArrDonatesInfo(donateInfo, 15)
  } else if (amount >= 3 && amount < 15) {
    return await genArrDonatesInfo(donateInfo, 32)
  } else if (amount >= 15 && amount < 30) {
    return await genArrDonatesInfo(donateInfo, 170)
  } else if (amount >= 30 && amount < 60.0) {
    return await genArrDonatesInfo(donateInfo, 360)
  } else if (amount >= 60 && amount < 150) {
    return await genArrDonatesInfo(donateInfo, 760)
  } else if (amount >= 150) {
    return await genArrDonatesInfo(donateInfo, 2000)
  } 
}

async function genArrDonatesInfo(donateInfo, num) {
  let result = []
  for (let i = 0; i< num; i++) {
    result.push({
      ...donateInfo,
    })
  }
  return result
}


function hexStringToBigNumber(hexStr) {
  return new BigNumber('0x' + hexStr);
}

async function getCardType(card) {
  if (card.length != 10) return null
  let styles = ['d', 'h', 's', 'c']
  let result = []
  for (let i=0; i<5; i++) {
    let tmp = card.substr(i * 2, 2)
    let style = styles[hexStringToBigNumber(tmp.substr(0, 1)).toNumber() - 1]
    let point = hexStringToBigNumber(tmp.substr(1, 1)).toNumber()
    result.push({style, point})
  }
  return result
}

module.exports = {
    hexStringToBigNumber,
    hexStringToAddress,
    hexStr2string,
    dealDonates,
    sleep,
    randomString
}

getCardType('4a4b4c4d4e')