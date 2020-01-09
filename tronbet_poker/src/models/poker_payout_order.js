const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const payOutSchema = new Schema({
    sysTxID: {type: String, unique: true},
    txID: { type: String, index: true },
    blockId: Number,
    addr: String,
    tableId: Number,
    trxAmount: Number,
    paytime: Number,
    status: { type: Number, index: true },
    lastUpdate: Number,
    retry: Number,
    optype: Number
}, { collection: 'poker_payout_order', versionKey: false });

module.exports = mongoose.model('poker_payout_order', payOutSchema);
