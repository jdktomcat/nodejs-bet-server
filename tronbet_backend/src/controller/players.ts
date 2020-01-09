import Base from './base.js';
import { think } from 'thinkjs';
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
    async userdataAction() {
        const method = this.method.toLowerCase();
        if (method === "options") {
          console.error(method)
          return this.success('ok');
        }
        let addr = this.post('useraddr')

        let role = this.ctx.param('role')

        if (Number(role) != 0) {
            return this.success([])
        }
        console.log(addr, '----------')
        if (!addr) {
            return this.fail('address error')
        }
        let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
        if(pattern.test(addr)){
            return this.fail(405, 'args error')
        }


        let playersModel = this.model('dice_players', 'mysql2')

        let totalSql = "select total / 1000000 diceTotal,  (payout / 1000000 - total / 1000000) as diceProfit, moon_total / 1000000 moonTotal, (moon_payout / 1000000 - moon_total  / 1000000) moonProfit, wheel_total / 1000000 wheelTotal, (wheel_payout / 1000000 - wheel_total / 1000000) wheelProfit from dice_players where addr = '%s'"
        let sqlObj = await playersModel.parseSql(totalSql, addr)

        let result =  await playersModel.query(sqlObj)
        this.success(result[0])
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

        let role = this.ctx.param('role')

        if (Number(role) != 0) {
            return this.success([])
        }
    
        let addr = this.post('useraddr')
        let game = this.post('game')
        let result = 0
        let page = this.post('page')
        let num = 20
    
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
    
        if (game < 0 || game > 7) {
            return this.fail('address error')
        }
    
        let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
        if(pattern.test(addr)){
            return this.fail(405, 'args error')
        }
    
        let where = ''
        
        let tmodel = this.model("dice_events_roll_0", "mysql2")
        // let tmodel = this.model("baseball", "mysql")
    
        if (game == 1) {
            if (result == 1) {
                where = " and win > 0 "
            } else if (result == 2) {
                where = " and win = 0 "
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
        } else if (game == 4) {
            if (result == 1) {
                where = " and win > 0 "
            } else if (result == 2) {
                where = " and win = 0 "
            }
            let dataSql = "select order_id, addr, amount / 1000000 amount, roll, number, win / 1000000 win,result_tx as hash, ts, sign,direction, 5 types from tron_bet_wzc.trc20_dice_order where addr = '{0}' {1} order by order_id desc limit {2}, 20"
            dataSql = dataSql.replace('{0}', addr)
            dataSql = dataSql.replace('{1}', where)
            dataSql = dataSql.replace('{2}', start.toString())
            console.log('XXXXXXXXXXXXXXXXXXXXXXXXXX')
            console.log(dataSql)
            let totalSql = "select count(1) order_id from tron_bet_wzc.trc20_dice_order where addr = '{0}' {1}"
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
        } else if (game == 5) {
            if (result == 1) {
                where = " and win > 0 "
            } else if (result == 2) {
                where = " and win = 0 "
            }
            let dataSql = "select order_id, addr, amount / 1000000 amount, roll, number, win / 1000000 win,result_tx as hash, ts, sign,direction, 6 types from tron_bet_wzc.trc10_dice_order_v2 where addr = '{0}' {1} order by order_id desc limit {2}, 20"
            dataSql = dataSql.replace('{0}', addr)
            dataSql = dataSql.replace('{1}', where)
            dataSql = dataSql.replace('{2}', start.toString())
            console.log('XXXXXXXXXXXXXXXXXXXXXXXXXX')
            console.log(dataSql)
            let totalSql = "select count(1) order_id from tron_bet_wzc.trc10_dice_order_v2 where addr = '{0}' {1}"
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
        }
      }
}