const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const payedSchema = new Schema({
    txID: { type: String, unique: true },
    paytime: Number
}, { collection: 'poker_payed_payin', versionKey: false});

module.exports = mongoose.model('poker_payed_payin', payedSchema);
