const Koa = require('koa2')
const bodyParser = require('koa-bodyparser')
const koaLogger = require('koa-logger')

const config = require('./src/configs/config')
const routers = require('./src/routers/index')

const {cronEvent} = require('./src/service/cron')
const userinfo = require('./src/model/userinfo')

const redis = require("redis").createClient(
    {
        host: config.redisConfig.host,
        port: config.redisConfig.port,
        password: config.redisConfig.pwd,
        db: config.redisConfig.db
    }
);

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
app.listen( config.app.http_port, '0.0.0.0')

// cronEvent.emit('dailyRankReward')
// cronEvent.emit('totalRankReward')

redis.on("ready", function () {
    redis.subscribe("game_message");
    redis.subscribe("chat1");
    console.log("订阅成功。。。");
});

redis.on("message", async (channel, message) => {
    console.log("我接收到信息了" + message);
    await userinfo.betLuckyUser(message)
});

console.log(`the server is start at port ${config.app.http_port}`)