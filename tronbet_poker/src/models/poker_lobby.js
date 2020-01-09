const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lobbySchema = new Schema({
    lobbyId: { type: Number, unique: true },
    totalFee: { type: Number, default: 0 }, //总抽水
    totalPot: { type: Number, default: 0 }, //奖池
    jackpot: { type: Number, default: 0 }, //彩池
}, { collection: 'poker_lobby', versionKey: false });

module.exports = mongoose.model('poker_lobby', lobbySchema);
