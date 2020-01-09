import { think } from "thinkjs";
import model from "src/model";

// invoked in master
var redis = require("redis");  
var client = require("redis").createClient(
    {
        host: 'localhost',
        port: think.config('redisPort'),
        password: think.config('redisPwd'),
        db: 1
    }
); 
var client1 = require("redis").createClient(
    {
        host: 'localhost',
        port: think.config('redisPort'),
        password: think.config('redisPwd'),
        db: 1
    }
);

let dealWithMsg = null

think.messenger.on('consumeEvent', (data) => {
    // 该回调函数只会在一个进程下执行
    
});

client.on("ready", function () {
    //订阅消息
    client.subscribe("game_message");
    client.subscribe("chat1");
    console.log("订阅成功。。。");
});

client.on("error", function (error) {
    console.log("Redis Error " + error);
});

//监听订阅成功事件
client.on("subscribe", function (channel, count) {
    console.log("client subscribed to " + channel + "," + count + "total subscriptions");
});

//收到消息后执行回调，message是redis发布的消息
client.on("message", async (channel, message) => {
    console.log("我接收到信息了" + message);
    await dealWithMsg(message);
});

//监听取消订阅事件
client.on("unsubscribe", function (channel, count) {
    console.log("client unsubscribed from" + channel + ", " + count + " total subscriptions")
});

think.app.on("appReady", async () => {
    // 使用 think.model 实例化 model
    let now = new Date().getTime()
    if (now > 1546401600000) {
        return
    }
    let betModel = think.model('mysql/chris_bet_order')
    console.log('appredadd------------------')
    dealWithMsg = async (message) => {
        console.log(think.model)
        try {
            let info = JSON.parse(message)
            let now = new Date().getTime()
            await betModel.startTrans()
            let order_id = info.order_id
            if(info.game_type == 'moon') {
                order_id = 10000000 + info.order_id
            } else if (info.game_type == 'dice'){
                console.log('----do nothing---')
            }
            await betModel.add({
                addr : info.addr,
                bet_id : order_id,
                ts : now,
                num : 1
            })
            let sql = "insert into chris_box(addr, num) values ('%s',1) ON DUPLICATE KEY update num = num + 1;"
            let sqlObj = await betModel.parseSql(sql, info.addr)
            await betModel.query(sqlObj)
            await betModel.commit()
        } catch (error) {
            await betModel.rollback()
            console.log('000000')
        }
    }
});