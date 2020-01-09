const {liveUrl} = require('../configs/config')
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
const path = require('path')
const basePath = liveUrl
const getOptions = function (ctx) {
    const method = ctx.request.method
    const url = ctx.request.url
    if (method === "GET") {
        const q = ctx.request.query
        const urlPath = basePath + url
        let query = {}
        Object.keys(q).forEach(e => query[e] = q[e])
        const options = {
            method: method,
            url: urlPath,
            headers: {
                'cache-control': 'no-cache',
            },
            qs: query,
        };
        return options
    } else if (method === 'POST') {
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
        console.log("debug------>liveUrl ", liveUrl)
        console.log("debug------>url1 ", ctx.request.url)
        console.log("debug------>url2 ", liveUrl + ctx.request.url)
        const data = await promiseRequest(getOptions(ctx))
        const json = eval('(' + JSON.stringify(data) + ')');
        console.log("debug------->", json)
        ctx.body = json
    } catch (e) {
        ctx.body = {
            code: 500,
            message: e.toString()
        }
    }
}

module.exports = {
    queryDeposit: routes,
    GetEissue: routes,
    reissueList: routes,
    addGames: routes,
    editGame: routes,
    updateGames: routes,
    updateRateById: routes,
    offlineGames: routes,
    setRate: routes,
    getOnlineList: routes,
    insertSchedule: routes,
    deleteSchedule: routes,
    allSchedule: routes,
}