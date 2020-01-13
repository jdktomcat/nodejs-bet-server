const {back01Url} = require('../configs/config')
const request = require('request')
const promiseRequest = function (options) {
    console.log("debug--request: ", options)
    return new Promise((resolve, reject) => {
        request(options, function (error, response, body) {
            if (error) {
                console.log(error)
                reject(error)
            } else {
                console.log(body)
                resolve(body)
            }
        });
    })
}
const basePath = back01Url
const getOptions = function (ctx) {
    const method = ctx.request.method
    const url = ctx.request.url
    if (method === 'POST') {
        const body = ctx.request.body
        const urlPath = basePath + url
        const options = {
            method: method,
            url: urlPath,
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/json'
            },
            body: body,
            json: true
        };
        return options
    }
}

const routes = async function (ctx) {
    try {
        console.log("debug------>back01Url ", back01Url)
        console.log("debug------>url1 ", ctx.request.url)
        const data = await promiseRequest(getOptions(ctx))
        const json = eval('(' + JSON.stringify(data) + ')');
        ctx.body = json
    } catch (e) {
        ctx.body = {
            code: 500,
            message: e.toString()
        }
    }
}


module.exports = {
    search: routes,
    overview: routes,
}