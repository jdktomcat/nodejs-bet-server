const log4js = require('log4js')
const config = require('./config');
const path = require('path');
const logFatherDir=path.resolve(__dirname, '../../logs');

log4js.configure({
    replaceConsole: false,
    appenders: {
        stdout: {//控制台输出
            type: 'stdout'
        },
        run: {//运行日志
            type: 'dateFile',
            filename: logFatherDir + '/runlog/',
            pattern: 'run-yyyy-MM-dd.log',
            alwaysIncludePattern: true
        },
        req: {//请求日志
            type: 'dateFile',
            filename: logFatherDir + '/reqlog/',
            pattern: 'req-yyyy-MM-dd.log',
            alwaysIncludePattern: true
        },
        err: {//错误日志
            type: 'dateFile',
            filename: logFatherDir + '/errlog/',
            pattern: 'err-yyyy-MM-dd.log',
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ['stdout', 'run'], level: 'debug' },
        http: { appenders: ['stdout', 'req'], level: 'info' },
        error: { appenders: ['stdout', 'err'], level: 'error' },
        print: { appenders: ['stdout', 'run'], level: 'info' }
    }
})

exports.getLogger = function (name) {
    return log4js.getLogger(name || 'default')
}
