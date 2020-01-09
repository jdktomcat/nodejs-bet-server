// const config = require('../configs/config');
// const modelRank = require('../models/modelRank');
// const db = require('../utils/utilMysql');

// const week_rank_raward = config.dice.week_rank_raward;//周排名奖金(单位TRX)
// const week_rank_start_ts = config.dice.week_rank_start_ts;//周排名统计开始时间 2018/11/5 20:0:0
// const week_rank_end_ts = config.dice.week_rank_end_ts;//周排名统计截止时间2018/11/12 12:0:0
// const week_rank_reward = config.dice.week_rank_reward;//周排名排名奖励比例

// let WEEK_RANK = null;

// async function refresh() {
//     try {
//         conn = await db.getConnection();
//         if (conn == null) {
//             throw new Error("conn is null");
//         }
//         conn.beginTransaction();
//         //////////////////////////////////////////////////
//         let now = Math.floor(Date.now() / 1000);
//         // console.log("start_ts", now, week_rank_start_ts);
//         if (now - week_rank_start_ts >= 0 && week_rank_end_ts - now >= 0) {
//             let isExist = await modelRank.isExistSnaphot(week_rank_start_ts, conn);
//             // console.log("isExist", isExist);
//             if (isExist) {
//                 await modelRank.laterSnaphot(week_rank_start_ts, week_rank_end_ts, conn);
//                 await modelRank.updateSnaphot(week_rank_start_ts, conn);
//                 // console.log("weeklyRank updated");
//             } else {
//                 await modelRank.insertSnaphot(week_rank_start_ts, week_rank_end_ts, conn);
//                 // console.log("weeklyRank inserted");
//             }
//         } else {
//             conn.commit();
//             conn.release();
//             return true;
//         }
//         let rankInfo = await modelRank.getRankInfo(week_rank_start_ts, 100, conn);
//         // console.log(rankInfo);
//         let arr = [];
//         for (let i = 0; i < rankInfo.length; i++) {
//             let obj = rankInfo[i];
//             let addr = obj.addr;
//             let amount = obj.amount;
//             let reward = week_rank_reward[i] || 0;
//             arr.push({ grade: i + 1, addr: addr, name: "", amount: amount, reward: reward });
//             // console.log({ grade: i + 1, addr: addr, name: "", amount: amount, reward: reward });
//         }
//         WEEK_RANK = arr;
//         //////////////////////////////////////////////////
//         conn.commit();
//         conn.release();
//         return true;
//     } catch (e) {
//         if (conn) {
//             conn.rollback();
//             conn.release();
//         }
//         console.error("OMG! ROLLBACK!!!", e);
//         throw new Error("OMG! ROLLBACK!!!", e);
//     }
// }

// async function init() {
//     let rankInfo = await modelRank.getRankInfo(week_rank_start_ts, 100);
//     // console.log(rankInfo);
//     let arr = [];
//     for (let i = 0; i < rankInfo.length; i++) {
//         let obj = rankInfo[i];
//         let addr = obj.addr;
//         let amount = obj.amount;
//         let reward = week_rank_reward[i] || 0;
//         arr.push({ grade: i + 1, addr: addr, name: "", amount: amount, reward: reward });
//         // console.log({ grade: i + 1, addr: addr, name: "", amount: amount, reward: reward });
//     }
//     WEEK_RANK = arr;

//     await refresh();
//     setInterval(async () => {
//         await refresh();
//     }, 60000);
// }

// function getWeekRanInfo() {
//     return WEEK_RANK;
// }

// module.exports.init = init;
// module.exports.getWeekRanInfo = getWeekRanInfo;