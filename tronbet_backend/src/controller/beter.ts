import Base from './base.js';
import { think } from 'thinkjs';
import { debug, log } from 'util';
import { sha256 } from 'js-sha256';
var xhr = require('axios')

const redis = require("redis").createClient(
    {
        host: think.config('redisHost'),
        port: think.config('redisPort'),
        password: think.config('redisPwd'),
        db: 1
    }
);

export default class extends Base {
  async overviewAction() {
    const method = this.method.toLowerCase();
    if (method === "options") {
      console.error(method)
      return this.success('ok');
    }
    let addr = this.post('addr')
    if (!addr) {
        return this.fail('address error')
    }

    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    if(pattern.test(addr)){
        return this.fail(405, 'args error')
    }

    let totalSql = "select total / 1000000 + moon_total / 1000000 + wheel_total / 1000000 as total from dice_players where addr = '" + addr + "'"
    let tmodel = this.model("dice_events_roll_0", "mysql2")

    let dividSql = "select sum(trx / 1000000) trx from (select sum(trx) trx from ante_dividends where addr = '{0}' union all select sum(trx) trx from ante_dividends_v1 where addr = '{1}') a"
    dividSql = dividSql.replace('{0}', addr)
    dividSql = dividSql.replace('{1}', addr)

    let totalAmount = 0
    let dividAmount = 0
    let lastDividAmount = 0

    // let totalMoonSql = "select sum(amount / 1000000) as total from tron_bet_admin.moon_user_order where addr = '" + addr + "'"
    // let totalMoon = await tmodel.query(totalMoonSql)

    let lastDividSql = "select trx / 1000000 trx from ante_dividends_v1 where addr = '" + addr + "' and total_trx = (select total_trx from ante_ver_v1 where total_trx > 10000000000 order by ver desc limit 1)" 
    let lastDivid = await tmodel.query(lastDividSql)
    let total = await tmodel.query(totalSql)
    if (!think.isEmpty(total)) {
        totalAmount += total[0].total
    }

    let lv = this.service("exp").getLv(totalAmount);

    // if (!think.isEmpty(totalMoon)) {
    //     totalAmount += totalMoon[0].total
    // }

    let divid = await tmodel.query(dividSql)
    if (!think.isEmpty(divid)) {
        dividAmount = divid[0].trx
    }

    if(!think.isEmpty(lastDivid)){
        lastDividAmount = lastDivid[0].trx
    }
    this.success({
        total : totalAmount,
        divid : dividAmount,
        lv : lv,
        lastDivid : lastDividAmount
    })
  }

  async hget(key, field) {
    return new Promise((resolve, reject) => {
        redis.hget(key, field, (err, ret) => {
            if (err) reject(err);
            resolve(ret);
        });
    })
  }

  async searchAction(){
    const method = this.method.toLowerCase();
    if (method === "options") {
      console.error(method)
      return this.success('ok');
    }

    let addr = this.post('addr')
    let game = this.post('game')
    let result = this.post('result')
    let page = this.post('page')
    let num = this.post('num')

    console.log(this.post())

    if (isNaN(page)){
        return this.fail(405, 'args error')
    }
    page = Number(page)


    if (isNaN(num)){
        return this.fail(405, 'args error')
    }
    num = Number(num)

    let start = (page - 1) * num

    if (!addr) {
        return this.fail('address error')
    }

    // result 0 -> all, 1 -> win, 2 -> lose
    // game   0 -> all, 1 -> dice, 2 -> monn

    if (isNaN(result)){
        return this.fail(405, 'args error')
    }
    result = Number(result)


    if (isNaN(game)){
        return this.fail(405, 'args error')
    }
    game = Number(game)

    if (result != 0 && result != 1 && result != 2) {
        return this.fail('result error')
    }

    if (game != 0 && game != 1 && game != 2 && game != 3) {
        return this.fail('address error')
    }

    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    if(pattern.test(addr)){
        return this.fail(405, 'args error')
    }

    let where = ''
    
    let tmodel = this.model("dice_events_roll_0", "mysql2")

    if (game == 1) {
        if (result == 1) {
            where = " and payout_sun > 0 "
        } else if (result == 2) {
            where = " and payout_sun = 0 "
        }
        let dataSql = "select round, amount / 1000000 amount, addr, crashAt, autoAt, escapeAt, win / 1000000 win, ts, sign, minedAnte, tx_id, 2 types from tron_bet_admin.moon_user_order where addr = '{0}' {1} order by ts desc limit {2}, 20"
        dataSql = dataSql.replace('{0}', addr)
        where = where.replace('{0}', addr)
        dataSql = dataSql.replace('{1}', where)
        dataSql = dataSql.replace('{2}', start.toString())
        
        let totalSql = "select count(1) order_id from tron_bet_admin.moon_user_order where addr = '{0}' {1}"
        totalSql = totalSql.replace('{0}', addr)
        totalSql = totalSql.replace('{1}', where)
        let final = await tmodel.query(dataSql)
        let total = await tmodel.query(totalSql)
        if (think.isEmpty(total)) {
            total = 0
        } else {
            total = total[0].order_id
        }
        return this.success({
            data  : final,
            total : total
        })
    } else if (game == 0){
        if (result == 1) {
            where = " and payout_sun > 0 "
        } else if (result == 2) {
            where = " and payout_sun = 0 "
        }
        let dataSql = "select  a.*, b.tx_id, b.ts, b.sign, 1 types from (select addr, order_id, direction, number, roll, amount_sun, payout_sun from dice_events_v2 where addr = '{0}' {1} order by order_id desc limit 20000) a join (select tx_id, addr, ts,order_id, sign from tron_bet_admin.dice_user_order where addr = '{0}' order by order_id desc limit 20000) b on a.addr = b.addr and a.order_id = b.order_id  order by a.order_id desc limit {2}, 20"
        dataSql = dataSql.replace('{0}', addr)
        dataSql = dataSql.replace('{0}', addr)
        dataSql = dataSql.replace('{1}', where)
        dataSql = dataSql.replace('{2}', start.toString())
        let totalSql = "select count(1) order_id from dice_events_v2 where addr = '{0}' {1}"
        totalSql = totalSql.replace('{0}', addr)
        totalSql = totalSql.replace('{1}', where)
        let final = await tmodel.query(dataSql)
        let total = await tmodel.query(totalSql)
        if (think.isEmpty(total)) {
            total = 0
        } else {
            total = total[0].order_id
        }
        return this.success({
            data  : final,
            total : total
        })
    } else if (game == 2) {
        if (result == 1) {
            where = " and win > 0 "
        } else if (result == 2) {
            where = " and win = 0 "
        }
        let dataSql = "select round, amount / 1000000 amount, addr, roll, number, win / 1000000 win,result_hash as hash, salt, luckyNum, ts, sign, minedAnte, tx_id, 3 types from tron_bet_admin.wheel_user_order where addr = '{0}' {1} order by ts desc limit {2}, 20"
        dataSql = dataSql.replace('{0}', addr)
        dataSql = dataSql.replace('{1}', where)
        dataSql = dataSql.replace('{2}', start.toString())
        let totalSql = "select count(1) order_id from tron_bet_admin.wheel_user_order where addr = '{0}' {1}"
        totalSql = totalSql.replace('{0}', addr)
        totalSql = totalSql.replace('{1}', where)
        let final = await tmodel.query(dataSql)
        let total = await tmodel.query(totalSql)
        if (think.isEmpty(total)) {
            total = 0
        } else {
            total = total[0].order_id
        }
        return this.success({
            data  : final,
            total : total
        })
    } else if (game == 3) {
        if (result == 1) {
            where = " and winAddr = '{0}' "
        } else if (result == 2) {
            where = " and winAddr != '{0}' "
        }
        let dataSql = "select room_id, amount / 1000000 amount, status, player1,player2, player3, player4, roll,settleTx tx_id, '{0}' as addr, endTs ts, winAddr, win / 1000000 win, playerCnt, player1Tx, player2Tx, player3Tx, player4Tx, 4 types from tron_bet_admin.wheel_solo_order where status > 0 and (player1 = '{0}' or player2 = '{0}' or player3 = '{0}' or player4 = '{0}') {1} order by room_id desc limit {2}, 20"
        dataSql = dataSql.replace('{0}', addr)
        dataSql = dataSql.replace('{0}', addr)
        dataSql = dataSql.replace('{0}', addr)
        dataSql = dataSql.replace('{0}', addr)
        dataSql = dataSql.replace('{0}', addr)
        where = where.replace('{0}', addr)
        console.log('where-------', where)
        dataSql = dataSql.replace('{1}', where)
        dataSql = dataSql.replace('{2}', start.toString())
        let totalSql = "select count(1) order_id from tron_bet_admin.wheel_solo_order where (player1 = '{0}' or player2 = '{0}' or player3 = '{0}' or player4 = '{0}') {1}"
        totalSql = totalSql.replace('{0}', addr)
        totalSql = totalSql.replace('{0}', addr)
        totalSql = totalSql.replace('{0}', addr)
        totalSql = totalSql.replace('{0}', addr)
        totalSql = totalSql.replace('{1}', where)
        console.log(dataSql)
        let final = await tmodel.query(dataSql)
        let total = await tmodel.query(totalSql)
        let finals = []
        for (let one of final) {
            let tmp = JSON.parse(JSON.stringify(one))
            let _name1 = await this.hget("player:info:" + one.player1, "name")
            if (_name1 && _name1 != '') {
                tmp.name1 = _name1;
            } else {
                tmp.name1 = tmp.player1
            }

            let _name2 = await this.hget("player:info:" + tmp.player2, "name")
            if (_name2 && _name2 != '') {
                tmp.name2 = _name2;
            } else {
                tmp.name2 = tmp.player2
            }

            let _name3 = await this.hget("player:info:" + tmp.player3, "name")
            if (_name3 && _name3 != '') {
                tmp.name3 = _name3;
            } else {
                tmp.name3 = tmp.player3
            }

            let _name4 = await this.hget("player:info:" + tmp.player4, "name")
            if (_name4 && _name4 != '') {
                tmp.name4 = _name4;
            } else {
                tmp.name4 = tmp.player4
            }
            finals.push(tmp)
        }
        if (think.isEmpty(total)) {
            total = 0
        } else {
            total = total[0].order_id
        }
        return this.success({
            data  : finals,
            total : total
        })
    }
  }

  async anteburntAction () {
    
    let now = new Date().getTime()
    let key = 'ante_burnt_log:' + Math.floor(now / 60000)
    let res = await this.cache(key)
    if (res) {
        return this.success(JSON.parse(res))
    }
    let burn_log = this.model('ante_burnt_log')
    let result = await burn_log.field('types, amount / 1000000 as amount, ts, tx_id').order('ts desc').limit(30).select()
    await this.cache(key, JSON.stringify(result))
    return this.success(result)
  }

  async userOverViewInfoAction() {
    const method = this.method.toLowerCase();
    if (method === "options") {
      console.error(method)
      return this.success('ok');
    }
    let addr = this.get('addr') || this.post('addr')
    if (!addr) {
        return this.fail('address error')
    }

    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    if(pattern.test(addr)){
        return this.fail(405, 'args error')
    }

    let img = 10000
    let lv = '0'
    let _img = await this.hget("player:info:" + addr, "img")
    if (_img && _img != '') {
        img = _img;
    }

    
    let _lv = await this.hget("player:info:" + addr, "lv")
    if (_lv && _lv != '') {
        lv = _lv;
    }

    this.success({img, lv})
  }
}