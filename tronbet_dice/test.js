// const tronNodePool = require('./src/service/tronNodePool');
// const gameDice = require('./gameDice');
const config = require('./src/configs/config');
const _ = require('lodash')._;
const tronUtil = require('./src/utils/tronUtil');
const TronWeb = require('tronweb');

async function fix() {
    await tronNodePool.init();
    let t_getAccount = setTimeout(() => {
        clearTimeout(t_getAccount);
        gameDice.getOrder("TAHAyhFkRz37o6mYepBtikrrnCNETEFtW5", null, (err, res) => {
            console.log(err, res);
        });

        // tronUtil.tronQuery('41734c2f23ab41c52308d1206c4eb5fe8e124e6898',"getPoolAnteBalance()",[],null,"null",(err,res)=>{
        //     // console.log(err,res)
        //     console.log(tronUtil.hexStringToBigNumber(res).div(1e6).toNumber());
        // })

        // tronUtil.tronQuery("41734c2f23ab41c52308d1206c4eb5fe8e124e6898", "getDevAnteCacheBalance()", [],null,null, (err, result) => {
        //     if (err) {
        //         console.error("getDevAnte anteCache => error ");
        //     }
        //     let anteCache = tronUtil.hexStringToBigNumber(result);
        //     // loggerDefault.info("anteCache",anteCache.toNumber());
        //     tronUtil.tronQuery("410e6734fa49fa5cada81bd0f03a2d69013df32fe9", 'balanceOf(address)', [{ type: 'address', value: "TTVXdGayK5KdURA4gMfa6eDZtMwqUDc9ZT" }],null,null,(err, result) => {
        //         if (err) {
        //             console.info("getDevAnte anteAmount => error ");
        //         }
        //         let anteAmount = tronUtil.hexStringToBigNumber(result);
        //         console.log(anteCache.plus(anteAmount).div(1e6).toNumber());
        //     });
        // });
    }, 10000);
}

// fix();

console.log(tronUtil.hextoString("524556455254206f70636f6465206578656375746564"));

// const redis = require("ioredis").createClient(
//     {
//         host: config.redisConfig.host,
//         port: config.redisConfig.port,
//         password: config.redisConfig.pwd,
//         db: config.redisConfig.db
//     }
// );

// redis.hget("player:logs:TR8rNhtAnPckjSfakVJzL1yHVV8e8391fz",838,(err,result)=>{
//     if (result != null) {
//         console.log("return");
//     }
// })

// console.log(TronWeb.address.fromHex('41eb8f23b15acbc0245a4dbbd820b9bde368b02d61'))
