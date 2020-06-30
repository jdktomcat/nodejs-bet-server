const {sequelize, rawQuery, updateQuery} = require('../utils/mysqlUtils')
const tronUtils = require("./../utils/tronUtil")

/**
 * params amount不需要*1e6
 */
const sendTRX = async function (addr, amount) {
    //insert 流水
    let insertSql = "insert into tron_bet_event.mine_send_log(addr, amount, currency, tx_id, ts) values (?,?,?,?,?)"
    await updateQuery(insertSql, [addr, amount, 'TRX', '', Date.now()])
    let tx = await tronUtils.sendTRX(addr, amount)
    if (tx.result !== true) {
        return ''
    } else {
        const id = tx.transaction.txID
        //
        let updateSql = "update tron_bet_event.mine_send_log set tx_id = ? where addr = ?"
        await updateQuery(updateSql, [id, addr])
    }
}
const sendWin = async function (addr, amount) {
    //insert 流水
    let insertSql = "insert into tron_bet_event.mine_send_log(addr, amount, currency, tx_id, ts) values (?,?,?,?,?)"
    await updateQuery(insertSql, [addr, amount, 'WIN', '', Date.now()])
    let tx = await tronUtils.sendWin(addr, amount)
    if (tx.result !== true) {
        return ''
    } else {
        const id = tx.transaction.txID
        console.log("win id is ", id)
        //
        let updateSql = "update tron_bet_event.mine_send_log set tx_id = ? where addr = ?"
        await updateQuery(updateSql, [id, addr])
    }
}

// {
//     addr : ''//地址
//     currency:'',//币种
//     amount:0,//
//     box : {
//         normal : 0,
//         silver : 0,
//         gorden : 0
// }
async function saveActivityData(message) {
    await sequelize.transaction(async (t) => {
        //
        const {addr, amount, currency, box} = message
        const keys = Object.keys(box)
        //
        for (let k of keys) {
            //
            const boxNum = box[k] || 0
            if (boxNum > 0) {
                let insertSql = "insert into tron_bet_event.mine_box(addr, amount,currency,type, boxNum ,ts) values (?, ?,?,?,?,?)"
                await updateQuery(insertSql, [addr, amount, currency, k, boxNum, Date.now()], t)
            }
            let sql1 = "select * from tron_bet_event.mine_box_count where addr = ? and type = ?"
            let r1 = await rawQuery(sql1, [addr,k], t)
            if (r1.length === 0) {
                let sql2 = "insert into tron_bet_event.mine_box_count(addr,type,boxNum) values (?, ?,?)"
                await updateQuery(sql2, [addr, k, boxNum], t)
            } else {
                let sql3 = "update tron_bet_event.mine_box_count set boxNum = boxNum + ? where addr = ? and type = ?"
                await updateQuery(sql3, [boxNum, addr, k], t)
            }
        }
        //
        const sql2 = `select * from tron_bet_event.mine_letter where addr = ?`
        const data2 = await rawQuery(sql2, [addr], t)
        if (data2.length === 0) {
            //["D", "I", "C", "E", "W", "N", "T", "R", "X", "K"]
            const sql3 =
                `insert into tron_bet_event.mine_letter(addr, letter_D, letter_I, letter_C, letter_E, letter_W, letter_N, letter_T, letter_R, letter_X, letter_K) values (?,0,0,0,0,0,0,0,0,0,0)`
            await updateQuery(sql3, [addr], t)
        }
    })
}

const getRandomInt = function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const queryBoxNum = async function (addr) {
    let sql1 = "select addr,type,boxNum from tron_bet_event.mine_box_count where addr = ?"
    let r1 = await rawQuery(sql1, [addr])
    return r1
}

/**
 * 持有字母个数
 */
const queryLetterList = async function (addr) {
    let sql1 = "select * from tron_bet_event.mine_letter where addr = ?"
    let r1 = await rawQuery(sql1, [addr])
    return r1
}

/**
 * 兑换记录
 */
const querySendLogs = async function (addr) {
    let sql1 = "select * from tron_bet_event.mine_send_log where addr = ? order by ts desc"
    let r1 = await rawQuery(sql1, [addr])
    return r1
}

// 开宝箱 （单个卡片价格0.374TRX）
// 卡片     权重     概率     价值
// D     2000     12.90%     0.05
// I     2000     12.90%     0.05
// C     500     3.23%     4
// E     2000     12.90%     0.05
// W     2000     12.90%     0.05
// N     2000     12.90%     0.05
// T     500     3.23%     1
// R     2000     12.90%     0.05
// X     2000     12.90%     0.05
// K     500     3.23%     5.2
const randomLetter = function () {
    let multi = {
        'letter_D': 2000,
        'letter_I': 2000,
        'letter_C': 500,
        'letter_E': 2000,
        'letter_W': 2000,
        'letter_N': 2000,
        'letter_T': 500,
        'letter_R': 2000,
        'letter_X': 2000,
        'letter_K': 500,
    }
    let sumAll = Object.values(multi).reduce((a, b) => a + b)
    let luckyNum = getRandomInt(1, sumAll)
    let sum = 0
    const keys = Object.keys(multi)
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        sum += multi[k]
        if (sum >= luckyNum) {
            return k
        }
    }
}
const openOneBox = async function (type, addr) {
    await sequelize.transaction(async (t) => {
        //
        // 品质     概率     卡片数量     均值
        // 普通宝箱     70%     1~3     2.5
        // 白银宝箱     25%     4~8     7.5
        // 黄金宝箱     5%     9~15     12
        const cardNumDict = {
            normal: getRandomInt(1, 3),
            silver: getRandomInt(4, 8),
            gorden: getRandomInt(9, 15),
        }
        const cardNum = cardNumDict[type] || -1
        //
        if (cardNum === -1) {
            throw new Error("type error!")
        }
        //
        let subSql = "update tron_bet_event.mine_box_count set boxNum = boxNum - 1 where addr = ? and type = ? and boxNum > 0"
        await updateQuery(subSql, [addr, type], t)
        //
        for (let i = 0; i < cardNum; i++) {
            let l = randomLetter()
            let updateCountSql = `update tron_bet_event.mine_letter set ${l} = ${l} + 1 where addr = ?`
            await updateQuery(updateCountSql, [addr], t)
        }
    })
}

const openMineBox = async function (type, addr) {
    if (type === 'all') {
        let sql1 = "select * from tron_bet_event.mine_box_count where addr = ?"
        let r1 = await rawQuery(sql1, [addr])
        let k = {}
        r1.forEach(e => {
            k[e['type']] = e.boxNum || 0
        })
        console.log(k)
        for (let i = 0; i < k.normal; i++) {
            await openOneBox('normal', addr)
        }
        //
        for (let i = 0; i < k.silver; i++) {
            await openOneBox('silver', addr)
        }
        //
        for (let i = 0; i < k.gorden; i++) {
            await openOneBox('gorden', addr)
        }
    } else {
        await openOneBox(type, addr)
    }
}

// 兑换
// 10*T+10*R+10*X=10TRX
// 10*D+10*I+10*C+10*E=40TRX
// 100*W+100*I+100*N=5000Win
// 10*W+10*I+10*N+10*K=10~10000TRX
// （区间     概率
// 10~50     97.0%
// 90~1000     2.9%
// 1000~10000     0.10%）
const exchangeCard = async function (type, addr) {
    await sequelize.transaction(async (t) => {
        const sql1 = `select * from tron_bet_event.mine_letter where addr = ?`
        const data1 = await rawQuery(sql1, [addr], t)
        //
        if (data1.length > 0) {
            let res = {
                'letter_D': Number(data1[0].letter_D),
                'letter_I': Number(data1[0].letter_I),
                'letter_C': Number(data1[0].letter_C),
                'letter_E': Number(data1[0].letter_E),
                'letter_W': Number(data1[0].letter_W),
                'letter_N': Number(data1[0].letter_N),
                'letter_T': Number(data1[0].letter_T),
                'letter_R': Number(data1[0].letter_R),
                'letter_X': Number(data1[0].letter_X),
                'letter_K': Number(data1[0].letter_K),
            }
            // TRX
            if (type === '1') {
                if (res.letter_T >= 10 && res.letter_R >= 10 && res.letter_X >= 10) {
                    // send 10TRX 
                    // database
                    const sql2 =
                        `update tron_bet_event.mine_letter 
                    set letter_T = letter_T - 10,letter_R = letter_R - 10,letter_X = letter_X - 10
                    where addr = ? `
                    //
                    await updateQuery(sql2, [addr], t)
                    // send
                    await sendTRX(addr, 10)
                } else {
                    throw new Error("not enough letter!")
                }
            } else if (type === '2') {
                if (res.letter_D >= 10 && res.letter_I >= 10 && res.letter_C >= 10 && res.letter_E >= 10) {
                    // send 40TRX 
                    const sql2 =
                        `update tron_bet_event.mine_letter 
                    set letter_D = letter_D - 10,letter_I = letter_I - 10,letter_C = letter_C - 10,letter_E = letter_E - 10
                    where addr = ? `
                    await updateQuery(sql2, [addr], t)
                    // send
                    //
                    await sendTRX(addr, 40)
                } else {
                    throw new Error("not enough letter!")
                }
            } else if (type === '3') {
                if (res.letter_W >= 100 && res.letter_I >= 100 && res.letter_N >= 100) {
                    // send 5000WIN
                    const sql2 =
                        `update tron_bet_event.mine_letter 
                    set letter_W = letter_W - 10,letter_I = letter_I - 10,letter_N = letter_N - 10
                    where addr = ? `
                    await updateQuery(sql2, [addr], t)
                    // send
                    await sendWin(addr, 5000)
                    //
                } else {
                    throw new Error("not enough letter!")
                }
            } else if (type === '4') {
                if (res.letter_W >= 10 && res.letter_I >= 10 && res.letter_N >= 10 && res.letter_K >= 10) {
                    // send random trx
                    const sql2 =
                        `update tron_bet_event.mine_letter 
                    set letter_W = letter_W - 10,letter_I = letter_I - 10,letter_N = letter_N - 10,letter_K = letter_K - 10
                    where addr = ? `
                    await updateQuery(sql2, [addr], t)
                    // RANDOM TRX
                    const luck = getRandomInt(1, 1000)
                    let randomTRX = 0
                    if (luck <= 1) {
                        // 1000~10000 TRX
                        randomTRX = getRandomInt(1000, 10000)
                    } else if (luck <= 30) {
                        // 90~1000 TRX
                        randomTRX = getRandomInt(90, 1000)
                    } else if (luck <= 1000) {
                        // 10~50 TRX
                        randomTRX = getRandomInt(10, 50)
                    }
                    //send
                    await sendTRX(addr, randomTRX)
                } else {
                    throw new Error("not enough letter!")
                }
            }
        }
    })
}

async function sellCard(type, addr, letter, sign) {
    //签名校验
    let signResult = await tronUtils.verifySignature(sign, addr);
    if (!signResult) {
        //
    }
    await sequelize.transaction(async (t) => {
        const sql1 = `select * from tron_bet_event.mine_letter where addr = ?`
        const data1 = await rawQuery(sql1, [addr], t)
        //
        if (data1.length > 0) {
            let res = {
                'letter_D': Number(data1[0].letter_D),
                'letter_I': Number(data1[0].letter_I),
                'letter_C': Number(data1[0].letter_C),
                'letter_E': Number(data1[0].letter_E),
                'letter_W': Number(data1[0].letter_W),
                'letter_N': Number(data1[0].letter_N),
                'letter_T': Number(data1[0].letter_T),
                'letter_R': Number(data1[0].letter_R),
                'letter_X': Number(data1[0].letter_X),
                'letter_K': Number(data1[0].letter_K),
            }
            if (type === '1') {
                //出售单个字母
                if (Object.keys(res).includes(letter)) {
                    const winNumber = res[letter] || 0
                    const sql2 =
                        `update tron_bet_event.mine_letter 
                    set ${letter} = 0
                    where addr = ? `
                    //
                    await updateQuery(sql2, [addr], t)
                    const winSum = Number(winNumber) * 10
                    //todo send done
                    if (winSum > 0) {
                        await sendWin(addr, winSum)
                    }
                } else {
                    throw new Error("fuck letter")
                }
            } else if (type === '2') {
                //出售单个字母
                if (Object.keys(res).includes(letter)) {
                    const sql2 =
                        `update tron_bet_event.mine_letter 
                    set 
                    letter_D = 0,
                    letter_I = 0,
                    letter_C = 0,
                    letter_E = 0,
                    letter_W = 0,
                    letter_N = 0,
                    letter_T = 0,
                    letter_R = 0,
                    letter_X = 0,
                    letter_K = 0
                    where addr = ? `
                    await updateQuery(sql2, [addr], t)
                    //
                    let sumAll = Object.values(res).reduce((a, b) => a + b)
                    const winSum = Number(sumAll) * 10
                    //todo send  done
                    if (winSum > 0) {
                        await sendWin(addr, winSum)
                    }
                } else {
                    throw new Error("fuck letter")
                }
            }
        }
    })
}

module.exports = {
    saveActivityData,
    //
    queryLetterList,
    //
    queryBoxNum,
    //
    querySendLogs,
    // open
    openMineBox,
    // exchange
    exchangeCard,
    //
    sellCard,
}
