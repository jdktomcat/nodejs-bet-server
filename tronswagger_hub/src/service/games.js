const axios = require('axios')
const {swaghub} = require('../configs/config')
const HmCrypto = require('hm-crypto-nodejs')

const digestType = 'RSA-SHA256';
const publicKey  = swaghub.publicKey
const privateKey = swaghub.privetKey
const redisUtils = require('../utils/redisUtil')

// init with default keypair and digest type
const hmCrypto = HmCrypto(digestType, privateKey, publicKey);
let GAMES = [
    'operation diamond hunt',
    'Wild Craft',
    'midas treasure',
    'Desert Gem',
    'hong bao',
    'ruby hunter',
    'Atlantis Thunder',
    'Monkey God',
    'Starburst',
    'Dead or Alive',
    'Dead or Alive 2',
    'Conan',
    'Imperial Riches',
    'Twin Happiness Slot',
    'Golden Grimoire',
    'Vikings Video SLot',
    'Football Champions Cup',
    'Finn and the Swirly Spin',
    'Monopoly Live',
    'Bust The Bank',
    'Kings of Cash',
    'Lost Saga',
    'Enchanted cash',
    'Pirates of fortune',
    'Gold of Ra',
    'Money farm 2',
    'Book of oziris',
    'Thunderstruck II',
    'Heroes empire',
    'Captain candy',
    'Battle of Atlantis',
    'Slotfather 2',
    'Once upon a time',
    'Gladiator',
    'Heist',
    'Sugar pop 2',
    'Flaming reels',
    'Kingofmonkeys 2',
    'Emperors wealth',
]
function isGameInList(gameName) {
    for (let one of GAMES) {
        if (gameName.toUpperCase() == one.toUpperCase()) return true
    }
    return false
}

function sortByList() {
    let index1 = GAMES.indexOf(firstEl.id)
    let index2 = GAMES.indexOf(secondEl.id)
    // console.log(firstEl.id, index1, secondEl.id, index2)
    if (index1 > index2) return 1
    if (index1 == index2) return 0
    return -1
}

async function getGames() {
    let paramas = {
        operator_id: swaghub.operator_id
    }
    let computedSignature = hmCrypto.sign(JSON.stringify(paramas))
    console.log(hmCrypto.isValid(JSON.stringify(paramas), computedSignature))
    console.log(Buffer.from(computedSignature).toString('base64'))
    try {
        let {data} = await axios({
            url: swaghub.host + '/operator/generic/v2/game/list',
            method: 'post',
            data: paramas,
            headers: { 'content-type': 'application/json', 'X-Hub88-Signature' : computedSignature},
        })
        // let result = {}
        let result = []
        for (let one of data) {
            // if (one.url_thumb && one.url_background && one.product == "Evolution") {
            // if (one.url_thumb && one.url_background) {
            if (isGameInList(one.name)) {
                tmp = {
                    thumbnail: one.url_thumb,
                    background: one.url_background,
                    id: one.game_id,
                    gameName: one.name,
                    product: one.product,
                    category: one.category,
                    type: 'HUB',
                    isSupportBTC: true,
                }
                console.log(one)
                // if (!result[one.category]) {
                //     result[one.category] = [tmp]
                // } else {
                //     result[one.category].push(tmp)
                // }
                result.push(tmp)
            }
        }
        await redisUtils.hset('tronswaggergame', 'games', JSON.stringify(result))
        return result
    } catch (error) {
        console.log(error)
        return null
    }
}

getGames()
