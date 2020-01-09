const BigNumber = require('bignumber.js');

const db = require('./src/utils/utilMysql');
const exec = db.exec;
const execTrans = db.execTrans;

//获取某玩家单个订单记录
async function getPlayerLogSingle(conn) {
    // console.log(arguments);
    // let sql = "select * from dice_events_v2 where addr = 'THatWvn35xiuyXLc19MZHXTwRhqk56TA87' and order_id >= 8821;";
    let sql = "select * from dice_events_v2 where addr = 'TALSczoDZC5TfwwLriNbgPYC153nysBPhP' and order_id >=  9631;"
    let params = [];
    let fun = conn == null ? exec : execTrans;
    let ret = await fun(sql, params, conn);
    return ret;
}

async function test (){
    let val = new BigNumber(0);
    console.log(val.plus(3).toNumber())
    let list =await getPlayerLogSingle();
    for(let i=0;i<list.length;i++){
        if(i>0){
            if(list[i].number === list[i-1].number && list[i].roll === list[i-1].roll){
                let payout = list[i].payout_sun;
                // console.log("","order#:",list[i-1].order_id,(list[i-1]===0?"Over":"Under"),list[i-1].number,"Lucky Number:",list[i-1].roll,"Amount:",list[i-1].amount_sun/1e6+" trx","Payout:",list[i-1].payout_sun/1e6);
                console.log("","order#:",list[i].order_id,(list[i]===0?"Over":"Under"),list[i].number,"Lucky Number:",list[i].roll,"Amount:",list[i].amount_sun/1e6+" trx","Payout:",list[i].payout_sun/1e6);
                let x = 0;
                if(payout ===0){
                    x = list[i].amount_sun;
                }else{
                    x = -(payout - list[i].amount_sun);
                }
                val = val.plus(x);
                console.log("total ", x/1e6 );
            }
        }
    }
    console.log("total:",val.div(1e6).toNumber() + " TRX");
}

test();

