const mongoose = require('mongoose');
const poker_user = require('../models/poker_user');
const poker_table = require('../models/poker_table');
const poker_lobby = require('../models/poker_lobby');
const poker_scan_setting = require('../models/poker_scan_setting');
const poker_payin_order = require('../models/poker_payin_order');
const poker_payout_order = require('../models/poker_payout_order');
const poker_jackpot_order = require('../models/poker_jackpot_order');
const poker_payed_payin = require('../models/poker_payed_payin');
const poker_history_detail = require('../models/poker_history_detail');
const poker_history_list = require('../models/poker_history_list');

const log4js = require('../configs/log4js.config');
const loggerDefault = log4js.getLogger('print');
const config = require('../configs/config');
const mongoConfig = config.mongoConfig;

const dbURL = "mongodb://" + mongoConfig.user + ":" + mongoConfig.pwd + "@" + mongoConfig.host + ":" + mongoConfig.port + "/" + mongoConfig.db;

loggerDefault.info(dbURL);
mongoose.connect(dbURL);

mongoose.connection.on('connected', function (err) {
    loggerDefault.info('connected');
    if (err) loggerDefault.info('Database connection failure');
});

mongoose.connection.on('error', function (err) {
    loggerDefault.info('error');
    loggerDefault.info('Mongoose connected error ' + err);
});

mongoose.connection.on('disconnected', function () {
    loggerDefault.info('disconnected');
    loggerDefault.info('Mongoose disconnected');
});

function injectPromise(func, ...args) {
    return new Promise((resolve, reject) => {
        func(...args, (err, res) => {
            if (err)
                reject(err);
            else resolve(res);
        });
    });
}

function promiseInjector(scope) {
    return (func, ...args) => {
        return injectPromise(func.bind(scope), ...args);
    }
}

class MongoDB {
    constructor() {
        this.schemas = {};
        this.schemas['poker_user'] = poker_user;
        this.schemas['poker_table'] = poker_table.Model;
        this.schemas['poker_lobby'] = poker_lobby;
        this.schemas['poker_scan_setting'] = poker_scan_setting;
        this.schemas['poker_payin_order'] = poker_payin_order;
        this.schemas['poker_payout_order'] = poker_payout_order;
        this.schemas['poker_payed_payin'] = poker_payed_payin;
        this.schemas['poker_history_detail'] = poker_history_detail;
        this.schemas['poker_history_list'] = poker_history_list;
        this.schemas['poker_jackpot_order'] = poker_jackpot_order;

        this.injectPromise = promiseInjector(this);
    };

    close(cb) {
        mongoose.connection.close(() => {
            cb();
        });
    }

    // res返回值集中情况:
    // 不存在已新增: { ok: 1, nModified: 0, n: 1, upserted: [ [Object] ] } 
    // 已存在已修改: { ok: 1, nModified: 1, n: 1 }
    // 已存在未修改: { ok: 1, nModified: 0, n: 1 }
    saveOne(tableName, conditions, doc, callback) {
        if (!callback) {
            return this.injectPromise(this.saveOne, tableName, conditions, doc);
        }

        try {
            let schema = this.schemas[tableName];
            if (schema == null) {
                return callback('Collection not exist!', null);
            }

            if (conditions == null || doc == null) {
                return callback('conditions or doc is null', null);
            }

            schema.updateOne(conditions, doc, { upsert: true }, (err, res) => {
                if (err) {
                    return callback(err, null);
                } else {
                    return callback(null, res);
                }
            });
        } catch (e) {
            return callback(e, null);
        }
    }

    // res返回情况
    // 找到一条并修改: { ok: 1, nModified: 1, n: 1 }
    // 找到一条未修改: { ok: 1, nModified: 0, n: 1 }
    // 未找到而未修改: { ok: 1, nModified: 0, n: 0 }
    updateOne(tableName, conditions, doc, callback) {
        if (!callback) {
            return this.injectPromise(this.updateOne, tableName, conditions, doc);
        }

        try {
            let schema = this.schemas[tableName];
            if (schema == null) {
                return callback('Collection not exist!', null);
            }

            if (conditions == null || doc == null) {
                return callback('conditions or doc is null', null);
            }

            schema.updateOne(conditions, doc, { upsert: false }, (err, res) => {
                if (err) {
                    return callback(err, null);
                } else {
                    return callback(null, res);
                }
            });
        } catch (e) {
            return callback(e, null);
        }
    }

    findOne(tableName, conditions, fields, callback) {
        if (!callback) {
            return this.injectPromise(this.findOne, tableName, conditions, fields);
        }

        try {
            let schema = this.schemas[tableName];
            if (schema == null) {
                return callback('Collection not exist!', null);
            }
            if (conditions == null) {
                return callback('Conditions is null');
            }
            schema.findOne(conditions, fields || null, {}, function (err, res) {
                if (err) {
                    return callback(err, null);
                } else {
                    return callback(null, res);
                }
            });
        } catch (e) {
            return callback(e, null);
        }
    }

    /**
     * 查询数据
     * @param tableName 表名
     * @param conditions 查询条件
     * @param fields 待返回字段, 如{_id:0, addr:1, name: 1}
     * @param options 见https://mongoosejs.com/docs/api.html#query_Query-setOptions
     * @param callback 回调方法
     */
    find(tableName, conditions, fields, options, callback) {
        if (!callback) {
            return this.injectPromise(this.find, tableName, conditions, fields, options);
        }
        try {
            let schema = this.schemas[tableName];
            if (schema == null) {
                return callback('Collection not exist!');
            }
            if (conditions == null) {
                return callback('Conditions is null');
            }

            schema.find(conditions, fields || null, options || {}, function (err, res) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, res);
                }
            });
        } catch (e) {
            return callback(e, null);
        }
    }

    count(tableName, conditions, callback) {
        if (!callback) {
            return this.injectPromise(this.count, tableName, conditions);
        }

        try {
            let schema = this.schemas[tableName];
            if (schema == null) {
                return callback('Collection not exist!', null);
            }
            if (conditions == null) {
                return callback('Conditions is null', null);
            }
            schema.countDocuments(conditions, function (err, res) {
                if (err) {
                    return callback(err, null);
                } else {
                    return callback(null, res);
                }
            });
        } catch (e) {
            return callback(e, null);
        }
    }
}

module.exports = new MongoDB();
