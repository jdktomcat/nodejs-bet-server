const model = require("./../model/mine")
const tronUtils = require("./../utils/tronUtil");
const redisUtil = require("./../utils/redisUtil");

// await redisUtils.set(authToken, uid[0].email)
// await redisUtils.expire(authToken, 604800) // 设置过期时间为10天
const redisLock = async function (addr) {
    let key = addr + '_event_mine_key'
    const val = await redisUtil.get(key)
    console.log("val lock is ", val,val === true)
    if (val === true || val === 'true') {
        await redisUtil.del(key)
    }
    //
    const val2 = await redisUtil.get(key)
    console.log("val lock2 is ", val2)
    if (val2 === null) {
        await redisUtil.set(key, "lock")
        await redisUtil.expire(key, 5 * 60) // 设置过期时间为5分钟
        return false
    } else {
        if (val2 === 'free') {
            return false
        } else {
            return true
        }
    }
}

const redisUnLock = async function (addr) {
    let key = addr + '_event_mine'
    await redisUtil.set(key, "free")
    const val = await redisUtil.get(key)
    console.log("val end is ", val)
}

class mineController {

    static async queryBoxNum(ctx) {
        console.log("ctx.request.body ", ctx.request.body)
        const {addr} = ctx.request.body || {}
        const data = await model.queryBoxNum(addr)
        console.log("res data is ", data)
        return ctx.body = {code: 200, data: data, message: "success"}
    }

    static async queryLetterList(ctx) {
        console.log("ctx.request.body ", ctx.request.body)
        const {addr} = ctx.request.body || {}
        const data = await model.queryLetterList(addr)
        console.log("res data is ", data)
        return ctx.body = {code: 200, data: data, message: "success"}
    }

    static async querySendLogs(ctx) {
        console.log("ctx.request.body ", ctx.request.body)
        const {addr} = ctx.request.body || {}
        const data = await model.querySendLogs(addr)
        console.log("res data is ", data)
        return ctx.body = {code: 200, data: data, message: "success"}
    }

    static async queryHeroList(ctx) {
        console.log("ctx.request.body ", ctx.request.body)
        const {addr, sign} = ctx.request.body || {}
        if (addr === '') {
            return ctx.body = {code: 500, message: 'addr error!', data: []}
        }
        //签名校验
        let signResult = await tronUtils.verifySignature(sign, addr);
        if (!signResult) {
            return ctx.body = {code: 500, message: 'identify error!', data: []}
        }
        const data = await model.queryHeroList(addr)
        console.log("res data is ", data)
        return ctx.body = {code: 200, data: data, message: "success"}
    }

    /**
     * type : normal,silver,gorden
     */
    static async openMineBox(ctx) {
        console.log("ctx.request.body ", ctx.request.body)
        const {addr, type, sign} = ctx.request.body || {}
        //签名校验
        let signResult = await tronUtils.verifySignature(sign, addr);
        if (!signResult) {
            return ctx.body = {code: 500, message: 'identify error!', data: []}
        }
        const isLock = await redisLock(addr)
        if(isLock){
            console.log("lock!")
            return ctx.body = {code: 500, message: 'lock!', data: []}
        }
        try {
            const data = await model.openMineBox(type, addr)
            console.log("res data is ", data)
            await redisUnLock(addr)
            return ctx.body = {code: 200, data: data, message: "success"}
        } catch (e) {
            await redisUnLock(addr)
            console.log("error is " + e.toString())
            return ctx.body = {code: 500, message: e.toString(), data: []}
        }
    }

    /**
     * type :
     1:  10*T+10*R+10*X=10TRX
     2:  10*D+10*I+10*C+10*E=40TRX
     3: 100*W+100*I+100*N=5000Win
     4: 10*W+10*I+10*N+10*K=10~10000TRX
     */
    static async exchangeCard(ctx) {
        console.log("ctx.request.body ", ctx.request.body)
        const {type, addr, sign} = ctx.request.body || {}
        //签名校验
        let signResult = await tronUtils.verifySignature(sign, addr);
        if (!signResult) {
            return ctx.body = {code: 500, message: 'identify error!', data: []}
        }
        const isLock = await redisLock(addr)
        if(isLock){
            console.log("lock!")
            return ctx.body = {code: 500, message: 'lock!', data: []}
        }
        try {
            const data = await model.exchangeCard(type, addr)
            console.log("res data is ", data)
            await redisUnLock(addr)
            ctx.body = {
                code: 200,
                data: data,
                message: "success"
            }
        } catch (e) {
            await redisUnLock(addr)
            console.log("error is " + e.toString())
            return ctx.body = {code: 500, message: e.toString(), data: []}
        }
    }

    /**
     *  type : 1 单个字母
     *         2 所有字母
     */
    static async sellCard(ctx) {
        console.log("ctx.request.body ", ctx.request.body)
        const {addr, type, sign, letter} = ctx.request.body || {}
        //签名校验
        let signResult = await tronUtils.verifySignature(sign, addr);
        if (!signResult) {
            return ctx.body = {code: 500, message: 'identify error!', data: []}
        }
        const isLock = await redisLock(addr)
        if(isLock){
            console.log("lock!")
            return ctx.body = {code: 500, message: 'lock!', data: []}
        }
        try {
            const data = await model.sellCard(type, addr, letter)
            console.log("res data is ", data)
            await redisUnLock(addr)
            return ctx.body = {code: 200, data: data, message: "success"}
        } catch (e) {
            console.log("error is " + e.toString())
            await redisUnLock(addr)
            return ctx.body = {code: 500, message: e.toString(), data: []}
        }
    }

}

module.exports = mineController