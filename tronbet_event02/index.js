const Koa = require('koa2')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')
const config = require('./src/configs/config')
const routers = require('./src/routers/index')
const cronEvent = require('./src/service/cron')
const activity = require('./src/service/activity')
const app = new Koa()
/**
 * redis连接
 * @type {RedisClient}
 */
const redis = require("redis").createClient({
        host: config.redisConfig.host,
        port: config.redisConfig.port,
        password: config.redisConfig.pwd,
        db: config.redisConfig.db
    }
);

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
app.listen(config.app.http_port, '0.0.0.0')

// 扫描
cronEvent.emit('scanBet')
cronEvent.emit('scanDuel')
cronEvent.emit('scanPoker')

// 同步
cronEvent.emit('syncRank')

// 开奖
cronEvent.emit("draw")

/**
 * 连接完成回调
 */
redis.on("ready", function () {
    redis.subscribe("game_message");
    redis.subscribe("chat1");
    console.log("redis subscribe bet info channel success 。。。");
})

/**
 * 处理消息
 */
redis.on("message", async (channel, message) => {
    console.log("receive from channel message：" + message)
    await activity.handleMsg(message)
})

process.on('uncaughtException', function (e) {
    /*处理异常*/
    console.log('process occurs some exception:' + e.message)
})

console.log(`the server is start at port ${config.app.http_port}`)
