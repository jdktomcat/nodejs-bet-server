const model = require("./../model/mine")
const tronUtils = require("./../utils/tronUtil");
const notDebug = true

class mineController {

    static async test(ctx) {
        const {addr} = ctx.request.query || {}
        const a = {
            addr: addr,   //地址
            currency: 'TRX',//币种
            amount: 1000,//
            box: {
                normal: 3000,
                silver: 2000,
                gorden: 1000
            }
        }
        const data = await model.saveActivityData(a)
        return ctx.body = {code: 200, data: data, message: "success"}
    }

    static async queryBoxNum(ctx) {
        // console.log("ctx.body ",ctx.request.body)
        const {addr} = ctx.request.body || {}
        const data = await model.queryBoxNum(addr)
        return ctx.body = {code: 200, data: data, message: "success"}
    }

    static async queryLetterList(ctx) {
        const {addr} = ctx.request.body || {}
        const data = await model.queryLetterList(addr)
        return ctx.body = {code: 200, data: data, message: "success"}
    }

    static async querySendLogs(ctx) {
        const {addr} = ctx.request.body || {}
        const data = await model.querySendLogs(addr)
        return ctx.body = {code: 200, data: data, message: "success"}
    }

    static async queryHeroList(ctx) {
        const addr = ctx.request.query.addr || ''
        if(addr === ''){
            return ctx.body = {code: 500, message: 'addr error!', data: []}
        }
        const data = await model.queryHeroList()
        return ctx.body = {code: 200, data: data, message: "success"}
    }

    /**
     * type : normal,silver,gorden
     */
    static async openMineBox(ctx) {
        const {addr, type, sign} = ctx.request.body || {}
        //签名校验
        let signResult = await tronUtils.verifySignature(sign, addr);
        if (notDebug && !signResult) {
            return ctx.body = {code: 500, message: 'identify error!', data: []}
        }
        try {
            const data = await model.openMineBox(type, addr)
            return ctx.body = {code: 200, data: data, message: "success"}
        } catch (e) {
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
        const {type, addr, sign} = ctx.request.body || {}
        //签名校验
        let signResult = await tronUtils.verifySignature(sign, addr);
        if (notDebug && !signResult) {
            return ctx.body = {code: 500, message: 'identify error!', data: []}
        }
        try {
            const data = await model.exchangeCard(type, addr)
            ctx.body = {
                code: 200,
                data: data,
                message: "success"
            }
        } catch (e) {
            return ctx.body = {code: 500, message: e.toString(), data: []}
        }
    }

    /**
     *  type : 1 单个字母
     *         2 所有字母
     */
    static async sellCard(ctx) {
        const {addr, type, sign, letter} = ctx.request.body || {}
        //签名校验
        let signResult = await tronUtils.verifySignature(sign, addr);
        if (notDebug && !signResult) {
            return ctx.body = {code: 500, message: 'identify error!', data: []}
        }
        try {
            const data = await model.sellCard(type, addr, letter)
            return ctx.body = {code: 200, data: data, message: "success"}
        } catch (e) {
            return ctx.body = {code: 500, message: e.toString(), data: []}
        }
    }

}

module.exports = mineController