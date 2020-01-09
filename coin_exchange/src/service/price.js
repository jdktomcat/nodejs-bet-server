const axios = require('axios');
const mathjs = require('mathjs');
const log4js = require('../configs/log4js_config');
const loggerDefault = log4js.getLogger('print');
const { coinmarketcap } = require('../configs/config');
const priceModel = require('../model/price');

async function getTRXPrice() {
  try {
    let { data } = await axios.get(coinmarketcap.coinExchangeUrl, {
      headers: coinmarketcap.headers,
      params: {
        symbol: 'TRX',
        convert: 'USD,EUR'
      }
    });

    // { EUR:
    //   { price: 0.014213265865839942,
    //     volume_24h: 404628656.3470141,
    //     percent_change_1h: -0.0506,
    //     percent_change_24h: 0.498,
    //     percent_change_7d: -13.7139,
    //     market_cap: 947770020.5415004,
    //     last_updated: '2019-08-30T18:51:01.000Z' },
    //  USD:
    //   { price: 0.015600749746,
    //     volume_24h: 444128074.948731,
    //     percent_change_1h: -0.0505752,
    //     percent_change_24h: 0.498031,
    //     percent_change_7d: -13.7139,
    //     market_cap: 1040290320.8027372,
    //     last_updated: '2019-08-30T18:51:08.000Z' } }

    loggerDefault.info(data.data.TRX.quote);

    let TRXUSDPrice = data.data.TRX.quote.USD.price;
    let USDTRXPrice = mathjs.divide(1, TRXUSDPrice);
    let TRXUSDTime = new Date(data.data.TRX.quote.USD.last_updated).getTime();

    let TRXEURPrice = data.data.TRX.quote.EUR.price;
    let EURTRXPrice = mathjs.divide(1, TRXEURPrice);
    let TRXEURTime = new Date(data.data.TRX.quote.EUR.last_updated).getTime();

    let USDEURPrice = mathjs.divide(TRXUSDPrice, TRXEURPrice);
    let EURUSDPrice = mathjs.divide(TRXEURPrice, TRXUSDPrice);

    let fixedFunc = _ => mathjs.format(_, { notation: 'fixed', precision: 3 });

    priceModel.insertTRXUSD(fixedFunc(TRXUSDPrice), fixedFunc(USDTRXPrice), TRXUSDTime);
    priceModel.insertTRXEUR(fixedFunc(TRXEURPrice), fixedFunc(EURTRXPrice), TRXEURTime);
    priceModel.insertUSDEUR(fixedFunc(USDEURPrice), fixedFunc(EURUSDPrice));
  } catch (error) {
    loggerDefault.error(error);
  }
}

module.exports = {
  getTRXPrice
};
