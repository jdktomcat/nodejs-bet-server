const path = require('path')
const Koa = require('koa2')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')

const config = require('./src/configs/config')
const routers = require('./src/routers/index')

const cors = require('koa-cors');

const app = new Koa()
app.use(cors());


// 配置控制台日志中间件
app.use(koaLogger())

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