const gamemodel = require('../model/gamemodel')
const common = require('../utils/common')
const _ = require('lodash')._

async function updateNotice(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }

    let content = params.data
    let lan = params.cate
    let title = params.title

    let res = await gamemodel.addNotice(title, lan, content)

    return await common.sendMsgToClient(ctx, 0, '')
}

async function getNoticeContent(ctx) {
    let params = ctx.request.body
    if (_.isEmpty(params)) {
        params = ctx.request.query
    }

    let lan = params.lang
    let res = await gamemodel.getNotice(lan)
    if (_.isEmpty(res)) {
        res = await gamemodel.getNotice('en')
    }
    return await common.sendMsgToClient(ctx, 0, 'success', res[0])
}

async function getActEndTimeAction() {
    let now = Math.floor(new Date().getTime() / 1000)
    this.success({'now' : now, 'end' : now})
}

module.exports = {
    updateNotice,
    getNoticeContent,
    getActEndTimeAction
}