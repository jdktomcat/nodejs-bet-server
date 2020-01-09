const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    addr: { type: String, unique: true },
    name: { type: String, default: '' },   //玩家名称
    score: { type: Number, default: 0 },
}, { collection: 'poker_user', versionKey: false});

module.exports = mongoose.model('poker_user', userSchema);
