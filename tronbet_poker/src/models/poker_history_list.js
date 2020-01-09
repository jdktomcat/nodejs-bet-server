const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const poker_history_list_schema = new Schema({
    gameId: { type: String, unique: true },
    tableId: { type: Number, index: true },
    no: { type: Number, default: 0 },
    championCards: Schema.Types.Mixed,
    communityCards: Schema.Types.Mixed,
    champion: { type: String, default: "" },
    pot: { type: Number, default: 0 },
}, { collection: 'poker_history_list', versionKey: false });

module.exports = mongoose.model('poker_history_list', poker_history_list_schema);