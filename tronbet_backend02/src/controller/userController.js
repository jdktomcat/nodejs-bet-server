const {addUser, queryUser} = require("../service/backendUser")
const crypto = require('crypto')

function md5Crypto(password) {
    const hash = crypto.createHash('md5')
    hash.update(password)
    //
    const md5Password = hash.digest('hex')
    return md5Password;
}

class UserController {

    /**
     * daily data
     * @param ctx
     * @returns {Promise<void>}
     */
    static async login(ctx) {
        // const params = ctx.body
        const params = ctx.request.body
        const username = params.username || ''
        const password = params.password || ''
        if (password === '') {
            return ctx.body = {code: 500, message: "password is empty!"}
        }
        const u = await queryUser(username)
        if (u.length === 0) {
            return ctx.body = {code: 500, message: "user is not exist!"}
        }
        const pwd = md5Crypto(password)
        if (u[0].password === pwd) {
            ctx.session.user = username;
            ctx.body = {code: 200, message: '登录成功！'};
        } else {
            ctx.body = {code: 500, message: '账号或密码错误！'};
        }
    }

    static async register(ctx) {
        // const params = ctx.body
        const params = ctx.request.body
        console.log("debug-------->",params)
        const username = params.username || '';
        const password = params.password || '';
        if (password === '') {
            return ctx.body = {code: 500, message: "password is empty!"}
        }
        const u = await queryUser(username)
        if (u.length > 0) {
            return ctx.body = {code: 500, message: "user is exist!"}
        }
        const pwd = md5Crypto(password)
        await addUser(username, pwd, '0')
        ctx.body = {success: 200, msg: '创建成功！'};
    }


    static async test(ctx) {
        console.log(6666666666)
        ctx.body = 200
    }

}

module.exports = UserController