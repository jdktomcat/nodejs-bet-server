const path = require('path')
const Koa = require('koa2')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')
const session = require('koa-session');
const config = require('./src/configs/config')
const routers = require('./src/routers/index')
const cron = require('./src/service/cron')
const {parseDice} = require("./src/model/dice/dice")
//定时更新 dice 的 sum data
parseDice()
//
var cors = require('koa-cors');

const app = new Koa()
app.use(cors());

//
app.keys = ['session test secret hurr'];
const CONFIG = {
    key: 'koa:sess', /** (string) cookie key (default is koa:sess) */
    /** (number || 'session') maxAge in ms (default is 1 days) */
    /** 'session' will result in a cookie that expires when session/browser is closed */
    /** Warning: If a session cookie is stolen, this cookie will never expire */
    maxAge: 86400000,
    autoCommit: true,
    /** (boolean) automatically commit headers (default true) */
    overwrite: true,
    /** (boolean) can overwrite or not (default true) */
    httpOnly: true,
    /** (boolean) httpOnly or not (default true) */
    signed: true,
    /** (boolean) signed or not (default true) */
    rolling: false,
    /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
    renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
};
app.use(session(CONFIG, app));


// 配置控制台日志中间件
app.use(koaLogger())

// 配置ctx.body解析中间件
app.use(bodyParser({
    onerror: function (err, ctx) {
        ctx.throw('body parse error', 422);
    }
}))

/**
 * login filter
 */
app.use(async (ctx, next) => {
    try {
        ctx.set('Access-Control-Allow-Origin', ctx.request.headers.origin);
        ctx.set('Access-Control-Allow-Credentials', true);
        ctx.set('Access-Control-Allow-Headers', 'Content-Type');
        //
        const originalUrl = ctx.originalUrl
        const url = originalUrl.split('?')[0]
        const filterList = ['/query', '/supply']
        const s = filterList.some(e => url.startsWith(e))
        console.log(url)
        if (url !== '/query/getAddrTransaction' && s) {
            console.log("debu----->", ctx.session.user)
            const id = ctx.session.user || ''
            if (id === '') {
                return ctx.body = {
                    code: 401,
                    message: "需要重新登录！"
                }
            }
        }
        //
        await next()
    } catch (e) {
        ctx.body = {
            code: 500,
            message: e.toString()
        }
    }
})

// 初始化路由中间件
app.use(routers.routes()).use(routers.allowedMethods)

// 监听启动端口
app.listen(config.app.http_port, '0.0.0.0')
console.log(`the server is start at port ${config.app.http_port}`)