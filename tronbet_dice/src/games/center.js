const tronUtil = require('../utils/tronUtil');
const _ = require('lodash')._;
const events = require('events');
const appEvent = new events.EventEmitter();

function getAccount(address,_callback){
    tronUtil.getAccount(address,null,null,_callback);
}

module.exports.appEvent = appEvent;
module.exports.getAccount = getAccount;