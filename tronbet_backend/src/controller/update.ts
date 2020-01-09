import Base from './base.js';
import { think } from 'thinkjs';
import { debug, log } from 'util';
import { sha256 } from 'js-sha256';

const redis = require("redis").createClient(
    {
        host: '127.0.0.1',
        port: '6379',
        password: '',
        db: 1
    }
);

const TRX_RANK = [0.5, 0.25, 0.125, 0.0625, 0.0313, 0.0156, 0.0078, 0.0039, 0.0020, 0.001]

const rewardNewConf = [
    {trx : 1000, ante :0},
    {trx : 500, ante :0},
    {trx : 250, ante :0 },
    {trx : 125, ante :0   },
    {trx : 62, ante :0    },
    {trx : 31, ante :0    },
    {trx : 15, ante :0    },
    {trx : 7, ante :0     },
    {trx : 3, ante :0     },
    {trx : 1, ante :0     },
    {trx : 0, ante :0     },
    {trx : 0, ante :0     },
    {trx : 0, ante :0      },
    {trx : 0, ante :0      },
    {trx : 0, ante :0      },
    {trx : 0, ante :0      },
    {trx : 0, ante :0      },
    {trx : 0, ante :0       },
    {trx : 0, ante :0       },
    {trx : 0, ante :0       },
]

const rewardConf = [
    {trx : 8000, ante :0},
    {trx : 4000, ante :0},
    {trx : 2000, ante :0 },
    {trx : 1000, ante :0   },
    {trx : 500, ante :0    },
    {trx : 250, ante :0    },
    {trx : 125, ante :0    },
    {trx : 62, ante :0     },
    {trx : 31, ante :0     },
    {trx : 15, ante :0     },
    {trx : 0, ante :0     },
    {trx : 0, ante :0     },
    {trx : 0, ante :0      },
    {trx : 0, ante :0      },
    {trx : 0, ante :0      },
    {trx : 0, ante :0      },
    {trx : 0, ante :0      },
    {trx : 0, ante :0       },
    {trx : 0, ante :0       },
    {trx : 0, ante :0       },
];

export default class extends Base {
    async noticeAction() {
        const method = this.method.toLowerCase();
        if (method === "options") {
          return this.success('ok');
        }

        let role = this.ctx.param('role')


        if (Number(role) != 0) {
            return this.success([])
        }

        let data = this.post('data')
        let language = this.post('cate')
        let title = this.post('title')


        if (data.length == 0) {
            return this.fail(408, 'content must not be empty')
        }

        let updates = this.model('update_notice')

        let now = Number(new Date().getTime() / 1000)

        await updates.add({title : title, language : language, content : data, update_time : now})
        this.success('123')
    }


    async infoAction() {
        let language = this.get('lang')

        let updates = this.model('update_notice')

        let now = Number(new Date().getTime() / 1000)

        let data = await updates.where({language : language}).order('id desc').limit(1).select()
        if (data[0] == undefined) {
            data = await updates.where({language : 'en'}).order('id desc').limit(1).select()
        }
        if (data[0] == undefined) {
            data[0] = {
                content: '',
                id: 0,
                language: 'en',
                title: 'No Announcement',
                update_time: 0,
            }
        }
        this.success(data[0])
    }

    async getActEndTimeAction() {
        // let act_end = this.model('act_end')
        // let data = await act_end.order('id desc').limit(1).select()
        let now = Math.floor(new Date().getTime() / 1000)
        this.success({'now' : now, 'end' : now})
    }


    async hget(key, field) {
        return new Promise((resolve, reject) => {
            redis.hget(key, field, (err, ret) => {
                if (err) reject(err);
                resolve(ret);
            });
        })
    }

    async min(a, b) {
        return a > b ? b : a
    }


    async gettksrankAction(){
        this.fail(1002, '')
    }

    async dailyrankAction() {
        let addr = this.post('addr')

        if (!addr) {
            addr = 'abc'
        }

        if(!this.checkStrParam(addr)){
            addr = 'abc'
        }

        if (addr.length != 34) {
            addr = 'abc'
        }

        // let scoreModel = this.model('rank_list_v1',  "mysql2")
        let now = new Date().getTime()
        let key = 'dailyrank:' + Math.floor(now / 27001)
        let res = await this.cache(key)
        if (res) {
            console.log('using cache ==> key', key)
            return this.success(JSON.parse(res))
        }
        else {
            console.log('using cache ==> key1', 'dailyrank:' + (Math.floor(now / 27001) - 1))
            let res = await this.cache('dailyrank:' + (Math.floor(now / 27001) - 1))
            return this.success(JSON.parse(res))
        }
    }


    async lastrank(addr) {
        if (!addr) {
            addr = 'abc'
        }

        if(!this.checkStrParam(addr)){
            addr = 'abc'
        }

        if (addr.length != 34) {
            addr = 'abc'
        }

        let scoreModel = this.model('rank_list_v1',  "mysql2")
        let now = new Date().getTime()

        let result1 = await scoreModel.where({start_ts : {"<=" : now}, end_ts : {">=" : now}}).limit(1).select()
        let round = 0
        if (think.isEmpty(result1)) {
            return {rank : [], time : 0}
        } else {
            round = result1[0].round - 1
        }

        if (round == 2286) {
            return await this.lastrankOld(addr)
        }

        let result = await scoreModel.where({round : round}).order('cur_total_sun - total_sun_at_start desc').limit(10).select()

        if (think.isEmpty(result)) {
            return await this.lastrankOld(addr)
        }

        let final = []

        let lastTime = 0

        for (let i = 0;i< result.length; i++){
            let name = result[i].addr
            let img = 10000
            let lv = 0
            let _img = await this.hget("player:info:" + name, "img")
            if (_img && _img != '') {
                img = _img;
            }

            let _lv = await this.hget("player:info:" + name, "lv")
            if (_lv && _lv != '') {
                lv = _lv;
            }

            let _name = await this.hget("player:info:" + name, "name")
            if (_name && _name != '') {
                name = _name;
            }

            let tmpReward = {trx : rewardNewConf[i].trx, ante : rewardNewConf[i].ante}
            let addtion = Math.ceil(result[i].all_users_bet_trx * 0.00068 * (TRX_RANK[i] || 0));
            tmpReward.trx += addtion

            let tmp = {
                rank : i + 1,
                reward : tmpReward,
                name : name,
                amont :(result[i].cur_total_sun - result[i].total_sun_at_start) / 1e6,
                addr : result[i].addr,
                lv : lv,
                img : img,
            }

            lastTime = result[i].end_ts
            final.push(tmp)
        }

        if (result.length < 10) {
            let tmpLength = result.length
            for (let i=0; i< 10 - tmpLength; i++){
                let tmpReward = {trx : rewardNewConf[tmpLength + i].trx, ante : rewardNewConf[tmpLength + i].ante}
                let addtion = Math.ceil(result[0].all_users_bet_trx * 0.00068 * (TRX_RANK[tmpLength + i] || 0));
                tmpReward.trx += addtion
                final.push({rank : tmpLength + 1 + i, amont : 0, addr : '-', reward : tmpReward, name : '-', lv : 0, img : 10000})
            }
        }
        return {rank : final, time : lastTime}
    }


    async lastrankOld(addr) {
        if (!addr) {
            addr = 'abc'
        }

        if(!this.checkStrParam(addr)){
            addr = 'abc'
        }

        if (addr.length != 34) {
            addr = 'abc'
        }

        let scoreModel = this.model('rank_list_v1',  "mysql2")
        let now = new Date().getTime()

        let result1 = await scoreModel.where({start_ts : {"<=" : now}, end_ts : {">=" : now}}).limit(1).select()
        let round = 0
        if (think.isEmpty(result1)) {
            return {rank : [], time : 0}
        } else {
            round = result1[0].round - 1
        }

        let result = await scoreModel.where({round : round}).order('cur_total_sun - total_sun_at_start desc').limit(10).select()

        let final = []

        let lastTime = 0

        for (let i = 0;i< result.length; i++){
            let name = result[i].addr
            let img = 10000
            let lv = 0
            let _img = await this.hget("player:info:" + name, "img")
            if (_img && _img != '') {
                img = _img;
            }

            let _lv = await this.hget("player:info:" + name, "lv")
            if (_lv && _lv != '') {
                lv = _lv;
            }

            let _name = await this.hget("player:info:" + name, "name")
            if (_name && _name != '') {
                name = _name;
            }

            let tmpReward = {trx : rewardConf[i].trx, ante : rewardConf[i].ante}
            // let addtion = Math.ceil(result[i].all_users_bet_trx * 0.0005 * (TRX_RANK[i] || 0));
            let addtion = 0
            tmpReward.trx += addtion

            let tmp = {
                rank : i + 1,
                reward : tmpReward,
                name : name,
                amont :(result[i].cur_total_sun - result[i].total_sun_at_start) / 1e6,
                addr : result[i].addr,
                lv : lv,
                img : img,
            }

            lastTime = result[i].end_ts
            final.push(tmp)
        }

        if (result.length < 10) {
            let tmpLength = result.length
            for (let i=0; i< 10 - tmpLength; i++){
                let tmpReward = {trx : rewardConf[i].trx, ante : rewardConf[i].ante}
                // let addtion = Math.ceil(result[i].all_users_bet_trx * 0.0005 * (TRX_RANK[i] || 0));
                tmpReward.trx += 0
                final.push({rank : tmpLength + 1 + i, amont : 0, addr : '-', reward : tmpReward, name : '-', lv : 0, img : 10000})
            }
        }
        return {rank : final, time : lastTime}
    }

    async cronrankAction() {
        if(!this.isCli) return this.fail(1000, 'deny')
        let addr = 'abc'

        if (!addr) {
            addr = 'abc'
        }

        if(!this.checkStrParam(addr)){
            addr = 'abc'
        }

        if (addr.length != 34) {
            addr = 'abc'
        }

        let scoreModel = this.model('rank_list_v1',  "mysql2")
        let now = new Date().getTime()
        let key = 'dailyrank:' + Math.floor(now / 27001)
        let res = await this.cache(key)
        let result = await scoreModel.where({start_ts : {"<=" : now}, end_ts : {">=" : now}}).order('cur_total_sun - total_sun_at_start desc').limit(20).select()


        let meScore = await scoreModel.where({addr : addr, start_ts : {"<=" : now}, end_ts : {">=" : now}}).select()
        let meName = '-'
        let meRward = '-'
        let meResult = '-'
        if (think.isEmpty(meScore)) {
            meScore = 0
            meName = addr
        } else {
            meScore = (meScore[0].cur_total_sun - meScore[0].total_sun_at_start) / 1e6
            meName = addr
            meResult = '-'
        }

        let final = []

        for (let i = 0;i< result.length; i++){
            let name = result[i].addr
            let img = 10000
            let lv = '0'
            let _img = await this.hget("player:info:" + name, "img")
            if (_img && _img != '') {
                img = _img;
            }

            let _lv = await this.hget("player:info:" + name, "lv")
            if (_lv && _lv != '') {
                lv = _lv;
            }

            let _name = await this.hget("player:info:" + name, "name")
            if (_name && _name != '') {
                name = _name;
            }

            let tmpReward = {trx : rewardNewConf[i].trx, ante : rewardNewConf[i].ante}
            let addtion = Math.ceil(result[i].all_users_bet_trx * 0.00068 * (TRX_RANK[i] || 0));
            // let addtion = 0
            tmpReward.trx += addtion

            if (addr == result[i].addr) {
                meResult = i + 1
                meName = name
                meRward = tmpReward
            }
            let tmp = {
                rank : i + 1,
                reward : tmpReward,
                name : name,
                amont :(result[i].cur_total_sun - result[i].total_sun_at_start) / 1e6,
                addr : result[i].addr,
                lv : lv,
                img : img,
            }

            final.push(tmp)
        }

        let _name = await this.hget("player:info:" + meName, "name")
        if (_name && _name != '') {
            meName = _name;
        }

        if (result.length < 20) {
            let tmpLength = result.length
            for (let i=0; i< 20 - tmpLength; i++){
                let tmpReward = {trx : rewardNewConf[tmpLength + i].trx, ante : rewardNewConf[tmpLength + i].ante}
                final.push({rank : tmpLength + 1 + i, amont : 0, addr : '-', reward : tmpReward, name : '-', lv : 0, img : 10000})
            }
        }

        let lastRank = await this.lastrank(addr)


        let finals = {rank : final, last : lastRank,  me : {rank : meResult || '-', reward :meRward, name : meName, amont : meScore, addr : addr == 'abc' ? '-' : addr, lv : 0, img : 10000}}
        await this.cache(key, JSON.stringify(finals))
        return this.success('ok')

    }


}