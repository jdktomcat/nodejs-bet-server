const service = require("../service/service");

const inWhileList = function (headers) {
    const cf_ip = headers['host'] || ''
    const env = process.env.NODE_ENV
    if(env === 'production'){
        console.log("ip is ",cf_ip)
        const whileList = ['92.42.104.130']
        if(whileList.includes(cf_ip.trim())){
            return false
        }else {
            return true
        }
    }else if(env === 'test'){
        const whileList = ['10.132.0.7:9090']
        if(whileList.includes(cf_ip.trim())){
            return false
        }else {
            return true
        }
    }
    return false
}

class apiCall {

    static async identify(ctx) {
        console.log("check balance headers : ",ctx.request.headers)
        const isBlack = inWhileList(ctx.request.headers)
        if(isBlack){
            ctx.status = 400;
            ctx.body = "403 not found"
        }
        const params = ctx.request.body || {}
        const t  = await service.identify(params)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }

    static async buy(ctx) {
        // ctx.status = 400
        // ctx.body = "error"
        const isBlack = inWhileList(ctx.request.headers)
        if(isBlack){
            ctx.status = 400;
            ctx.body = "403 not found"
        }
        const body = ctx.request.body || {}
        const {tokenError, tokenInfo}  = await service.getToken(body)
        if (tokenError) {
            ctx.status = 400;
            return ctx.body = 'check with token!'
        }
        const t  = await service.buy(tokenInfo)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }


    static async close(ctx) {
        // ctx.status = 400
        // ctx.body = "error"
        const isBlack = inWhileList(ctx.request.headers)
        if(isBlack){
            ctx.status = 400;
            ctx.body = "403 not found"
        }
        const body = ctx.request.body || {}
        const {tokenError, tokenInfo}  = await service.getToken(body)
        if (tokenError) {
            ctx.status = 400;
            return ctx.body = 'check with token!'
        }
        const t  = await service.close(tokenInfo)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }

    static async refund(ctx) {
        // ctx.status = 400
        // ctx.body = "error"
        const isBlack = inWhileList(ctx.request.headers)
        if(isBlack){
            ctx.status = 400;
            ctx.body = "403 not found"
        }
        const body = ctx.request.body || {}
        const {tokenError, tokenInfo}  = await service.getToken(body)
        if (tokenError) {
            ctx.status = 400;
            return ctx.body = 'check with token!'
        }
        const t = await service.refund(tokenInfo)
        if(t.code === 2){
            ctx.status = 400;
            ctx.body = t
        }else {
            ctx.body = t
        }
    }
}

module.exports = apiCall
