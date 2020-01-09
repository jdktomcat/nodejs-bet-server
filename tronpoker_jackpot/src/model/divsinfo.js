const {mongoose, connection} = require('../utils/mongoUtil')

const lobbySchema = new mongoose.Schema({
    jackpot : {type: Number },                    //彩池
    totalFee: {type: Number},                        //总抽水
    totalPot: {type: Number}                        //总奖池
}, { collection: 'poker_lobby', versionKey: false});

var div = connection.model("poker_lobby", lobbySchema)

async function getTotalPool() {
    let result = await div.findOne()
    if (!result) {
        result = {totalPot: 0}
    }
    return result
}

module.exports = {
    getTotalPool
}
