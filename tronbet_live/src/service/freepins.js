const moment = require('moment')
const userinfo = require('../model/userinfo')
const {softswiss} = require('../configs/config')
const axios = require('axios')
const common = require('../utils/common')
const log4js = require('../configs/log4js_config')
const loggerDefault = log4js.getLogger('print')
const _ = require('lodash')._


const SendUrl = 'http://vendorapi-stage.everymatrix.com/vendorbonus/Platipus/AwardBonus'
const createUserUrl = 'http://casino2.stage.everymatrix.com/userSession/generic/CreateUser'

async function createFreespinUser(addr) {
    let params = {
        DomainId: 1973,
        CountryAlpha3Code: "UKR",
        Gender: "Male",
        Alias: "ekovalenko",
        City: "Lviv",
        Lang: "UA",
        Currency: "TRX",
        FirstName: "Evgen",
        LastName: "Kovalenko",
        OperatorUserId: "201801111140"
    }

    let data = await sendRequest(createUserUrl, params)
    if (_.isEmpty(data)) {
        console.log('create user failed')
        return false
    } else {
        return true
    }
}

async function sendFreepins(addr, UserId, GameId) {
    let params = {
        BonusSource:2,
        UserId:UserId,
        GameIds:[GameId],
        BonusId:"test11",
        FreeRoundsEndDate:"2019-6-29T08:38:02Z",
        NumberOfFreeRounds:1,
        LoginName:null,
        Password:null,
        DomainId:1951,
        AdditionalParameters: {
            CoinValue: 0.02,
            BetValueLevel: 1
        }
    }

    let data = await sendRequest(SendUrl, params)
    if (_.isEmpty(data)) {
        console.log('send User freespins failed')
        return false
    } else {
        return true
    }
}

async function sendRequest(url, param) {
    try {
        let {data} = await axios({
            url : url,
            method : 'post',
            data : param,
            headers: { 'content-type': 'application/json'},
        })
        return data
    } catch (error) {
        console.log(error)
        return null
    }

}

module.exports = {
    sendFreepins,
}
