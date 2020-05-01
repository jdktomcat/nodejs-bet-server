const fileGenerate = function (ctx, sbody) {
    const Readable = require('stream').Readable;
    const s = new Readable();
    s._read = () => {
    }; // redundant? see update below
    s.push(sbody);
    s.push(null);
    //
    const name = ctx.request.query.type || ''
    const startDate = ctx.request.query.startDate || ''
    const endDate = ctx.request.query.endDate || ''
    let fileName = name + '_' + startDate + "_" + endDate + ".xls"
    if(startDate === '' && endDate === ''){
        const addr = ctx.request.query.addr || '';
        if(addr === ''){
            //给个临时名
            fileName = new Date().toJSON() + '.xls'
        }else {
            //给个临时名
            fileName = addr + '.xls'
        }
    }
    ctx.response.set('Content-disposition', `attachment;filename=${fileName}`);
    ctx.response.set("content-type", "txt/html");
    ctx.body = s
}

class CtxUtils {

    static file(ctx, sbody) {
        fileGenerate(ctx, sbody)
    }

    static businessCheck(ctx) {
        const params = ctx.query
        const type = params.type || ''
        params.startDate = params.startDate || ''
        params.endDate = params.endDate || ''
        const typeArray = ["dice", "moon", "ring", "duel", "em", "hub88", "sport", "poker", "platius","binary"]
        if (!typeArray.includes(type)) {
            ctx.body = {code: 500, message: "type error!"}
            return false
        }
        return true
    }

    static checkDate(params) {
        let startDate = params.startDate || ''
        let endDate = params.endDate || ''
        const sign = startDate.length === 10 && endDate.length === 10
        const sign2 = startDate[4] === '-' && endDate[4] === '-'
            && startDate[7] === '-' && endDate[7] === '-'
        const sign3 = startDate.split("-").every(e => Number(e))
        const sign4 = endDate.split("-").every(e => Number(e))
        const typeSign = !(sign && sign2 && sign3 && sign4)
        return typeSign
    }

    static error(msg) {
        return {
            code: 500,
            msg: msg,
            data: []
        }
    }

    static success(data) {
        return {
            code: 200,
            msg: "success",
            data: data
        }
    }
}

module.exports = CtxUtils