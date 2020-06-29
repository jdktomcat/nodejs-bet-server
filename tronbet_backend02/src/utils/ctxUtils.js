const fileGenerate = function (ctx, body, fileName) {
    const Readable = require('stream').Readable;
    const content = new Readable();
    content._read = () => {
    }; // redundant? see update below
    content.push(body);
    content.push(null);
    // 优先取自定义名称
    if (!fileName) {
        // 合成文件名称
        const name = ctx.request.query.type || ''
        const startDate = ctx.request.query.startDate || ''
        const endDate = ctx.request.query.endDate || ''
        fileName = name + '_' + startDate + "_" + endDate + ".xls"
        if (startDate === '' && endDate === '') {
            const addr = ctx.request.query.addr || '';
            if (addr === '') {
                //给个临时名
                fileName = new Date().toJSON() + '.xls'
            } else {
                //给个临时名
                fileName = addr + '.xls'
            }
        }
    }
    ctx.response.set('Content-disposition', `attachment;filename=${fileName}`);
    ctx.response.set("content-type", "txt/html");
    ctx.body = content
}

class CtxUtils {

    /**
     * 生成对应的文件
     *
     * @param ctx 参数上下文
     * @param body 文件内容
     * @param fileName 文件名称
     */
    static file(ctx, body, fileName) {
        fileGenerate(ctx, body, fileName)
    }

    /**
     * 根据查询结果生成文件
     * @param ctx 参数上下文
     * @param data 查询结果
     * @param fileName 文件名称
     */
    static fileWithData(ctx, data, fileName) {
        const keys = Object.keys(data[0])
        let body = ''
        keys.forEach(key => {
            body += key + "\t"
        })
        body = body.trim()
        body += "\n"
        data.forEach(record => {
            keys.forEach((key) => {
                body = body + (record[key] || 0) + '\t'
            })
            body = body.trim()
            body += '\n'
        })
        fileGenerate(ctx, body, fileName);
    }

    static businessCheck(ctx) {
        const params = ctx.query
        const type = params.type || ''
        params.startDate = params.startDate || ''
        params.endDate = params.endDate || ''
        const typeArray = ["dice", "moon", "ring", "mine", "duel", "em", "hub88", "sport", "poker", "platius", "binary"]
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
