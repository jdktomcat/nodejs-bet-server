const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scanSettingSchema = new Schema({
    configId: {type: Number, unique: true},
    fullId: Number,
    solidityId: Number,
    updateTime: Number
}, { collection: 'poker_scan_setting', versionKey: false });

module.exports = mongoose.model('poker_scan_setting', scanSettingSchema);
