const schedule = require('node-schedule');
const config = require('./src/configs/config');
const price = require('./src/service/price');

schedule.scheduleJob(config.app.cronExpr, () => {
  price.getTRXPrice();
});
