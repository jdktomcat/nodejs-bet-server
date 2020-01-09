import Base from './base.js';
import { think } from 'thinkjs';
import { debug, log } from 'util';
import { sha256 } from 'js-sha256';
var redis = require('redis');


export default class extends Base {
    async energyAction() {
        let role = this.ctx.param('role')
    
        if (Number(role) != 0) {
            return this.success([])
        }
    
        let tmodel = this.model("dice_events_roll_0", "mysql2")
    
        let nowTime = new Date().getTime() 
        let lastTime = nowTime - 86400000

        let totalEnergySql = "select sum(energy) energy from dice_txs where block_num >= (select min(block_num) from dice_block where block_ts >= " + lastTime + ");"

        let lessThan8wEnergySql = "select sum(energy) energy from dice_txs where energy <= 80000 and block_num >= (select min(block_num) from dice_block where block_ts >= " + lastTime + ");"
    
        let maxEnergySql = "select max(energy) energy from dice_txs where block_num >= (select min(block_num) from dice_block where block_ts >= " + lastTime + ");"
        let rankEnergySql = "select block_num, tx_id, energy from dice_txs where energy > 100000 and block_num >= (select min(block_num) from dice_block where  block_ts >= " + lastTime + ") order by energy desc limit 20;"
    
    
        let totalEnergy = await tmodel.query(totalEnergySql)
        let lessThan8wEnergy = await tmodel.query(lessThan8wEnergySql)
        let maxEnergy = await tmodel.query(maxEnergySql)
        let rankEnergy = await tmodel.query(rankEnergySql)
    
        this.success({
            totalEnergy : totalEnergy[0].energy, 
            lessThan8wEnergy : lessThan8wEnergy[0].energy, 
            maxEnergy : maxEnergy[0].energy, 
            rankEnergy : rankEnergy, 
        })
      }

      async chartsAction() {
        let role = this.ctx.param('role')
    
        if (Number(role) != 0) {
            return this.success([])
        }
    
        let tmodel = this.model("histline")
    
        let nowTime = Math.floor(new Date().getTime() / 1000)
        let todatStime = (nowTime - nowTime % 86400 - 8 * 3600)
        if (nowTime % 86400 >= 16 * 3600) {
            todatStime = todatStime + 86400 
        }

        let stime = (todatStime - 7 * 86400)

        let sql = "select date,amount,profit,cnt,users,newuser from histline where date >= " + stime + " order by date;"

        let result = await tmodel.query(sql)

        this.success({
            result : result
        })
      }
}