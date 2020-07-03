const {sequelize, rawQuery, updateQuery} = require('../utils/mysqlUtils')
const tronUtils = require("./../utils/tronUtil")

/**
 * params amount不需要*1e6
 */
const sendTRX = async function (addr, amount) {
    //insert 流水
    try {
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
    } catch (e) {
        console.log("sendTRX error is " + e.toString())
        throw e
    }
}
const sendWin = async function (addr, amount) {
    try {
        //insert 流水
        let insertSql = "insert into tron_bet_event.mine_send_log(addr, amount, currency, tx_id, ts) values (?,?,?,?,?)"
        await updateQuery(insertSql, [addr, amount, 'WIN', '', Date.now()])
        let tx = await tronUtils.sendWin(addr, amount)
        //
        const id = tx
        console.log("win id is ", id)
        //
        let updateSql = "update tron_bet_event.mine_send_log set tx_id = ? where addr = ?"
        await updateQuery(updateSql, [id, addr])
    } catch (e) {
        console.log("sendTRX error is " + e.toString())
        throw e
    }
}

// {
//     addr : ''//地址
//     currency:'',//币种
//     amount:0,//
//     box : {
//         normal : 0,
//         silver : 0,
//         gorden : 0,
//         hero : 0
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
                // history
                let insertSql = "insert into tron_bet_event.mine_box(addr, amount,currency,type, boxNum ,ts) values (?, ?,?,?,?,?)"
                await updateQuery(insertSql, [addr, amount, currency, k, boxNum, Date.now()], t)
                //
                let sql1 = "select * from tron_bet_event.mine_box_count where addr = ? and type = ?"
                let r1 = await rawQuery(sql1, [addr, k], t)
                if (r1.length === 0) {
                    let sql2 = "insert into tron_bet_event.mine_box_count(addr,type,boxNum) values (?, ?,?)"
                    await updateQuery(sql2, [addr, k, boxNum], t)
                } else {
                    let sql3 = "update tron_bet_event.mine_box_count set boxNum = boxNum + ? where addr = ? and type = ?"
                    await updateQuery(sql3, [boxNum, addr, k], t)
                }
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
    let sql1 = "select addr,type,boxNum from tron_bet_event.mine_box_count where addr = ? and type != 'hero' "
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
    let sql1 = "select * from tron_bet_event.mine_send_log order by ts desc limit 20"
    let r1 = await rawQuery(sql1, [])
    return r1
}


/**
 * 排行榜
 */
const queryHeroList = async function (addr) {
    let sql1 = "select addr,sum(boxNum) as amount from tron_bet_event.mine_box where type = 'hero' group by addr order by sum(boxNum) desc"
    let r1 = await rawQuery(sql1, [])
    //
    let sum = 0
    let self_info = {
        addr: addr,
        amount: 0,
        trx: 0,
    }
    r1.forEach(e => {
        const tmp = e.amount || 0
        sum += tmp
    })
    //
    const trx_amount = 30 * 10000
    r1.forEach(k => {
        const addr_row = k.addr || 0
        const tmp = k.amount || 0
        const tmp2 = tmp / sum * trx_amount
        const tmp3 = Math.floor(tmp2 * 100) / 100
        k.trx = tmp3 + 'TRX'
        //
        k.addr = addr_row.slice(0, 5) + "...." + addr_row.slice(addr_row.length - 5)
        if (addr_row === String(addr).trim()) {
            self_info.amount = tmp
            self_info.trx = tmp3 + 'TRX'
        }
    })
    const rs = {
        amount_sum: sum,
        self_info: self_info,
        data: r1
    }
    return rs
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
    // console.log("sumAll ", sumAll)
    let luckyNum = getRandomInt(1, sumAll)
    let sum = 0
    const keys = ["letter_D", "letter_I", "letter_C", "letter_E", "letter_W", "letter_N", "letter_T", "letter_R", "letter_X", "letter_K"]
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        sum += multi[k]
        if (luckyNum <= sum) {
            return k
        }
    }
}

const oneTypeBoxRate = function (type) {
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
    let mutil = {}
    for (let i = 0; i < cardNum; i++) {
        let l = randomLetter()
        if (Object.keys(mutil).includes(l)) {
            mutil[l] = mutil[l] + 1
        } else {
            mutil[l] = 1
        }
    }
    return mutil
}


const openMineBox = async function (type, addr) {
    if (type === 'all') {
        let sql1 = "select addr,type,boxNum from tron_bet_event.mine_box_count where addr = ?"
        let r1 = await rawQuery(sql1, [addr])
        let k = {}
        r1.forEach(e => {
            let tmpBoxNum = e.boxNum || 0
            k[e['type']] = Number(tmpBoxNum)
        })
        let lastDict = {
            'letter_D': 0,
            'letter_I': 0,
            'letter_C': 0,
            'letter_E': 0,
            'letter_W': 0,
            'letter_N': 0,
            'letter_T': 0,
            'letter_R': 0,
            'letter_X': 0,
            'letter_K': 0,
        }
        const lastKeys = Object.keys(lastDict)
        //
        const boxType = {
            normal: 'normal',
            silver: 'silver',
            gorden: 'gorden',
        }
        //
        for (let i = 0; i < k.normal; i++) {
            const tmp_dict = oneTypeBoxRate(boxType.normal)
            lastKeys.forEach(kk => {
                let tmp = tmp_dict[kk] || 0
                lastDict[kk] = lastDict[kk] + tmp
            })
        }
        for (let i = 0; i < k.silver; i++) {
            const tmp_dict = oneTypeBoxRate(boxType.silver)
            lastKeys.forEach(kk => {
                let tmp = tmp_dict[kk] || 0
                lastDict[kk] = lastDict[kk] + tmp
            })
        }
        for (let i = 0; i < k.gorden; i++) {
            const tmp_dict = oneTypeBoxRate(boxType.gorden)
            lastKeys.forEach(kk => {
                let tmp = tmp_dict[kk] || 0
                lastDict[kk] = lastDict[kk] + tmp
            })
        }
        return await sequelize.transaction(async (t) => {
            if (k.normal > 0) {
                let subSql1 = "update tron_bet_event.mine_box_count set boxNum = boxNum - ? where addr = ? and type = ? "
                await updateQuery(subSql1, [k.normal, addr, boxType.normal], t)
            }
            //
            if (k.silver > 0) {
                let subSql2 = "update tron_bet_event.mine_box_count set boxNum = boxNum - ? where addr = ? and type = ? "
                await updateQuery(subSql2, [k.silver, addr, boxType.silver], t)
            }
            //
            if (k.gorden > 0) {
                let subSql3 = "update tron_bet_event.mine_box_count set boxNum = boxNum - ? where addr = ? and type = ? "
                await updateQuery(subSql3, [k.gorden, addr, boxType.gorden], t)
            }
            //
            for (let l of lastKeys) {
                let count = lastDict[l]
                if (count > 0) {
                    let updateCountSql = `update tron_bet_event.mine_letter set ${l} = ${l} + ? where addr = ?`
                    await updateQuery(updateCountSql, [count, addr], t)
                } else {
                    delete lastDict[l]
                }
            }
            return [lastDict]
        })
    } else {
        return await sequelize.transaction(async (t) => {
            let subSql = "update tron_bet_event.mine_box_count set boxNum = boxNum - 1 where addr = ? and type = ? "
            await updateQuery(subSql, [addr, type], t)
            const oneRate = oneTypeBoxRate(type)
            const keys = Object.keys(oneRate)
            for (let l of keys) {
                let count = oneRate[l]
                if (count > 0) {
                    let updateCountSql = `update tron_bet_event.mine_letter set ${l} = ${l} + ? where addr = ?`
                    await updateQuery(updateCountSql, [count, addr], t)
                } else {
                    delete oneRate[l]
                }
            }
            return [oneRate]
        })
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
const randomTrxNum = function () {
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
    return randomTRX
}

const exchangeCard = async function (type, addr) {
    return await sequelize.transaction(async (t) => {
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
                    console.log("enter exchange TRX ")
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
                    return 10 + 'TRX'
                } else {
                    throw new Error("not enough letter!")
                }
            } else if (type === '2') {
                if (res.letter_D >= 10 && res.letter_I >= 10 && res.letter_C >= 10 && res.letter_E >= 10) {
                    console.log("enter exchange DICE ")
                    // send 40TRX
                    const sql2 =
                        `update tron_bet_event.mine_letter 
                    set letter_D = letter_D - 10,letter_I = letter_I - 10,letter_C = letter_C - 10,letter_E = letter_E - 10
                    where addr = ? `
                    await updateQuery(sql2, [addr], t)
                    // send
                    //
                    await sendTRX(addr, 40)
                    return 40 + 'TRX'
                } else {
                    throw new Error("not enough letter!")
                }
            } else if (type === '3') {
                if (res.letter_W >= 100 && res.letter_I >= 100 && res.letter_N >= 100) {
                    console.log("enter exchange WIN ")
                    // send 5000WIN
                    const sql2 =
                        `update tron_bet_event.mine_letter 
                    set letter_W = letter_W - 10,letter_I = letter_I - 10,letter_N = letter_N - 10
                    where addr = ? `
                    await updateQuery(sql2, [addr], t)
                    // send
                    await sendWin(addr, 5000)
                    //
                    return 5000 + 'WIN'
                } else {
                    throw new Error("not enough letter!")
                }
            } else if (type === '4') {
                if (res.letter_W >= 10 && res.letter_I >= 10 && res.letter_N >= 10 && res.letter_K >= 10) {
                    console.log("enter exchange WINK ")
                    // send random trx
                    const sql2 =
                        `update tron_bet_event.mine_letter 
                    set letter_W = letter_W - 10,letter_I = letter_I - 10,letter_N = letter_N - 10,letter_K = letter_K - 10
                    where addr = ? `
                    await updateQuery(sql2, [addr], t)
                    const trxNum = randomTrxNum()
                    //send
                    await sendTRX(addr, trxNum)
                    return trxNum + 'TRX'
                } else {
                    throw new Error("not enough letter!")
                }
            }
        }
    })
}

async function sellCard(type, addr, letter_array) {
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
            const letterKeys = Object.keys(res)
            if (!letter_array instanceof Array) {
                throw new Error("letter_array is not array !")
            }
            if (type === '1') {
                //出售单个字母
                for (let letter of letter_array) {
                    if (letterKeys.includes(letter)) {
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
                }
            } else if (type === '2') {
                //出售所有字母
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
    //
    queryHeroList
}
