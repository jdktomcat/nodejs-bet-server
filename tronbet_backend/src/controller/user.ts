import Base from './base.js';
import { think } from 'thinkjs';
import { debug, log } from 'util';
import { sha256 } from 'js-sha256';
var redis = require('redis');
var TronWeb = require('tronweb')
var xhr = require('axios')

export default class extends Base {
  async loginAction() {
    let parmas = this.post()
    let param = null
    for (let i in parmas) {
        param = JSON.parse(i + '')
        break
    }

    let username = param['username']
    let passwd = param['passwd']

    console.error('username, passwd')
    console.error(username, passwd)
    console.error(param)

    if (username == undefined || passwd == undefined) {
        return this.fail(402, 'username or password error')
    }

    let hash = sha256.create();
    hash.update(passwd);
    let passwdHash = hash.hex();

    const user = this.model('user')
    let data = await user.where({username : username, passwd : passwdHash}).find()
    if ( think.isEmpty(data) ) {
        return this.fail(402, 'username or password error')
    }

    console.log(JSON.stringify(data))
    let token = this.service('token').getUseToken(username, data.role)
    await this.cache(username, token)
    return this.success({token : token, role : data.role, username : username})
  }

  async totalAction() {
    let username = this.ctx.post('username')
    let passwd = this.post('passwd')

    if (username == undefined || passwd == undefined) {
        return this.fail(402, 'username or password error')
    }

    const user = this.model('user')
    let data = await user.where({username : username, passwd : passwd}).find()
    if ( think.isEmpty(data) ) {
        return this.fail(402, 'username or password error')
    }

    let token = this.service('token').getUseToken(username)
    await this.cache(username, token)
    return this.success({token : token})
  }


  async getTrxInfoFromSolidity(uri , tx_id) {
    try {
        let {data} = await xhr({
            url : "https://solidity.tronbet.com" + uri,
            method: 'post',
            data: {
                value: tx_id,
            },
            headers : {
                'Content-type': 'application/json', 'Accept': 'text/plain'
            }
        })
        return data
    } catch (error) {
        return null
    }

  }

  async moonlogsAction() {
    console.log('---------------moontrxlogsAction-------------------------------------')
        let method = this.method.toLowerCase();
        if (method === "options") {
            console.error(method)
            return this.success('ok');
        }
        console.log('post------------moontrxlogsAction-----')
      let addr = this.post('addr')
      let win = this.post('cate')
      let tx_id = this.post('tx_id')
      let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
      let where = ''
      if(pattern.test(addr) || pattern.test(win) || pattern.test(tx_id)){
          return this.fail(405, 'args error')
      }

      if (tx_id == '') {
        return this.fail(405, 'args error')
      }

      let sql = "select * from tron_bet_admin.moon_user_order where round = (select round from tron_bet_admin.moon_round_info where tx_id = '{0}') "
      sql = sql.replace('{0}', tx_id)
     if (addr != "") {
        where += " and addr = '{0}'"
        where = where.replace('{0}', addr)
        sql += where
     }
     let tmodel = this.model("dice_events_roll_0", "mysql2")
     let data1 = await tmodel.query(sql)
     this.success(data1)
  }

  async trxlogsAction() {

    // let role = this.ctx.param('role')

    // console.log('role---------------------', role)

    // if (Number(role) != 0) {
    //     return this.success([])
    // }

    let parmas = this.post()
    let param = null
    for (let i in parmas) {
        param = JSON.parse(i + '')
        break
    }

    let keyword = param['keyword']
    let page = param['page']
    let cate = param['cate']
    let sdate = param['sdate']
    let edate = param['edate']
    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    if(pattern.test(keyword)){
        return this.fail(405, 'args error')
    }

    if (isNaN(page)){
        return this.fail(405, 'args error')
    }

    if(pattern.test(cate)){
        return this.fail(405, 'args error')
    }

    let sql = ""
    let where = ""
    let tmodel = this.model("dice_events_roll_0", "mysql2")
    let limits = " limit " + (page - 1) * 20 + ", " + '20'
    if (keyword == '') {
        console.error('keyword.length =! 0')
    } else {
        where += " and (addr = '{0}' or tx_id = '{0}') "
        where = where.replace('{0}', keyword)
        where = where.replace('{0}', keyword)
        if (keyword.length >= 60) {
            let trxInfo = await this.getTrxInfoFromSolidity('/walletsolidity/gettransactionbyid', keyword)
            if (trxInfo != null && trxInfo.raw_data != undefined) {
                console.log('---------------------ssss-----------------')
                let tmp = trxInfo.raw_data.contract[0].parameter.value
                let owner_address = tmp.owner_address
                let call_value = tmp.call_value
                let TronAddr = TronWeb.address.fromHex(owner_address);
                if (TronAddr == 'TBv7igM3eVRsd144ayw7X3ecxsAdMQfBne') {
                    let sql = "select * from dice_events_v2 where tx_id ='{0}'"
                    sql = sql.replace('{0}', keyword)
                    let data1 = await tmodel.query(sql)
                    return this.success({data : data1, total : 10})
                }
                let blockInfo = await this.getTrxInfoFromSolidity('/walletsolidity/gettransactioninfobyid', keyword)
                let blockNum = blockInfo.blockNumber
                let betTime = trxInfo.raw_data.timestamp
                let sql = "select * from dice_events_v2 where addr = '{0}' and tx_id in (select tx_id from dice_txs where block_num >= {2} and  block_num <= {3}) order by log_id limit 3"
                sql = sql.replace('{0}', TronAddr)
                // sql = sql.replace('{1}', call_value.toString())
                sql = sql.replace('{2}', (blockNum).toString())
                sql = sql.replace('{3}', (blockNum + 8).toString())
                let data1 = await tmodel.query(sql)

                console.log(data1.length)
                let result = []
                for (let i in data1) {
                    let item = data1[i]
                    console.log('--------------------------gettransactioninfobyid---------------------------')
                    let trxInfo = await this.getTrxInfoFromSolidity('/walletsolidity/gettransactionbyid', item.tx_id)
                    let thisTrxTime = trxInfo.raw_data.timestamp
                    if (betTime <= thisTrxTime) {
                        result = [item]
                        break
                    }
                }


                return this.success({data : result, total : 10})
            }

            sql = "select * from dice_events_v2 where 2 > 1 " + where  + limits
            let totalSql = "select count(1) as total from dice_events_v2 where 2 > 1" + where
            let data1 = await tmodel.query(sql)
            let total = await tmodel.query(totalSql)
            return this.success({data : data1, total : total[0].total})
        }
    }

    if (cate == 'lose') {
        where += " and payout_sun = 0"
    } else if (cate == 'win') {
        where += " and payout_sun > 0"
    }

    let stime =  new Date(sdate).getTime();
    let etime =  new Date(edate).getTime();

    page = Number(page)

    let minSql = "select min(log_id) minId from dice_events_v2 where tx_id in (select tx_id from (select tx_id from dice_txs where block_num >= (select min(block_num) from dice_block where block_ts >= {1}) limit 30) b);"
    let maxSql = "select max(log_id) maxId from dice_events_v2 where tx_id in (select tx_id from (select tx_id from dice_txs where block_num >= (select max(block_num) from dice_block where block_ts <= {1}) limit 30)     b);"
    minSql = minSql.replace("{1}", stime.toString())
    maxSql = maxSql.replace("{1}", etime.toString())


    sql += where
    sql += limits + ";"

    let minlogId = await tmodel.query(minSql)
    if (think.isEmpty(minlogId)) return this.success([])
    if (minlogId.length == 0) return this.success([])
    let maxlogId = await tmodel.query(maxSql)
    if (think.isEmpty(maxlogId)) return this.success([])
    if (maxlogId.length == 0) return this.success([])
    // let data = await tmodel.query(sql)
    console.error(minlogId[0].minId, maxlogId[0].maxId)

    sql = "select * from dice_events_v2 where log_id > {1} and log_id <= {2} " + where + limits

    let totalSql = "select count(1) as total from dice_events_v2 where log_id > {1} and log_id <= {2}" + where

    sql = sql.replace("{1}", minlogId[0].minId.toString())
    sql = sql.replace("{2}", maxlogId[0].maxId.toString())

    totalSql = totalSql.replace("{1}", minlogId[0].minId.toString())
    totalSql = totalSql.replace("{2}", maxlogId[0].maxId.toString())

    console.error(sql)
    let data = await tmodel.query(sql)
    let total = await tmodel.query(totalSql)
    this.success({data : data, total : total[0].total})
  }

  async mentorsAction() {
    const method = this.method.toLowerCase();
    if (method === "options") {
      console.error(method)
      return this.success('ok');
    }
    let role = this.ctx.param('role')

    console.log('role---------------------', role)

    if (Number(role) != 0) {
        return this.success([])
    }

    let parmas = this.post()
    let param = null
    for (let i in parmas) {
        param = JSON.parse(i + '')
        break
    }
    let keyword = param['keyword']
    let page = param['page']
    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    if(pattern.test(keyword)){
        return this.fail(405, 'args error')
    }

    if (isNaN(page)){
        return this.fail(405, 'args error')
    }

    page = Number(page)

    let limits = " limit " + (page - 1) * 20 + ", " + '20'

    let sql = ''
    if (keyword == '') {
        sql = "select sum(amount_sun) amount_sun, sum(payout_sun) payout_sun, sum(referral_sun) referral_sun, mentor from dice_events_v2 where mentor <> '' group by mentor"
    } else {
        sql = "select sum(amount_sun) amount_sun, sum(payout_sun) payout_sun, sum(referral_sun) referral_sun, mentor from dice_events_v2 where mentor = '{0}' group by mentor"
        sql = sql.replace("{0}", keyword)
    }

    let tmodel = this.model("dice_events_roll_0", "mysql2")
    let data = await tmodel.query(sql)
    this.success(data)
  }

  async basedataAction() {
    let role = this.ctx.param('role')
    let method = this.method.toLowerCase();
    if (method === "options") {
        console.error(method)
        return this.success('ok');
    }

    if (Number(role) != 0) {
        return this.success([])
    }

    console.log(this.post())
    let game = this.post('game')

    console.log(game, '------------------------')
    if (game != 'All' && game != 'Dice' && game != 'Moon' && game != 'Ring' && game != 'Duel') {
        return this.success([])
    }
    let tmodel = this.model("dice_events_roll_0", "mysql2")
    let nowTime = Math.floor(new Date().getTime() / 1000)
    let todatStime = (nowTime - nowTime % 86400 - 8 * 3600) * 1000
    if (nowTime % 86400 >= 16 * 3600) {
        todatStime = todatStime + 86400 * 1000
    }

    console.log(game)

    let result = {
        totalAmount : 0,
        totalUser : 0,
        totalAnte : 0,
        todayAmount : 0,
        todayAnte : 0,
        todayNewUser : 0,
        todayActUser : 0,
        todayBetTimes : 0,
        todayProfit : 0,
        totalDivdied : 0,
    }

    let totalDivdiedSql = "select sum(total_trx / 1000000) totalAnte from (select total_trx from ante_ver union all select total_trx from ante_ver_v1) a"
    let totalDivdied = await tmodel.query(totalDivdiedSql)
    result.totalDivdied = totalDivdied[0].totalAnte

    if (game == 'All' || game == 'Dice') {
        let logIdCache = await this.cache(todatStime.toString())
        if (think.isEmpty(logIdCache)) {
            let minSql = "select min(log_id) minId from dice_events_v2 where tx_id in (select tx_id from dice_txs where block_num >= (select min(block_num) from dice_block where block_ts >= {1}));"
            minSql = minSql.replace("{1}", (todatStime).toString())
            let minLogId = await tmodel.query(minSql)
            await this.cache(todatStime.toString(), minLogId[0].minId)
            logIdCache = minLogId[0].minId
        }

        let totlalAmountsql = "select all_bet_sun - 379417986000000 amount_sun, all_bet_sun - all_payout_sun totalProfit from dice_block order by block_num desc limit 1;"
        let totlalUsersql = "select count(1) total, sum(total) amount_sun from dice_players"


        let totlalAmount = await tmodel.query(totlalAmountsql)
        let totlalUser = await tmodel.query(totlalUsersql)

        let todayNewUserSql = "select count(1) total from dice_players where first_ts >= " + todatStime

        let todayActUserSql = "select count(distinct addr) total, count(1) cnt,sum(amount_sun) amount_sun, sum(amount_sun / 1000000 - payout_sun / 1000000) profit from dice_events_v2 where log_id >= " + logIdCache

        // let todayAmount = await tmodel.query(todayAmountSql)
        let todayNewUser = await tmodel.query(todayNewUserSql)
        let todayActUser = await tmodel.query(todayActUserSql)

        result = {
            totalAmount : totlalUser[0].amount_sun - 379417986000000,
            totalUser : totlalUser[0].total,
            totalAnte : 0,
            todayAmount : todayActUser[0].amount_sun,
            todayAnte : 0,
            todayNewUser : todayNewUser[0].total,
            todayActUser :todayActUser[0].total,
            todayBetTimes :todayActUser[0].cnt,
            todayProfit :todayActUser[0].profit,
            totalDivdied : totlalAmount[0].totalProfit / 1e6,
        }
    }

    if (game == 'All' || game == 'Moon') {
        let totlalAmountsql = "select sum(amount) totlalAmount, sum(amount - win) totalProfit, count(distinct addr) totalUser from tron_bet_admin.moon_user_order"

        // totlalAmountsql = "select count(1) totalUser, sum(moon_total) totlalAmount from dice_players where moon_total > 0"

        let totlalAmount = await tmodel.query(totlalAmountsql)

        let todayNewUserSql = "select count(distinct addr) total from tron_bet_admin.moon_user_order where ts >= " + todatStime + " and addr not in (select addr from dice_players where first_ts < " + todatStime + ")"

        let todayActUserSql = "select count(distinct addr) total, count(1) cnt,sum(amount) amount_sun, sum(amount / 1000000 - win / 1000000) profit from tron_bet_admin.moon_user_order where ts >= " + todatStime


        // let todayAmount = await tmodel.query(todayAmountSql)
        // let todayNewUser = await tmodel.query(todayNewUserSql)
        let todayActUser = await tmodel.query(todayActUserSql)
        result.totalAmount += totlalAmount[0].totlalAmount
        result.totalUser += totlalAmount[0].totalUser
        result.totalAnte += 0
        result.todayAmount += todayActUser[0].amount_sun
        result.todayAnte += 0
        // result.todayNewUser += todayNewUser[0].total
        result.todayActUser += todayActUser[0].total
        result.todayBetTimes += todayActUser[0].cnt
        result.todayProfit += todayActUser[0].profit
        if (game == 'Moon') {
            result.totalDivdied =  totlalAmount[0].totalProfit / 1e6
        }
    }

    if (game == 'All' || game == 'Ring') {
        let totlalAmountsql = "select sum(amount * 1000000) totlalAmount, sum(amount * 1000000 - win * 1000000) totalProfit, count(distinct addr) totalUser from tron_bet_wzc.wheel_detail"
        let roundSql = "select round from tron_bet_wzc.wheel_info where waiting_ts >= "  + todatStime +  " limit 1"
        let round = await tmodel.query(roundSql)

        // let todayNewUserSql = "select count(distinct addr) total from tron_bet_wzc.wheel_user_order where round >= " + round[0].round + " and addr not in (select addr from dice_players where first_ts < " + todatStime + ")"

        let todayActUserSql = "select count(distinct addr) total, count(1) cnt,sum(amount) amount_sun, sum(amount / 1000000 - win / 1000000) profit from tron_bet_admin.wheel_user_order where round >= " + round[0].round


        let totlalAmount = await tmodel.query(totlalAmountsql)
        // let todayAmount = await tmodel.query(todayAmountSql)

        // let todayNewUser = await tmodel.query(todayNewUserSql)
        let todayActUser = await tmodel.query(todayActUserSql)
        result.totalAmount += totlalAmount[0].totlalAmount
        result.totalUser += totlalAmount[0].totalUser
        result.totalAnte += 0
        result.todayAmount += todayActUser[0].amount_sun
        result.todayAnte += 0
        // result.todayNewUser += todayNewUser[0].total
        result.todayActUser += todayActUser[0].total
        result.todayBetTimes += todayActUser[0].cnt
        result.todayProfit += todayActUser[0].profit
        if (game == 'Ring') {
            result.totalDivdied =  totlalAmount[0].totalProfit / 1e6
        }
    }

    if (game == 'All') {
        result.totalDivdied =  totalDivdied[0].totalAnte
    }
    this.success(result)
  }

  async banchatAction() {
    let role = this.ctx.param('role')

    console.log('role---------------------', role)

    // if (Number(role) != 0) {
    //     return this.fail(405, 'failed!!')
    // }
    let parmas = this.post()

    console.log(parmas)
    let param = null
    for (let i in parmas) {
        param = JSON.parse(i + '')
        break
    }
    let addr = param['keyword']

    console.log(addr)

    if (addr == undefined) {
        return this.fail(402, 'address format error')
    }

    if (addr.length != 34) {
        return this.fail(402, 'address format error')
    }

    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    if(pattern.test(addr)){
        return this.fail(405, 'ddress format error')
    }

    let rdb = redis.createClient({"host" : '127.0.0.1', "port": 6379, 'db' : 1});
    rdb.auth('', () =>{
        console.log('auth success')
    })
    rdb.on('connect',() =>{
        rdb.hset('blacklist', addr, 1, (err, value) => {
            console.error(err, value)
        });
    })


    return this.success('ok')

  }

  async unbanchatAction() {
    let role = this.ctx.param('role')

    console.log('role---------------------', role)

    // if (Number(role) != 0) {
    //     return this.fail(405, 'failed!!')
    // }
    let parmas = this.post()

    console.log(parmas)
    let param = null
    for (let i in parmas) {
        param = JSON.parse(i + '')
        break
    }
    let addr = param['keyword']

    console.log(addr)

    if (addr == undefined) {
        return this.fail(402, 'address format error')
    }

    if (addr.length != 34) {
        return this.fail(402, 'address format error')
    }

    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    if(pattern.test(addr)){
        return this.fail(405, 'ddress format error')
    }

    let rdb = redis.createClient({"host" : '127.0.0.1', "port": 6379, 'db' : 1});
    rdb.auth('', () =>{
        console.log('auth success')
    })
    rdb.on('connect',() =>{
        rdb.hdel('blacklist', addr, (err, value) => {
            console.error(err, value)
        });
    })

    return this.success('ok')

  }


  async rankAction() {
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
    if (game != 'All' && game != 'Dice' && game != 'Moon' && game != "Ring") {
        return this.success([])
    }

    let tmodel = this.model("dice_events_roll_0", "mysql2")
    let nowTime = Math.floor(new Date().getTime() / 1000)
    let todatStime = (nowTime - nowTime % 86400 - 8 * 3600) * 1000
    if (nowTime % 86400 >= 16 * 3600) {
        todatStime = todatStime + 86400 * 1000
    }
    let logIdCache = await this.cache(todatStime.toString())
    if (think.isEmpty(logIdCache)) {
        console.error('-----------------think.isEmpty(logIdCache)------------------------')
        let minSql = "select min(log_id) minId from dice_events_v2 where tx_id in (select tx_id from dice_txs where block_num >= (select min(block_num) from dice_block where block_ts >= {1}));"
        minSql = minSql.replace("{1}", (todatStime).toString())
        let minLogId = await tmodel.query(minSql)
        await this.cache(todatStime.toString(), minLogId[0].minId)
        logIdCache = minLogId[0].minId
    }

    if (game == 'All' || game == 'Dice') {
        let todayAmountRankSql = "select amount_sun, addr from (select sum(amount_sun / 1000000) amount_sun, addr from dice_events_v2 where log_id >= " + logIdCache + ' group by addr) b order by b.amount_sun desc limit 20'

        let todayProfitRankDescSql = "select profit, addr from (select sum(amount_sun / 1000000 - payout_sun / 1000000) profit, addr from dice_events_v2 where log_id >= " + logIdCache + ' group by addr) b order by b.profit desc limit 20'

        let todayProfitRankAscSql = "select profit, addr from (select sum(payout_sun / 1000000 - amount_sun / 1000000) profit, addr from dice_events_v2 where log_id >= " + logIdCache + ' group by addr) b order by b.profit desc limit 20'

        let todayBetCntRankSql = "select cnt, addr from (select count(1) cnt, addr from dice_events_v2 where log_id >= " + logIdCache + ' group by addr) b order by b.cnt desc limit 20'


        let totalAmountRankSql = "select total / 1000000 as amount_sun, addr from dice_players order by total desc limit 20"

        let totalProfitRankDescSql = "select (total / 1000000 - payout / 1000000) profit, addr from dice_players  order by ((total / 1000000 - payout / 1000000)) desc limit 20"

        let totalProfitRankAscSql = "select (payout / 1000000 - total / 1000000) profit, addr from dice_players order by ((payout / 1000000 - total / 1000000)) desc limit 20"

        let totalBetCntRankSql = "select play_times cnt, addr from dice_players order by play_times desc limit 20"



        let todayAmountRank = await tmodel.query(todayAmountRankSql)
        let todayProfitRankDesc = await tmodel.query(todayProfitRankDescSql)
        let todayProfitRankAsc = await tmodel.query(todayProfitRankAscSql)
        let todayBetCntRank = await tmodel.query(todayBetCntRankSql)


        let totalAmountRank = await tmodel.query(totalAmountRankSql)
        let totalProfitRankDesc = await tmodel.query(totalProfitRankDescSql)
        let totalProfitRankAsc = await tmodel.query(totalProfitRankAscSql)
        let totalBetCntRank = await tmodel.query(totalBetCntRankSql)

        return this.success({
            todayAmountRank : todayAmountRank,
            todayProfitRankDesc : todayProfitRankDesc,
            todayProfitRankAsc : todayProfitRankAsc,
            todayBetCntRank : todayBetCntRank,
            totalAmountRank : totalAmountRank,
            totalProfitRankDesc : totalProfitRankDesc,
            totalProfitRankAsc : totalProfitRankAsc,
            totalBetCntRank : totalBetCntRank,
        })
    } else if (game == 'Moon') {
        let todayAmountRankSql = "select amount_sun, addr from (select sum(amount / 1000000) amount_sun, addr from tron_bet_admin.moon_user_order where ts >= " + todatStime + ' group by addr) b order by b.amount_sun desc limit 20'

        let todayProfitRankDescSql = "select profit, addr from (select sum(amount / 1000000 - win / 1000000) profit, addr from tron_bet_admin.moon_user_order where ts >= " + todatStime + ' group by addr) b order by b.profit desc limit 20'

        let todayProfitRankAscSql = "select profit, addr from (select sum(win / 1000000 - amount / 1000000) profit, addr from tron_bet_admin.moon_user_order where ts >= " + todatStime + ' group by addr) b order by b.profit desc limit 20'

        let todayBetCntRankSql = "select cnt, addr from (select count(1) cnt, addr from tron_bet_admin.moon_user_order where ts >= " + todatStime + ' group by addr) b order by b.cnt desc limit 20'


        let totalAmountRankSql = "select amount_sun, addr from (select sum(amount / 1000000) amount_sun, addr from tron_bet_admin.moon_user_order group by addr) b order by b.amount_sun desc limit 20"

        let totalProfitRankDescSql = "select profit, addr from (select sum(amount / 1000000 - win / 1000000) profit, addr from tron_bet_admin.moon_user_order group by addr) b order by b.profit desc limit 20"

        let totalProfitRankAscSql = "select profit, addr from (select sum(win / 1000000 - amount / 1000000) profit, addr from tron_bet_admin.moon_user_order group by addr) b order by b.profit desc limit 20"

        let totalBetCntRankSql = "select cnt, addr from (select count(1) cnt, addr from tron_bet_admin.moon_user_order group by addr) b order by b.cnt desc limit 20"



        let todayAmountRank = await tmodel.query(todayAmountRankSql)
        let todayProfitRankDesc = await tmodel.query(todayProfitRankDescSql)
        let todayProfitRankAsc = await tmodel.query(todayProfitRankAscSql)
        let todayBetCntRank = await tmodel.query(todayBetCntRankSql)


        let totalAmountRank = await tmodel.query(totalAmountRankSql)
        let totalProfitRankDesc = await tmodel.query(totalProfitRankDescSql)
        let totalProfitRankAsc = await tmodel.query(totalProfitRankAscSql)
        let totalBetCntRank = await tmodel.query(totalBetCntRankSql)

        return this.success({
            todayAmountRank : todayAmountRank,
            todayProfitRankDesc : todayProfitRankDesc,
            todayProfitRankAsc : todayProfitRankAsc,
            todayBetCntRank : todayBetCntRank,
            totalAmountRank : totalAmountRank,
            totalProfitRankDesc : totalProfitRankDesc,
            totalProfitRankAsc : totalProfitRankAsc,
            totalBetCntRank : totalBetCntRank,
        })

    } else if (game == 'Ring') {
        let todayAmountRankSql = "select amount_sun, addr from (select sum(amount / 1000000) amount_sun, addr from tron_bet_admin.wheel_user_order where ts >= " + todatStime + ' group by addr) b order by b.amount_sun desc limit 20'

        let todayProfitRankDescSql = "select profit, addr from (select sum(amount / 1000000 - win / 1000000) profit, addr from tron_bet_admin.wheel_user_order where ts >= " + todatStime + ' group by addr) b order by b.profit desc limit 20'

        let todayProfitRankAscSql = "select profit, addr from (select sum(win / 1000000 - amount / 1000000) profit, addr from tron_bet_admin.wheel_user_order where ts >= " + todatStime + ' group by addr) b order by b.profit desc limit 20'

        let todayBetCntRankSql = "select cnt, addr from (select count(1) cnt, addr from tron_bet_admin.wheel_user_order where ts >= " + todatStime + ' group by addr) b order by b.cnt desc limit 20'


        let totalAmountRankSql = "select amount_sun, addr from (select sum(amount / 1000000) amount_sun, addr from tron_bet_admin.wheel_user_order group by addr) b order by b.amount_sun desc limit 20"

        let totalProfitRankDescSql = "select profit, addr from (select sum(amount / 1000000 - win / 1000000) profit, addr from tron_bet_admin.wheel_user_order group by addr) b order by b.profit desc limit 20"

        let totalProfitRankAscSql = "select profit, addr from (select sum(win / 1000000 - amount / 1000000) profit, addr from tron_bet_admin.wheel_user_order group by addr) b order by b.profit desc limit 20"

        let totalBetCntRankSql = "select cnt, addr from (select count(1) cnt, addr from tron_bet_admin.wheel_user_order group by addr) b order by b.cnt desc limit 20"



        let todayAmountRank = await tmodel.query(todayAmountRankSql)
        let todayProfitRankDesc = await tmodel.query(todayProfitRankDescSql)
        let todayProfitRankAsc = await tmodel.query(todayProfitRankAscSql)
        let todayBetCntRank = await tmodel.query(todayBetCntRankSql)


        let totalAmountRank = await tmodel.query(totalAmountRankSql)
        let totalProfitRankDesc = await tmodel.query(totalProfitRankDescSql)
        let totalProfitRankAsc = await tmodel.query(totalProfitRankAscSql)
        let totalBetCntRank = await tmodel.query(totalBetCntRankSql)

        return this.success({
            todayAmountRank : todayAmountRank,
            todayProfitRankDesc : todayProfitRankDesc,
            todayProfitRankAsc : todayProfitRankAsc,
            todayBetCntRank : todayBetCntRank,
            totalAmountRank : totalAmountRank,
            totalProfitRankDesc : totalProfitRankDesc,
            totalProfitRankAsc : totalProfitRankAsc,
            totalBetCntRank : totalBetCntRank,
        })
    }


  }

  async name2AddrAction() {
      let name = this.post('name')
      console.log(name)
      let tmodel = this.model("dice_players", "mysql2")
      name = name.replace('....', '%')
      let result = await tmodel.where({name : name, addr : ['like', name], _logic: 'XOR'}).select()
      if (think.isEmpty(result)) return this.fail(2001, 'Name Not Found!!')
      return this.success({addr : result[0].addr})
  }


}
