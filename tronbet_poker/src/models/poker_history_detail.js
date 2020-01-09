const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const poker_history_detail_schema = new Schema({
    gameId: { type: String, unique: true },
    logs: Schema.Types.Mixed
}, { collection: 'poker_history_detail', versionKey: false });

module.exports = mongoose.model('poker_history_detail', poker_history_detail_schema);