const {addUser, queryUser, addOldUser, removeOldUser, removeNewUser} = require("../service/backendUser")
const crypto = require('crypto')
const sha256 = require('js-sha256')

function md5Crypto(password) {
    const hash = crypto.createHash('md5')
    hash.update(password)
    //
    const md5Password = hash.digest('hex')
    return md5Password;
}

function getRole(username) {
    const admin = {
        '/activation': "游戏管理",
        '/edition': "定时产品倍率关闭",
    }
    const others = {
        '/typeAdmin': "游戏统计",
        '/lossList': "亏损排行",
        "/getDrainageList":"引流管理",
        "/userTop":"玩家排行",
        "/LiveGame":"liveGame查询",
        "/liveManey":"live余额查询",
        "/liveEMList":"EM流水查询",
        "/liveHub88List":"Hub88流水查询",
        "/liveSportList":"Sport流水查询",
    }
    //
    if(username === 'admin'){
        return Object.assign({},admin,others)
    }else {
        return others
    }
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
        if (u[0].password === pwd && u[0].username === username) {
            ctx.session.user = username;
            //
            const data = getRole(username)
            ctx.body = {code: 200, message: '登录成功！',data:data};
        } else {
            ctx.body = {code: 500, message: '账号或密码错误！'};
        }
    }

    static async register(ctx) {
        // const params = ctx.body
        const params = ctx.request.body
        console.log("debug-------->", params)
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


    static async addOld(ctx) {
        const params = ctx.request.body
        console.log("debug-------->", params)
        const username = params.username || '';
        const password = params.password || '';
        const role = params.role || '';
        if (password === '') {
            return ctx.body = {code: 500, message: "password is empty!"}
        }
        //
        let hash = sha256.create();
        hash.update(password);
        let passwdHash = hash.hex();
        //
        const data = await addOldUser(username, passwdHash, role)
        ctx.body = {success: 200, msg: '创建成功！', data};
    }


    static async removeOldUser(ctx) {
        const params = ctx.request.body
        console.log("debug-------->", params)
        const username = params.username || '';
        const data = await removeOldUser(username)
        ctx.body = {success: 200, msg: '移除成功！', data};
    }

    static async removeNewUser(ctx) {
        const params = ctx.request.body
        console.log("debug-------->", params)
        const username = params.username || '';
        const data = await removeNewUser(username)
        ctx.body = {success: 200, msg: '移除成功！', data};
    }

}

module.exports = UserController