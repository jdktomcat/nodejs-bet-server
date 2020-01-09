const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jackpotSchema = new Schema({
    sysTxID: { type: String, unique: true },
    txID: { type: String, index: true },
    blockId: Number,
    addr: String,
    tableId: Number,
    tableNo: Number,
    cardShow: Number,
    jackpotType: Number,
    trxAmount: Number,
    poolAmount: Number,
    paytime: Number,
    status: { type: Number, index: true },
    lastUpdate: Number,
    retry: Number
}, { collection: 'poker_jackpot_order', versionKey: false });

module.exports = mongoose.model('poker_jackpot_order', jackpotSchema);
