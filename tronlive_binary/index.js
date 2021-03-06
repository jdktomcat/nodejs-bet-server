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
    try {
        await next()
    } catch (e) {
        console.log("error--->",e.toString())
        ctx.status = 500;
        ctx.body = {
            code : 500,
            message: e.toString()
        }
    }
})

app.use(routers.routes()).use(routers.allowedMethods)

// 监听启动端口
app.listen( config.app.http_port, '0.0.0.0')
console.log(`the server is start at port ${config.app.http_port}`)