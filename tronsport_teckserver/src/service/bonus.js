const axios = require('axios')

const HOST = "https://external-api.invisiblesport.com/api/v1/external_api/bonus"
const operator_id = '1770436258506608640'
const brand_id = '1770437163566108672'

async function getBonusTemplate() {
    let {data} = await axios({
        url : HOST + '/templates',
        method : 'post',
        data : {
            operator_id : operator_id
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function getPlayerBonus(addr) {
    let {data} = await axios({
        url : HOST + '/player_bonuses',
        method : 'post',
        data : {
            brand_id : brand_id,
            external_player_id : addr
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function getBonusById(bonusId) {
    let {data} = await axios({
        url : HOST,
        method : 'post',
        data : {
            brand_id : brand_id,
            bonus_id : bonusId
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}


/**
 * {"brand_id": 1770437163566108672, 
 "template_id": 1774144869980315648,
 "players_data": [ {"external_player_id": "TFu9HpK7MJENuAWp6oGJaBGdqTBCtvYCMx", "currency": "TRX", "amount": 10000, "force_activated": false} ]}
 */
 async function SendUserBonus(addr, amount) {
    let {data} = await axios({
        url : HOST + '/mass_give_bonus',
        method : 'post',
        data : {
            brand_id : brand_id,
            template_id : bonusId,
            players_data : {
                external_player_id : addr,
                currency : 'TRX',
                amount : amount * 1e2,
                force_activated : false,
            }
        },
        headers: { 'content-type': 'application/json'},
    })
    console.log(data)
}

async function main() {
    await getBonusTemplate()
    await getPlayerBonus('TQRMbC9WRmqatjeZShNBznsBUj1Ypo2Ndc')
}



main()