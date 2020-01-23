const _ = require('lodash')._
const {app, rewards, robots}  = require('../configs/config')
const evnets = require('events')
const cronEvent = new evnets.EventEmitter()
const userinfo = require('../model/userinfo')
const db = require('../utils/dbUtil')
const startTs  = app.startTs
const interval = app.interval

cronEvent.on('dailyRankReward', () => {
    let timer = setInterval(async () => {
        let now = new Date().getTime()
        
        let newRound =  Math.floor((now - startTs) / interval)
        let lastRound = await userinfo.maxRewardRound()
        console.log(lastRound, newRound)

        if (newRound - lastRound <= 1) {
            console.log('not in reward time, check it...')
            return console.log('try next time, ~~~~~~~~~~~~~~~~')
        }

        let result = await userinfo.allRank(newRound - 1, 50)
        console.log("begin round count===========>",newRound)
        console.log(result)

        let wardconf = rewards

        let conn = null
        //快照数据放入日志
        try {
            conn = await db.getConnection()
            if (conn == null) {
                return console.error('Shit, get db connection failed!!!!!!!!!!!!!!')            }
            conn.beginTransaction()
            for (let index = 0; index < result.length ; index++) {
                await userinfo.addDailyRankWardLog(newRound - 1, result[index].addr, result[index].score, 0, wardconf[index], now, conn)
            }
            conn.commit()
        } catch (error) {
            console.log(error)
            if(conn) conn.rollback()
        } finally {
            if(conn) conn.release()
        }
        console.log('daily records over!')
    }, 240000);
})

cronEvent.on('totalRankReward', async() => {
  // let allRank = await userinfo.allTotalRank(48)
  // let now = new Date().getTime()
  // let final = []
  // // 插入机器人
  // // select sum(score) score, addr from years_suit_score group by addr order by sum(score) desc limit
  // if (allRank.length < 50) {
  //   // 20分插在什么位置,注意排名和插入位置的区别
  //   // let position = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  //   let position = [2, 4]
  //   let tempallRank = [];
  //   for(let index in robots){
  //     let obj = {};
  //     // 从 allRank 取出 position[index] - 1 这个位置的玩家积分
  //     if(allRank[position[index] - 1]){
  //       let tempScore = allRank[position[index] - 1].score
  //       obj.score = Number(tempScore) + 1000
  //     }else{
  //       obj.score = 100
  //     }
  //     obj.addr = robots[index];
  //     tempallRank.push(obj);
  //   }
  //   allRank = allRank.concat(tempallRank);
  //   allRank = allRank.sort((ele1, ele2)=>{
  //     return ele2.score - ele1.score
  //   })
  // }

  // for (let i = 0;i< allRank.length; i++){
  //   let name = allRank[i].addr
  //   let tmp = {
  //     rank : i + 1,
  //     reward : rewards[i] * 3,
  //     name : name,
  //     score :allRank[i].score,
  //     addr : allRank[i].addr
  //   }
  //   final.push(tmp)
  // }
  // console.log("final======", final)

  // let conn = null
  // //快照数据放入日志
  // try {
  //   conn = await db.getConnection()
  //   if (conn == null) {
  //     return console.error('Shit, get db connection failed======')            }
  //   conn.beginTransaction()
  //   for (let index = 0; index < final.length ; index++) {
  //     await userinfo.addDailyRankWardLog(2, final[index].addr, final[index].score, 0, final[index].reward, now, conn)
  //   }
  //   conn.commit()
  // } catch (error) {
  //   console.log(error)
  //   if(conn) conn.rollback()
  // } finally {
  //   if(conn) conn.release()
  // }

  // // 开始发奖
  // for (let index = 0; index < final.length ; index++) {
  //   console.log('final[index].addr, final[index].reward======>', final[index].addr, final[index].reward)
  //   try {
  //     let tx = await tronUtils.sendTRX(final[index].addr, final[index].reward)
  //     console.log("tx.transaction.txID======", tx.transaction.txID)
  //     if (tx.result == true) {
  //       await userinfo.updateTxidToDailyRankWardLog(2, final[index].addr, tx.transaction.txID)
  //     }
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }
  // console.log('send daily rank success!!!')
})

module.exports = {cronEvent}