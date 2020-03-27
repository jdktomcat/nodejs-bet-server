const axios = require('axios');
const NODE_ENV = process.env.NODE_ENV;
let config = require('../configs/config');
if (NODE_ENV == 'test') {
    config = require('../configs/config_test');
}
const swaghub = config.swaghub;
const HmCrypto = require('hm-crypto-nodejs');

const digestType = 'RSA-SHA256';
const publicKey = swaghub.publicKey;
const privateKey = swaghub.privetKey;
// init with default keypair and digest type
const hmCrypto = HmCrypto(digestType, privateKey, publicKey);

//
async function getSwaggerGames() {
    let paramas = {
        operator_id: swaghub.operator_id
    };
    let computedSignature = hmCrypto.sign(JSON.stringify(paramas));

    const isTrue = hmCrypto.isValid(JSON.stringify(paramas), computedSignature);

    console.log(`'${JSON.stringify(paramas)}' signature is '${computedSignature}'" => ${isTrue}`);


    try {
        let {data} = await axios({
            url: swaghub.host + '/operator/generic/v2/game/list',
            // url: 'http://api.server1.ih.testenv.io/operator/generic/v2/game/list',
            method: 'post',
            data: paramas,
            headers: {'content-type': 'application/json', 'X-Hub88-Signature': computedSignature}
        });
        let result = [];
        // console.log(`===============start=================data`, data);
        for (let one of data) {
            // console.log(one,"    test123456789")
            // if (isGameInList(one.name)) {
            let tmp = {
                thumbnail: one.url_thumb,
                background: one.url_background,
                id: one.game_id,
                gameName: one.name,
                product: one.product,
                category: one.category,
                type: 'HUB',
                isSupportBTC: true
            };
            let category = one.category;
            if (category != 'Video Slots') {
                category = 'Live Games';
            }
            if (!result[category]) {
                result[category] = [tmp];
            } else {
                result[category].push(tmp);
            }
            // }
        }
        // console.log("==========end==========")
        // console.log(result);
        return result;
    } catch (error) {
        console.log("hub88 request body is: \n", JSON.stringify({
            url: swaghub.host + '/operator/generic/v2/game/list',
            // url: 'http://api.server1.ih.testenv.io/operator/generic/v2/game/list',
            method: 'post',
            data: paramas,
            headers: {'content-type': 'application/json', 'X-Hub88-Signature': computedSignature}
        }))
        console.log('hub88 request error: ', error);
        return null;
    }
}


const getHub88FDetail = async function(){
    const swaggerGame = await getSwaggerGames()
    //
    const hub88slot = swaggerGame['Video Slots']
    const hub88Gameshow = swaggerGame['Live Games']
    //
    return [hub88slot,hub88Gameshow]
}

module.exports = getHub88FDetail