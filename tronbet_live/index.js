const path = require('path')
const Koa = require('koa2')
const session = require('koa-session');
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')
const config = require('./src/configs/config')
const routers = require('./src/routers/index')
const common = require('./src/utils/common')
const mainSchedule = require('./src/dailyschedule/mainProcess')
mainSchedule()
const app = new Koa()

app.proxy = true
// 配置控制台日志中间件
app.use(koaLogger())

//
app.keys = ['session test secret hurr76128678216'];
const CONFIG = {
    key: 'koa:sess3172563712', /** (string) cookie key (default is koa:sess) */
    /** (number || 'session') maxAge in ms (default is 1 days) */
    /** 'session' will result in a cookie that expires when session/browser is closed */
    /** Warning: If a session cookie is stolen, this cookie will never expire */
    maxAge: 2 * 86400000,  // 48小时有效期
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

// 配置ctx.body解析中间件
app.use(bodyParser({
    onerror: function (err, ctx) {
        ctx.throw('body parse error', 422);
    }
}))

app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*')
    await next()
});

// 初始化路由中间件
app.use(routers.routes()).use(routers.allowedMethods)

// 监听启动端口
app.listen( config.app.http_port, '0.0.0.0')
console.log(`the server is start at port ${config.app.http_port}`)