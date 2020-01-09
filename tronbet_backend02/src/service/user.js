const nJwt = require('njwt')
const gamemodel = require('../model/gamemodel')
const _ = require('lodash')._
const Tronweb = require('tronweb')

const signingKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3Ryb25iZXQuaW8vIiwic3ViIjoiV2FuZ21hbiIsInNjb3BlIjoiYWxsIiwianRpIjoiODQxY2MwMWEtNTY3Mi00ZDE2LWFkMzYtNzI2ODdjZDcwZWQyIiwiaWF0IjoxNTQxNDk3MzI0LCJleHAiOjE1NDE1MDA5MjR9.QwiPvbW22xK2puq85_sYK4Ao3XoEYuFBcF4KHfS2ZzY"
const { sha256 } = require('js-sha256')

function getUseToken(username, roleId){
    let claims = {
      iss: "https://tronbet.io/",
      sub: roleId,
      scope: "all"
    }

    let jwt = nJwt.create(claims, signingKey);
    let token = jwt.compact();
    return token;
}

function verifyUserToken(token){
    try{
      let verifiedJwt = nJwt.verify(token, signingKey);
      return verifiedJwt;
    }catch(e){
      console.error(e)
      return false;
    }
}


/**
 * 
 * @param {*} ctx 
 * 用户登录接口， 只需要传入用户登录的用户或者密码
 */
async function userLogin(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }
    let username = params.username
    let passwd = params.passwd
    let hash = sha256.create()
    hash.update(passwd)
    let passwdHash = hash.hex()

    let res = await gamemodel.getAdminUser(username, passwdHash)
    if (_.isEmpty(res) || res[0].username != username) {
        return await common.sendMsgToClient(ctx, 402, 'username or passwd invalid')
    }

    // 返回登录用户的权限和token
    let token = common.getUseToken(username, res[0].role)
    return common.sendMsgToClient(ctx, 0, 'success', {token : token, role : res[0].role, username : username})
}


async function getUserInfoBykeyWord(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }
    let keyword = params.keyword
    let page = params.page
    let cate = params.cate
    let sdate = params.sdate
    let edate = params.edate

    let stime =  new Date(sdate).getTime();
    let etime =  new Date(edate).getTime();
    let res = await gamemodel.getUserTransaction(keyword, )

}


module.exports = {
    userLogin,
}

