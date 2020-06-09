const nodemailer = require('nodemailer')
const conf = require('../configs/config')
const common = require('../utils/common')
const userinfo = require('../model/userinfo')
const redisUtils = require('../utils/redisUtil')
const coinspaid = require('./coinspaid')
const db = require('../utils/dbUtil')
const _ = require('lodash')._
const TronWeb = require('tronweb')
const oldAccount = require('./user')
const svgCaptcha = require('svg-captcha')
const axios = require('axios')
const events = require('events')
const tronUtils = require('../utils/tronUtil')

const appEvent = new events.EventEmitter()
const HmCrypto = require('hm-crypto-nodejs')
const digestType = 'RSA-SHA256';
const publicKey  = conf.swaghub.swagPublick
const privateKey = conf.swaghub.privetKey
const geoip = require('geoip-lite')

// init with default keypair and digest type
const hmCrypto = HmCrypto(digestType, privateKey, publicKey);

let transporter = null
async function initMail() {
    transporter = nodemailer.createTransport({
        host: conf.mail.host,
        port: conf.mail.port,
        secure: true, // true for 465, false for other ports
        auth: {
            user: conf.mail.user, // generated user
            pass: conf.mail.pass // generated ethereal password
        }
    })
}
initMail().catch(console.error)

async function sendMail(to, subject, text) {
    let info = await transporter.sendMail({
        from: conf.mail.from, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        // text: text, // plain text body
        html :'Dear ' + to + '<br><br>' +
        `<p>&nbsp;&nbsp;&nbsp;&nbsp;The verification code for your action request is <b>` + text + ` </b>(this code will expire in 2 minutes),please
        enter the code for further action.</p>`
    })
    console.log(info)
}

async function sendMailLink(to, subject, text) {
    let info = await transporter.sendMail({
        from: conf.mail.from, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        // text: text, // plain text body
        html :'Dear ' + to + '<br>' +
        `<p>&nbsp;&nbsp;&nbsp;&nbsp;Please click on the link below for reseting your password: <br> <br>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href='`+ text +`'>Click here to reset passoword</a> <br> <br>
        &nbsp;&nbsp;The link will expire in 30 minutes, please ensure you click on the link and complete the further action.</p>`
    })
    console.log(info)
}

async function sendUserVerifyCode(ctx) {
    const params = ctx.request.body
    const email = params.email
    console.log(email)
    let reg = /^([a-zA-Z]|[0-9])(\w|\-|\.)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$/
    if (!reg.test(email)) {
        return await common.sendMsgToClient(ctx, 2001, 'email address error')
    }

    let res = await userinfo.getSendCodeHist(email, 60)
    if (res) {
        return await common.sendMsgToClient(ctx, 2002, 'Send email too much')
    }

    let registerCode = common.getRandomSeed(8)

    await userinfo.addRegisterCode(email, registerCode)
    let sendInfo = await sendMail(email, conf.mail.registerSub, registerCode)
    return await common.sendMsgToClient(ctx, 0, 'success', {cntDown : 60})
}

async function userRegister(ctx) {
    const params = ctx.request.body
    const email = params.email
    let pass = params.pass
    let verifyCode = params.verifyCode
    let res = await userinfo.getRegisterCodeByEmail(email, verifyCode, 120)
    if (!res) {
        return await common.sendMsgToClient(ctx, 2003, 'verify code invalid')
    }

    if (!pass) {
        return common.sendMsgToClient(ctx, 2032, 'register info invalid')
    }

    let reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,16}$/
    if (!reg.test(pass)) {
        return common.sendMsgToClient(ctx, 2032, 'register info invalid')
    }

    let passwd = common.hashPass(pass)
    let head = params.head || '10001'    // 默认头像
    let nickName = params.nickName || email.split('@')[0] // 随机一个默认昵称

    let nickNameCheck = /^[a-zA-Z0-9_-]{4,16}$/
    if (!nickNameCheck.test(nickName)) return common.sendMsgToClient(ctx, 2033, 'register info invalid')
    //添加用户信息
    try {
        let res = await userinfo.addAccount(email, nickName, head, passwd)
    } catch (error) {
        console.log(error)
        return await common.sendMsgToClient(ctx, 2034, 'register info invalid')
    }

    await common.sendMsgToClient(ctx, 0, 'register success!')

}

async function userLogin(ctx) {
    const params = ctx.request.body
    const email = params.email
    let pass = params.pass
    let verifyCode = params.verifyCode
    let addr = params.addr
    let uniKey = params.uniKey
    let ip = ctx.request.ip

    //如果参数中含有地址, 按照之前的老的方式进行签名登录
    if (addr && TronWeb.isAddress(addr)) {
        return await oldAccount.login(ctx)
    }

    let checkCount = await redisUtils.hget('accountLoginCheckTimes' + email, ip)
    if (checkCount && checkCount >= 10) {
        return await common.sendMsgToClient(ctx, 2005, 'Failed too much times, account locked!') // 登录错误次数不能超过10次
    }
    // let codeRes = await userinfo.getRegisterCodeByEmail(email, verifyCode, 120)
    // if (!codeRes) {
    //     await redisUtils.hincrby('accountLoginCheckTimes' + email, email, 1)
    //     return await common.sendMsgToClient(ctx, 2003, 'Verify code invalid')
    // }

    if (!verifyCode) return await common.sendMsgToClient(ctx, 2003, 'Verify code invalid')

    verifyCode = verifyCode.toLocaleLowerCase()

    let codeRes = await redisUtils.get(uniKey)
    console.log(verifyCode, codeRes, uniKey)
    if (codeRes != verifyCode) {
        return await common.sendMsgToClient(ctx, 2003, 'Verify code invalid')
    }

    await redisUtils.hset('liveLocalVerifyCode', ip, 0)

    let passwd = common.hashPass(pass)
    let uid = await userinfo.getUserByPasswd(email, passwd)
    if (_.isEmpty(uid)) {
        await redisUtils.hincrby('accountLoginCheckTimes' + email, ip, 1)
        return await common.sendMsgToClient(ctx, 2004, 'Login info invalid')
    }

    // 设置默认的货币
    let currency = uid[0].currency ||'BTC'

    //让老的authToken立即失效
    let oldAuthToken = await redisUtils.hget('liveSession', uid[0].email)
    if (oldAuthToken) await redisUtils.del(oldAuthToken)


    let sessionId = uid[0].sessionId
    if (!sessionId || sessionId.length > 40) {
        // 666 混淆一下 真实id
        let tmpSessionId = String(Number(uid[0].uid) + 666)
        let tmpSessionLength = 40 - tmpSessionId.length
        console.log("debug_sessionId is ",sessionId)
        //
        sessionId = common.getRandomSeed(tmpSessionLength) + tmpSessionId
        try {
            await userinfo.updateSessionId(uid[0].email, sessionId)
        } catch (error) {
            await userinfo.updateSessionId(uid[0].email, sessionId)
        }

    }
    await redisUtils.hset('accountLoginCheckTimes' + email, ip, 0)
    let authToken = common.getRandomSeed(64)
    await redisUtils.hset('liveSession', uid[0].email, authToken)
    await redisUtils.set(authToken, uid[0].email)
    await redisUtils.expire(authToken, 604800) // 设置过期时间为10天

    let lv = await redisUtils.hget("live:player:info:" + uid[0].email, "lv")
    if (!lv) {
        lv = 1
    }

    return await common.sendMsgToClient(ctx, 0,'', {
        authToken : authToken,
        email : uid[0].email,
        lv: lv,
        img: uid[0].head,
        currency: uid[0].currency ||'BTC',
        nickName: uid[0].nickName,
        sessionId: `${sessionId}_${currency}`})
}

async function resetPass(ctx) {
    let params = ctx.request.body
    let email = params.email
    let pass = params.pass
    let verifyCode = params.verifyCode
    let authToken = params.authToken

    let userPreView = await redisUtils.get(authToken)
    if (!userPreView) {
        return common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let checkCount = await redisUtils.hget('accountResetPassCheckTimes', email)
    if (checkCount && checkCount >= 10) {
        return await common.sendMsgToClient(ctx, 2005, 'Failed too much times, account locked!') // 登录错误次数不能超过10次
    }
    let codeRes = await userinfo.getRegisterCodeByEmail(email, verifyCode, 120)
    if (!codeRes) {
        await redisUtils.hincrby('accountResetPassCheckTimes', email, 1)
        return await common.sendMsgToClient(ctx, 2003, 'Verify code invalid')
    }
    let passwd = common.hashPass(pass)
    await userinfo.updateAccountPass(email, passwd)
    await redisUtils.hset('accountResetPassCheckTimes', email, 0)
    await redisUtils.del(authToken)
    return await common.sendMsgToClient(ctx, 0, 'please login again')
}


async function UserDeposit(ctx) {
    let params = ctx.request.body
    let authToken = params.authToken
    let currency = params.currency

    // 暂时屏蔽bnb 充值
    // if(currency.toUpperCase() === 'BNB'){
    //     return common.sendMsgToClient(ctx, 9999, 'Deposit is not currently supported')
    // }

    let userPreView = await redisUtils.get(authToken)
    if (!userPreView) {
        return common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let email = userPreView
    let user = await userinfo.getUserByEmail(email)
    if (_.isEmpty(user)) {
        return common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let userBalanceInfo = await userinfo.getUserDepositAddr(user[0].uid, currency)
    let depositAddr = ''
    let depositTag = ''
    if (!_.isEmpty(userBalanceInfo)) {
        depositAddr = userBalanceInfo[0].addr
        depositTag = userBalanceInfo[0].tag
    } else {
        let data = await coinspaid.getDepositAddr(user[0].uid + '', currency)
        if (!data) {
            return common.sendMsgToClient(ctx, 2007, 'server busy, please try it later')
        }

        let addr = data.data.address
        let tag = data.data.tag || ''
        let foreignId = data.data.foreign_id
        if (foreignId != ('' + user[0].uid)) {
            return common.sendMsgToClient(ctx, 2007, 'server busy, please try it later')
        }
        depositAddr = addr
        depositTag = tag
        await userinfo.addUserDopositAddr(user[0].uid, addr, currency, tag)
    }

    return common.sendMsgToClient(ctx, 0, '', {
        addr: depositAddr,
        tag: depositTag
    })
}

async function userWithdraw(ctx) {
    let params = ctx.request.body
    let authToken = params.authToken
    let currency = params.currency
    let addr = params.addr
    let amount = params.amount
    let verifyCode = params.verifyCode
    let pass = params.pass
    let tag = ""
    if(params.memo){
        tag = String(params.memo)
    }
    if(params.tag){
        tag = String(params.tag)
    }
    
    if(currency.toUpperCase() === 'BNB' && !tag){
        return common.sendMsgToClient(ctx, 2009, 'parameters error!!')
    }

    if(currency.toUpperCase() === 'BNB' && (amount - amount * conf.app.fees) / 1000 < 0.1){
        return common.sendMsgToClient(ctx, 2009, 'parameters error!!')
    }
    // 暂时屏蔽 提现
    // return common.sendMsgToClient(ctx, 9999, 'Withdrawal is not currently supported')

    //如果没有authTOken
    if (!authToken) {
        return oldAccount.withdraw(ctx)
    }

    try {
        amount = Number(amount)
    } catch (error) {
        console.log(error)
        return common.sendMsgToClient(ctx, 2009, 'parameters error!!')
    }

    if (amount < 5 || !currency) {
        return common.sendMsgToClient(ctx, 2009, 'parameters error!!')
    }

    let userPreView = await redisUtils.get(authToken)
    if (!userPreView) {
        return common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let email = userPreView
    let user = await userinfo.getUserByEmail(email)
    if (_.isEmpty(user)) {
        return common.sendMsgToClient(ctx, 2006, 'invalid account')
    }

    let checkCount = await redisUtils.hget('accountLoginCheckTimes', email)
    if (checkCount && checkCount >= 10) {
        return await common.sendMsgToClient(ctx, 2005, 'Failed too much times, account locked!') // 登录错误次数不能超过10次
    }
    let codeRes = await userinfo.getRegisterCodeByEmail(email, verifyCode, 120)
    if (!codeRes) {
        await redisUtils.hincrby('accountLoginCheckTimes', email, 1)
        return await common.sendMsgToClient(ctx, 2003, 'Verify code invalid')
    }


    let passwd = common.hashPass(pass)
    let uid = await userinfo.getUserByPasswd(email, passwd)
    if (_.isEmpty(uid)) {
        return await common.sendMsgToClient(ctx, 2004, 'Login info invalid')
    }

    let maxWithdrawAmount = (conf.withdrawMaxConf[currency] || 0) * 1e9

    if (amount * 1e6 > maxWithdrawAmount) {
        return await common.sendMsgToClient(ctx, 1008, 'withdraw reached max amount!')
    }

    let todayWithdrawTimes = await userinfo.findTodayWithdrawTimes(user[0].email)
    if(todayWithdrawTimes >= conf.app.withdrawMaxTimes) {
        return await common.sendMsgToClient(ctx, 1008, 'withdraw reached max times!!')
    }

    //限制提现金额每天玩家额度
    let todayAmount = await userinfo.findTodayWithdrawAmount(user[0].email, currency)
    if (todayAmount > maxWithdrawAmount) {
        return await common.sendMsgToClient(ctx, 1008, 'withdraw reached max amount!!!')
    }

    let totalAmount = await userinfo.findTodayTotalWithdrawAmount(currency)

    //限制提现金额每天总额度
    if (totalAmount > maxWithdrawAmount * 6 ) return await common.sendMsgToClient(ctx, 1008, 'withdraw reached max amount!!!!')

    let fees = amount * conf.app.fees
    let balance = await userinfo.getUserBalanceByCurrency(user[0].uid, currency)
    if (balance < amount) {
        return await common.sendMsgToClient(ctx, 2010, 'balance not enough')
    }


    let conn = null
    let orderId = common.getRandomSeed(64)
    try {
        conn = await db.getConnection()
        if (conn == null) {
            return await common.sendMsgToClient(ctx, 101, 'unknown failed')
        }
        conn.beginTransaction()
        let res = await userinfo.userWithdrawPre(user[0].uid, email, orderId, currency, addr,  amount * 1e6, conn, tag)
        conn.commit()
    } catch (error) {
        console.error(error)
        if(conn) conn.rollback()
        if (error.code === 'ER_DUP_ENTRY') return await common.sendMsgToClient(ctx, 0, 'Success')
        return await common.sendMsgToClient(ctx, 2010, 'balance not enough')
    } finally {
        if (conn) conn.release()
    }

    appEvent.emit('takeWithdraw', orderId, currency, (amount - fees) / 1000, addr, 20, tag)

    return common.sendMsgToClient(ctx, 0, 'success')
}

appEvent.on('takeWithdraw', (orderId, currency, amount, addr, tryTimes, tag) => {
    let timer = setTimeout(async () => {
        let data = await coinspaid.takeUserWithdraw(orderId, currency, amount, addr, tag)
        if (!data) {
            //如果失败， 则选择继续执行， 最多执行20次， 每次间隔20执行
            await common.sleep(20000)
            appEvent.emit('takeWithdraw', orderId, currency, amount, addr, tryTimes -1, tag)
        }
    }, 500)
})


async function getBalance(ctx) {
    let params = ctx.request.body
    let authToken = params.authToken

    if (!authToken) {
        return oldAccount.userBalance(ctx)
    }

    let userPreView = await redisUtils.get(authToken)
    if (!userPreView) {
        return common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let email = userPreView
    let user = await userinfo.getUserByEmail(email)
    if (_.isEmpty(user)) {
        return common.sendMsgToClient(ctx, 2006, 'invalid account')
    }

    let res = await userinfo.getUserBalanceByUid(user[0].uid)
    let currencys = conf.currency
    let tmp = {}
    for (let one of res) {
        tmp[one.currency] = one
    }

    for (let currency of currencys) {
        if (tmp[currency]) continue
        tmp[currency] = {
            currency: currency,
            balance: 0,
        }
    }
    return await common.sendMsgToClient(ctx, 0, '', _.values(tmp))
}

async function getEMSessionId(ctx) {
    //移除没调用函数
    // let params = ctx.request.body
    // let authToken = params.authToken
    //
    // if (!authToken) {
    //     return oldAccount.login(ctx)
    // }
    //
    // let userPreView = await redisUtils.get(authToken)
    // if (!userPreView) {
    //     return common.sendMsgToClient(ctx, 401, 'not authed account')
    // }
    //
    // let email = userPreView
    // let user = await userinfo.getUserByEmail(email)
    // if (_.isEmpty(user)) {
    //     return common.sendMsgToClient(ctx, 2006, 'invalid account')
    // }
    //
    // let sessionId = user[0].sessionId
    // if(!sessionId || sessionId.length > 40) {
    //     sessionId = common.getRandomSeed(40)
    //     try {
    //         await userinfo.updateSessionId(email, sessionId)
    //     } catch (error) {
    //         sessionId = common.getRandomSeed(40)
    //         await userinfo.updateSessionId(email, sessionId)
    //     }
    // }
    //
    // // let currency = await redisUtils.hget('liveCurrency', '' + user[0].uid)
    // // let cipherSessionId = common.cipher(sessionId + '|' + currency)
    // let currency = user[0].currency
    //
    // return await common.sendMsgToClient(ctx, 0, '', {
    //     sessionId : `${sessionId}_${currency}`,
    //     launchUrl : '',
    //     lv : 1,
    //     name : user[0].nickName,
    //     img : user[0].head
    // })

}

async function getSportsKey(ctx) {
    let params = ctx.request.body
    let authToken = params.authToken

    if (!authToken) {
        return oldAccount.getKey(ctx)
    }

    let userPreView = await redisUtils.get(authToken)
    if (!userPreView) {
        return common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let email = userPreView
    let user = await userinfo.getUserByEmail(email)
    if (_.isEmpty(user)) {
        return common.sendMsgToClient(ctx, 2006, 'invalid account')
    }
    // 999 混淆一下uid
    let uid = String(Number(user[0].uid) + 999)
    let randomLength = 48 - uid.length
    let sportskey = common.getRandomSeed(randomLength) + uid
    try {
        await userinfo.updateUserKey(email, sportskey)
    } catch (error) {
        sportskey = common.getRandomSeed(randomLength) + uid
        await userinfo.updateUserKey(email, sportskey)
    }

    return await common.sendMsgToClient(ctx, 0, '', {
        userKey: sportskey,
        lv: 1,
        name: user[0].nickName,
        img: user[0].head,
    })
}

function hasCurrency(currency) {
    for (let one of conf.currency) {
        if (one == currency) return true
    }
    return false
}

async function setCurrency(ctx) {
    let params = ctx.request.body
    let currency = params.currency
    let authToken = params.authToken

    if (!hasCurrency(currency)) {
        return common.sendMsgToClient(ctx, 2011, 'unsupport currency')
    }

    let userPreView = await redisUtils.get(authToken)
    if (!userPreView) {
        return common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let email = userPreView
    let user = await userinfo.getUserByEmail(email)
    if (_.isEmpty(user)) {
        return common.sendMsgToClient(ctx, 2006, 'invalid account')
    }

    await redisUtils.hset('liveCurrency', '' + user[0].uid, currency)
    await userinfo.setCurrency(currency, user[0].uid)
    return await common.sendMsgToClient(ctx, 0, 'success', {currency})
}

async function generateResetKey(ctx) {
    let params = ctx.request.body
    let email = params.email
    let ip = ctx.request.ip || ''

    //只能两分钟发一次
    let res = await userinfo.getForgotPassCodeLogByIp(ip, email, 120)
    if(!_.isEmpty(res)) return await common.sendMsgToClient(ctx, 2002, 'send too much times')

    let key = common.getRandomSeed(64)
    await userinfo.addForgotPassCode(email, ip, key)
    let auth = common.encrypt(JSON.stringify({key, email}))
    await sendMailLink(email, conf.mail.registerSub, conf.app.clientURL + '?auth='  + auth + "#/platform/live-findPwd")
    return await common.sendMsgToClient(ctx, 0, 'success')
}

async function forgotPass(ctx) {
    let params = ctx.request.body
    let ip = ctx.request.ip
    let key = params.key
    let pass = params.pass

    let checkCount = await redisUtils.hget('accountResetPassCheckTimes', ip)
    if (checkCount && checkCount >= 10) {
        return await common.sendMsgToClient(ctx, 2005, 'Failed too much times, account locked!') // 登录错误次数不能超过10次
    }

    let res = await userinfo.getForgotPassCodeLogByKey(key, 18000)
    console.log(res)
    if (_.isEmpty(res)){
        await redisUtils.hincrby('accountResetPassCheckTimes', ip, 1)
        return await common.sendMsgToClient(ctx, 2021, 'failed')
    }
    let email = res[0].email

    let passwd = common.hashPass(pass)
    await userinfo.updateAccountPass(email, passwd)
    await redisUtils.hset('accountResetPassCheckTimes', ip, 0)
    let oldAuthToken = await redisUtils.hget('liveSession', email)
    if (oldAuthToken) await redisUtils.del(oldAuthToken)

    return await common.sendMsgToClient(ctx, 0, 'please login again')
}

async function getDepositHist(ctx) {
    let params = ctx.request.body
    let authToken = params.authToken
    let page = params.page || 1
    let currency = params.currency

    console.log(params)

    let email = await redisUtils.get(authToken)
    if (!email) {
        return await common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let user = await userinfo.getUserByEmail(email)
    if (_.isEmpty(user)) {
        return await common.sendMsgToClient(ctx, 2006, 'invalid account')
    }

    let cnt = 0
    let logs = null
    if (!currency || currency == 'ALL') {
        cnt = await userinfo.getDepositHistLogsCnt(user[0].uid)
        logs = await userinfo.getDepositHistLogs(user[0].uid, (page - 1) * 20)
    } else {
        cnt = await userinfo.getDepositHistLogsCntByCurrency(user[0].uid, currency)
        logs = await userinfo.getDepositHistLogsByCurrency(user[0].uid, (page - 1) * 20, currency)
    }


    return await common.sendMsgToClient(ctx, 0, '', {logs : logs, total : cnt, totalPage : Math.ceil(cnt / 20), page : page})
}

async function getWithdrawHist(ctx) {
    let params = ctx.request.body
    let authToken = params.authToken
    let page = params.page || 1
    let currency = params.currency

    let email = await redisUtils.get(authToken)
    if (!email) {
        return await common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let user = await userinfo.getUserByEmail(email)
    if (_.isEmpty(user)) {
        return await common.sendMsgToClient(ctx, 2006, 'invalid account')
    }


    let cnt = 0
    let logs = null
    if (!currency || currency == 'ALL') {
        cnt = await userinfo.getWithdrawHistLogsCnt(user[0].uid)
        logs = await userinfo.getWithdrawHistLogs(user[0].uid, (page - 1) * 20)
    } else {
        cnt = await userinfo.getWithdrawHistLogsCntByCurrency(user[0].uid, currency)
        logs = await userinfo.getWithdrawHistLogsByCurrency(user[0].uid, (page - 1) * 20, currency)
    }

    return await common.sendMsgToClient(ctx, 0, '', {logs : logs, total : cnt, totalPage : Math.ceil(cnt / 20), page : page})

}

async function genLocalVerifyCode(ctx) {
    let ip = ctx.request.ip
    let res = await redisUtils.hincrby('liveLocalVerifyCode', ip, 1)
    if (res && res > 100) {
        return await common.sendMsgToClient(ctx, 2031, 'Send too much times')
    }
    let c = svgCaptcha.create({size : 4, noise : 1, background: '#ffffff', width : 100, height : 45, color: false})
    let key = common.hashPass(Date.now().toString() + c.text)
    await redisUtils.set(key, c.text.toLocaleLowerCase())
    await redisUtils.expire(key, 300)
    return await common.sendMsgToClient(ctx, 0, '', {
        uniKey: key,
        svg: c.data
    })
}

async function setAccountHead(ctx) {
    let params = ctx.request.body
    let authToken = params.authToken
    let head = params.img

    let email = await redisUtils.get(authToken)
    if (!email) {
        return await common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let user = await userinfo.getUserByEmail(email)
    if (_.isEmpty(user)) {
        return await common.sendMsgToClient(ctx, 2006, 'invalid account')
    }
    if (user[0].head == head) {
        return await common.sendMsgToClient(ctx, 0, '', {img : head})
    }

    await userinfo.setHead(user[0].uid, head)
    return await common.sendMsgToClient(ctx, 0, '', {img : head})
}

async function getStartUrl(nickName, token, gameId, currency, ip) {
    let ipInfo = geoip.lookup(ip || '127.0.0.1')
    let country = 'EE'
    if (ipInfo) {
        country = ipInfo.country || 'EE'
    }

    let paramas = {
        user: nickName,
        token: token,
        sub_partner_id: null,
        platform: "GPL_DESKTOP",
        operator_id: conf.swaghub.operator_id,
        meta: {
            rating: 10,
            oddsType: "decimal"
        },
        lobby_url: 'https://wink.org',
        lang: "en",
        ip: ip || '127.0.0.1',
        game_id: Number(gameId),
        deposit_url: "",
        currency: currency,
        country:  country,
    }

    let computedSignature = hmCrypto.sign(JSON.stringify(paramas))
    try {
        let {data} = await axios({
            url: conf.swaghub.host + '/operator/generic/v2/game/url',
            method: 'post',
            data: paramas,
            headers: { 'content-type': 'application/json', 'X-Hub88-Signature' : computedSignature},
        })
        console.log(data)
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}

async function getLanchUrl(ctx) {
    let paramas = ctx.request.body
    let game_id = paramas.game_id
    let authToken = paramas.token
    let addr = paramas.addr
    let ip = ctx.request.ip
    // let email = paramas.email

    let email = await redisUtils.get(authToken)

    //处理是trx的时候， 也能启动hub888的游戏
    if (!email) {
        if (TronWeb.isAddress(addr)) {
            // return await common.sendMsgToClient(ctx, 1002, 'tron address error!!!')
            let signResult = await tronUtils.verifySignature(authToken, addr)
            if (!signResult) {
                return await common.sendMsgToClient(ctx, 401, 'sign verify failed!!!!!!!!!')
            }
            email = addr
        }
    }

    let user = await userinfo.getAccountrByEmail(email)
    if (_.isEmpty(user)) {
        return common.sendMsgToClient(ctx, 401, 'not authed account')
    }

    let sessionId = user[0].sessionId
    if(!sessionId || sessionId.length > 40) {
        // 333 混淆一下 真实id
        let tmpSessionId = String(Number(user[0].uid) + 333)
        let tmpSessionLength = 40 - tmpSessionId.length
        //
        sessionId = common.getRandomSeed(tmpSessionLength) + tmpSessionId
        try {
            await userinfo.updateSessionId(email, sessionId)
        } catch (error) {
            await userinfo.updateSessionId(email, sessionId)
        }
    }

    let now = new Date().getTime()
    let thirdToken = sessionId + "|" + game_id + now
    thirdToken = Buffer.from(thirdToken).toString('base64')

    if (user[0].currency == 'USDT') {
        user[0].currency = 'TRX'
    }

    let startUlr = await getStartUrl(user[0].nickName || user[0].email, thirdToken, game_id, user[0].currency, ip)
    if (!startUlr) return common.sendMsgToClient(ctx, 2022, 'failed')

    return common.sendMsgToClient(ctx, 0, '', startUlr)
}

async function getSwaggerGames(ctx) {
    let games = await redisUtils.hget('tronswaggergame', 'games')
    if (!games) {
        games = []
    } else {
        games = JSON.parse(games)
    }
    return await common.sendMsgToClient(ctx, 0, '', games)
}


module.exports = {
    sendUserVerifyCode,
    userRegister,
    userLogin,
    resetPass,
    UserDeposit,
    userWithdraw,
    getBalance,
    getEMSessionId,
    getSportsKey,
    setCurrency,
    generateResetKey,
    forgotPass,
    getDepositHist,
    getWithdrawHist,
    genLocalVerifyCode,
    setAccountHead,
    getLanchUrl,
    getSwaggerGames
}