const Koa = require('koa2')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')
const config = require('./src/configs/config')
const routers = require('./src/routers/index')
const activity = require('./src/service/activity')
//定时任务
require("./src/schedule/reward_event")

const redis = require("redis").createClient({
        host: config.redisConfig.host,
        port: config.redisConfig.port,
        password: config.redisConfig.pwd,
        db: config.redisConfig.db
    }
)

const app = new Koa()


// 配置控制台日志中间件
app.use(koaLogger())

app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    await next();
});

// 配置ctx.body解析中间件
app.use(bodyParser())

// 初始化路由中间件
app.use(routers.routes()).use(routers.allowedMethods)

// 监听启动端口
console.log("listening port ",config.app.http_port)
app.listen( config.app.http_port, '0.0.0.0')


redis.on("ready", function () {
    redis.subscribe("game_message")
    redis.subscribe("chat1")
    console.log("subscribe success....")
});

/**
 * 订阅消息测试
 */
redis.on("message", async (channel, message) => {
    console.log("receive message:" + message)
    await activity.handleMsg(message)
});

console.log(`the server is start at port ${config.app.http_port}`)
