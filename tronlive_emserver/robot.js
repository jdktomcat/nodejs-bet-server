const tronUtils = require('./src/utils/tronUtil')

const redisUtil = require('./src/utils/redisUtil')

const common = require('./src/utils/common')

const db = require('./src/utils/dbUtil')

const tronweb = tronUtils.getTronWeb('master')

const axios = require('axios')

let host = 'https://liveapi.tronbet.io'

async function getAllAddrInfo() {
    let one = await redisUtil.hget('tronbet:live:addrinfo', 'info')
    if (!one) {
        return null
    }
    return JSON.parse(one)
}

async function testLogin(addr, sign) {
    let {data} = await axios({
        url : host  + "/user/login",
        data : {
            addr  :addr,
            sign : sign,
        },
        headers: { 'content-type': 'application/json'},
    })
    await updateSession(addr, data.data.sessionId)
    console.log(data)
}

async function testPlay() {
    let {data} = await axios({
        url : host  + "/play",
        data : {
            session_id : 'abcde1234532333',
            game : 'poker',
            game_id : '123123',
            finished : true,
            actions : [
                {
                    action : 'bet',
                    amount : 5,
                    action_id : '3',
                    jackpot_contribution : 0.001,
                },
                {
                    action : 'win',
                    amount : 10,
                    action_id : '4',
                    jackpot_contribution : 0.001,
                }
            ]
            
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}


async function testWithDraw() {
    let {data} = await axios({
        url : host  + "/user/withdraw",
        data : {
            addr  : 'TQRMbC9WRmqatjeZShNBznsBUj1Ypo2Ndc',
            sign : 'abcdef11',
            asd : '........',
            amount : 100,
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function tesPlatBalance() {
    let {data} = await axios({
        url : host  + "/user/balance",
        data : {
            addr  : 'TQRMbC9WRmqatjeZShNBznsBUj1Ypo2Ndc',
            sign : 'abcdef11',
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}


async function charge() {
    let result = await tronUtils.tronExec('41f9529ea18844aff7faca04443beffc74832b8232', 'Deposit()', 5e6, 20e6, [])
    console.log(result)
}

async function testGetAccount() {
    let {data} = await axios({
        url : host  + "",
        method : 'post',
        data : {
            "ApiVersion": "1.0",
            "LoginName": "EMOpenUser2019",
            "Password": "EM!@#avg$%^&*()_2019",
            "Request": "GetAccount",
            "OperatorId": 6,
            "SessionId": "92d721efcd78dbd14d186a111ef9603270be9a3ffcc70039c7869f614d05ce2f"
         },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function testGetBalance() {
    let {data} = await axios({
        url : host  + "/GetBalance",
        method : 'post',
        data : {
            "ApiVersion": "1.0",
            "LoginName": "EMOpenUser2019",
            "Password": "EM!@#avg$%^&*()_2019",
            "Request": "GetBalance",
            "OperatorId": 6,
            "SessionId": "92d721efcd78dbd14d186a111ef9603270be9a3ffcc70039c7869f614d05ce2f",
            "AccountId": "TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP3"
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}


async function Wager(sessionId, addr) {
    let uuid = common.getRandomSeed(40)
    let tractionId = Math.floor(Math.random(0, 1) * 100000000000)
    let {data} = await axios({
        url : host  + "",
        method : 'post',
        data : {
            "ApiVersion": "1.0",
            "LoginName": "EMOpenUser2019",
            "Password": "EM!@#avg$%^&*()_2019",
            "OperatorId": 6,
            "SessionId": sessionId,
            "AccountId": addr,
            "Request": "Wager",
            "Amount": 600000,
            "Device": "desktop",
            "GameType": "tablegames",
            "GPGameId": "livegames",
            "EMGameId": "space-lights-pc",
            "GPId": 789,
            "Product": "casino",
            "RoundId": uuid,
            "TransactionId": tractionId,
            "RoundStatus": "closed"
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function Result(sessionId, addr) {
    let uuid = common.getRandomSeed(40)
    let tractionId = Math.floor(Math.random(0, 1) * 100000000000)
    let {data} = await axios({
        url : host  + "",
        method : 'post',
        data : {
            "ApiVersion": "1.0",
            "LoginName": "EMOpenUser2019",
            "Password": "EM!@#avg$%^&*()_2019",
            "OperatorId": 6,
            "SessionId": sessionId,
            "AccountId": addr,
            "Request": "Result",
            "Amount": 800000,
            "Device": "desktop",
            "GameType": "tablegames",
            "GPGameId": "livegames",
            "GPId": 789,
            "EMGameId": "space-lights-pc",
            "Product": "casino",
            "Device": "desktop",
            "RoundId": uuid,
            "RoundStatus": "closed",
            "TransactionId": tractionId,
            "VendorData": "FiveCards",
            "BetPayload": 50
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function RollBack() {
    let {data} = await axios({
        url : host  + "",
        method : 'post',
        data : {
            "ApiVersion": "1.0",
            "LoginName": "EMOpenUser2019",
            "Password": "EM!@#avg$%^&*()_2019",
            "OperatorId": 6,
            "SessionId": "92d721efcd78dbd14d186a111ef9603270be9a3ffcc70039c7869f614d05ce2f",
            "AccountId": "TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP3",
            "Request": "Rollback",
            "OperatorId": 6,
            "Amount": "25.25",
            "GameType": "tablegames",
            "GPGameId": "livegames",
            "EMGameId": "space-lights-pc",
            "GPId": 789,
            "Product": "casino",
            "Device": "mobile",
            "RoundId": "123e4567-e89b-12d3-a456-426655332222",
            "TransactionId": 12345
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}


async function GetTransactionStatus() {
    let {data} = await axios({
        url : host  + "",
        method : 'post',
        data : {
            "ApiVersion": "1.0",
            "LoginName": "EMOpenUser2019",
            "Password": "EM!@#avg$%^&*()_2019",
            "TransactionId": 12345
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}


async function testGames() {
    let {data} = await axios({
        url : host  + "/user/games",
        method : 'post',
        data : {
            addr  : 'TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP3',
            sign : 'abcdef11',
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function testVerify() {
    let {data} = await axios({
        url : host  + "/user/verify",
        method : 'post',
        data : {
            addr  : 'TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP3',
            session_id : 'ae5e49965656528081cacc0f1b27fa10dc8785830728b16c87cc90c7bef0305d',
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function createAddrs(num) {
    let result = []
    for(let i =0; i<num; i++) {
        let info = await tronweb.createAccount()
        result.push(info)
    }
    return result
}


async function getSign(privateKey) {
    let timestamp = Math.floor(Date.now() / 1000)
    let utf8Str = "tronbet"
    hexStr = tronweb.fromUtf8(utf8Str)
    let addr = tronweb.defaultAddress.base58
    let sign = await tronweb.trx.sign(hexStr, privateKey)
    return sign
}

async function testGetAccountInfo() {
    let result = await tronUtils.getAccountName('TLA8xpn9uS7Wc5rdS8LLJJvQ3WbPVaitP3')
    console.log(result)
}

async function saveAddrInfo(addr, privateKey){
    let sql = 'insert into robot(addr, privateKey) values(?,?)'
    await db.exec(sql, [addr, privateKey])
}

async function updateSession(addr, SessionId) {
    let sql = "update robot set sessionId = ? where addr = ?"
    await db.exec(sql, [SessionId, addr])
}

async function getALLUsers() {
    let sql = "select * from robot limit 500"
    return await db.exec(sql, [])
}

async function registUser() {
    let addrs = await createAddrs(100)
    for (let one of addrs) {
        await saveAddrInfo(one.address.base58, one.privateKey)
        let sign  = await getSign(one.privateKey)
        let addr = one.address.base58
        console.log('addr,sign----------------->', addr,sign)
        testLogin(addr, sign)
        await common.sleep(15)
    }
}

async function testBet() {
    let users = await getALLUsers()
    for (let one of users) {
        Wager(one.sessionId, one.addr)
        Result(one.sessionId, one.addr)
        await common.sleep(1)
    }
}

async function main() {
    // await testBet()
    await registUser()
}
main()
