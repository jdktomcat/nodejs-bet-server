const hub88ListQuery = require('./hub88List')
const emListQuery = require('./emList')
const getPlatiusList = require('./platiusList')
const db = require('../utils/dbUtil')

async function getOnlineGames() {
    let sql = "select vendor,game_id,game_name,em_type,is_new from tron_live.live_online_game where status = '0' order by is_new desc,ts desc"
    let res = await db.exec(sql, [])
    return res
}

const filterGames = function (onlineGames, rawGames) {
    let newGames = []
    for (let onlineGame of onlineGames) {
        const game_id = String(onlineGame.game_id).trim()
        const game_name = String(onlineGame.game_name).trim()
        const is_new = String(onlineGame.is_new).trim()
        const vendor = onlineGame.vendor
        const game = rawGames.find(e => String(e.id).trim() === game_id)
        if (game !== undefined) {
            if (is_new === '1') {
                game.newFlag = true
            }else {
                game.newFlag = false
            }
            newGames.push(game)
        }else {
            //hub88独立处理
            if(vendor === 'hub88'){
                const game2 = rawGames.find(e => String(e.gameName).includes(game_name))
                console.log(is_new,"-----",onlineGame)
                if(game2){
                    if (is_new === '1') {
                        game2.newFlag = true
                    }else {
                        game2.newFlag = false
                    }
                    newGames.push(game2)
                }
            }
        }
    }
    return newGames
}

const getGameData = async function () {
    const [platiusSlot, platiusTable] = getPlatiusList()
    const [hub88slot, hub88Gameshow] = await hub88ListQuery()
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
    const newSlot2 = filterGames(onlineGames, newSlot)
    const newTables2 = filterGames(onlineGames, newTables)
    const balckjackt2 = filterGames(onlineGames, balckjackt)
    const baccaratt2 = filterGames(onlineGames, baccaratt)
    const roulettet2 = filterGames(onlineGames, roulettet)
    const lotteryt2 = filterGames(onlineGames, lotteryt)
    const livePokert2 = filterGames(onlineGames, livePokert)
    const holdem2 = filterGames(onlineGames, holdem)
    //
    // const newFlag = await getIsNewArray()
    return {
        // newFlag:newFlag,
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