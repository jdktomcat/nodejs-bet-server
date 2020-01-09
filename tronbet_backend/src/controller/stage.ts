import Base from './base.js';
import { think } from 'thinkjs';
import { debug, log } from 'util';
import { sha256 } from 'js-sha256';
var redis = require('redis');
var TronWeb = require('tronweb')
var xhr = require('axios')

export default class extends Base {
    async overviewAction() {
        let method = this.method.toLowerCase();
        if (method === "options") {
            console.error(method)
            return this.success('ok');
        }
    
        let role = this.ctx.param('role')
    
        if (Number(role) != 0) {
            return this.success([])
        }
    
        let game = this.post('game')
    
        console.log(game, '------------------------')
        if (game != 'All' && game != 'Dice' && game != 'Moon' && game != 'Ring' && game != 'Duel') {
            return this.success([])
        }
        let tmodel = this.model("dice_events_roll_0", "mysql2")
        
        let initTs = 1556164800
        let now = Math.floor(new Date().getTime() / 1000)
        let startTs = Math.floor((now - initTs) / 86400) * 86400 + 1556164800
        if (game == 'dice') {
            let minSql = "select * from tron_bet_admin.dice_player_order where ts >= %s limit 1"
            let minSqlParse = await tmodel.parseSql(minSql, startTs * 1000)
            let result =  await tmodel.query(minSqlParse)
        }
    }
}