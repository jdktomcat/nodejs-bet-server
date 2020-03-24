const hub88ListQuery = require('./hub88List')
const emListQuery = require('./emList')
const getPlatiusList = require('./platiusList')
const db = require('../utils/dbUtil')

async function getOnlineGames() {
    let sql = "select game_id,game_name,em_type,is_new from tron_live.live_online_game where status = '0' order by is_new desc,ts desc"
    let res = await db.exec(sql, [])
    return res
}

const filterGames = function (onlineGames,rawGames) {
    let newGames = []
    for(let rawGame of rawGames){
        const type = rawGame.type
        const cpTypes = ['HUB','EM','platius']
        if(cpTypes.includes(type)){
            const game = onlineGames.find(e=>e.game_id === rawGame.id)
            if(game){
                if(game.is_new === '1'){
                    rawGame.newFlag = true
                }
                newGames.push(rawGame)
            }
        }
    }
    return newGames
}

const getGameData = async function () {
    const [platiusSlot, platiusTable] = getPlatiusList()
    const [hub88slot,hub88Gameshow] = await hub88ListQuery()
    const {
        slots,
        balckjackt,
        baccaratt,
        roulettet,
        lotteryt,
        livePokert,
        holdem,
        poker,
    } = await emListQuery()
    /**
     * deal with slot and table
     * @type {*[]}
     */
    const newSlot = platiusSlot.concat(slots).concat(hub88slot)
    const newTables = platiusTable.concat(poker)
    //
    const onlineGames = await getOnlineGames()
    /**
     * begin to filter
     */
    const newSlot2 = filterGames(onlineGames,newSlot)
    const newTables2 = filterGames(onlineGames,newTables)
    const balckjackt2 = filterGames(onlineGames,balckjackt)
    const baccaratt2 = filterGames(onlineGames,baccaratt)
    const roulettet2 = filterGames(onlineGames,roulettet)
    const lotteryt2 = filterGames(onlineGames,lotteryt)
    const livePokert2 = filterGames(onlineGames,livePokert)
    const holdem2 = filterGames(onlineGames,holdem)
    //
    return {
        slots: newSlot2,
        balckjackt: balckjackt2,
        baccaratt: baccaratt2,
        roulettet: roulettet2,
        lotteryt: lotteryt2,
        livePokert: livePokert2,
        holdem: holdem2,
        gameshow: hub88Gameshow,
        balckjack: [],
        baccarat: [],
        roulette: [],
        poker: newTables2
    };
}


module.exports = getGameData