const axios = require('axios')

const host = "http://localhost:8370"

const _ = require('lodash')._

const tronUtils = require('./src/utils/tronUtil')
const redisUtil = require('./src/utils/redisUtil')

async function testLogs() {
    let {data} = await axios({
        url : host  + "/event/logs",
        data : {
            addr  : 'TX4LPLD9V57reDv5auc3uMdQvRnUgXEZXZ',
            sign : 'abcdef11',
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(JSON.stringify(data))
}

async function testBags() {
    let {data} = await axios({
        url : host  + "/event/bags",
        method : 'post',
        data : {
            addr  : 'TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP3',
            sign : 'abcdef11',
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}


async function testopenBox(addr) {
    let {data} = await axios({
        url : host  + "/event/openBox",
        data : {
            addr  : addr,
            sign : 'abcdef11',
            num : 100000,
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function testsell() {
    let {data} = await axios({
        url : host  + "/event/sell",
        data : {
            addr  : 'TQRMbC9WRmqatjeZShNBznsBUj1Ypo2Ndc',
            sign : 'abcdef11',
            num : -1,
            gid : '12'
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function testexchange() {
    let {data} = await axios({
        url : host  + "/event/exchange",
        data : {
            addr  : 'TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP3',
            sign : '0xe47cq35cf499e53e23e1a66697d8cb600b69f2674f50637162e56bc2377dd7d67878f1ff79e37a9e89c027e10f4dcf436ed507ab7d2acc82a93da2dce9f80fb91b,1547454994494',
            num : 2,
            suit_id : 4
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function testrank() {
    let {data} = await axios({
        url : host  + "/event/rank",
        data : {
            addr  : 'TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP3',
            sign : 'abcdef11',
            num : 100,
            suit_id : 0
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}


async function testTotalrank() {
    let {data} = await axios({
        url : host  + "/event/trank",
        method : 'post',
        data : {
            addr  : 'TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP3',
            sign : 'abcdef11',
            num : 100,
            suit_id : 0
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(JSON.stringify(data))
}


async function testluckers() {
    let {data} = await axios({
        url : host  + "/event/luckers",
        method : 'post',
        data : {
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(JSON.stringify(data))
}




async function charge() {
    let result = await tronUtils.tronExec('41f9529ea18844aff7faca04443beffc74832b8232', 'Deposit()', 5e6, 20e6, [])
    console.log(result)
}

async function main() {
    // await testLogs()
    // await testBags()
    // await Promise.all([0,1,2].map(async i => {
    //     await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP1')
    //     await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP2')
    //     await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP4')
    //     await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP5')
    //     await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP6')
    //     await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP7')
    //     await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP8')
    //     await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP9')
    // }))
    for (let i = 0; i< 2000; i++) {
        await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait2')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP4')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP5')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP6')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP7')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP8')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait1')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait2')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait3')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait4')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait6')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait7')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait8')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait9')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait10')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait23')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait1')
        // await testopenBox('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVait22')
    }
    // await testopenBox('TQRMbC9WRmqatjeZShNBznsBUj1Ypo2Ndc')
    // await testsell().catch(error => {
    //     console.log(123123)
    // })
    // await testexchange()
    // await testrank()

    // await testTotalrank()

    // let res = await redisUtil.hincrby('test11', 'test', 200)
    // console.log(res)

    // await testluckers()

    process.exit(0)
}

main()

// let a = ['aaaa', 'bbbb', 'cccc']
// console.log(_.find(a, (c) => {return c == 'aaaa'}))