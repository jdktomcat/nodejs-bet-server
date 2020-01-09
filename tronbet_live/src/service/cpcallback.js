const conf = require('../configs/config')
const common = require('../utils/common')
const userinfo = require('../model/userinfo')
const redisUtils = require('../utils/redisUtil')
const db = require('../utils/dbUtil')
const crypto = require("crypto")
const coinspaid = require('../configs/config').coinspaid


// 这里充值和提现回调, 充值是到账在加钱, 提现是先扣钱, 在调用第三方打钱到用户账上
// 需要做请求有效性验证
async function depositCallBack(ctx, params) {
    let conn = null
    try {
        conn = await db.getConnection()
        if (conn == null) {
            return await common.sendMsgToClient(ctx, 3002, 'unknown failed')
        }
        conn.beginTransaction()
        for (let param of params) {
            let res = await userinfo.depositSuccess(param, conn)
        }
        conn.commit()
    } catch (error) {
        console.error(error)
        if (conn) conn.release()
        if (error.code === 'ER_DUP_ENTRY') return await common.sendMsgToClient(ctx, 0, 'Success')
        return await common.sendMsgToClient(ctx, 3003, 'error')
    } finally {
        if (conn) conn.release()
    }
    return await common.sendMsgToClient(ctx, 0, 'Success')
}

async function withdrawCallBack(ctx, foreignId, params) {
    console.log(params)
    for (let param of params) {
        await userinfo.withdrawSuccess(foreignId, param.txid)
    }
    return await common.sendMsgToClient(ctx, 0, 'Success')
}

//coinspaid 统一回调地址
async function cpcb(ctx) {
    let headers = ctx.request.headers
    let params = ctx.request.body

    let xkey = headers['X-Processing-Key'] || headers['x-processing-key']
    let xps = headers['X-Processing-Signature'] || headers['x-processing-signature']
    let computedSignature = crypto.createHmac("sha512", coinspaid.secret).update(JSON.stringify(params)).digest("hex")
    console.log(coinspaid.key, computedSignature)
    if (xkey != coinspaid.key || xps != computedSignature) {
        return await common.sendMsgToClient(ctx, 3005, 'reject')
    }

    let types = params.type
    let status = params.status
    if (status != 'confirmed') {
        return await common.sendMsgToClient(ctx, 3001, 'error')
    }
    if (types == 'withdrawal') {
        return await withdrawCallBack(ctx, params.foreign_id, params.transactions)
    } else if (types == 'deposit'){
        return await depositCallBack(ctx, params.transactions)
    }
}

module.exports = {
    cpcb,
}