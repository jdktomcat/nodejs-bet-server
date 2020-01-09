const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const payInSchema = new Schema({
    txID: { type: String, unique: true },
    blockId: { type: Number, index: true },
    addr: String,
    tableId: Number,
    trxAmount: Number,
    paytime: Number,
    status: { type: Number, index: true },
    lastUpdate: Number
}, { collection: 'poker_payin_order', versionKey: false});

module.exports = mongoose.model('poker_payin_order', payInSchema);
