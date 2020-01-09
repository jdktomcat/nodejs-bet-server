const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// new playerInfo(uid, uname, photoIdx, lv, seatNo, socket);
const PlayerTemplate = {
    uid: String,
    uname: { type: String, default: '' },
    photoIdx: { type: Number, default: 10000 },
    lv: { type: Number, default: 1 },
    ip: String,
    seatNo: Number,
    init_balance: { type: Number, default: 0 },
    totalBuyIn: { type: Number, default: 0 },
};

const TableTemplate = {
    tableId: { type: Number, unique: true },
    no: Number,
    allPlayers: Schema.Types.Mixed,

    unConfirmedOrder: Schema.Types.Mixed,
    confirmedOrder: Schema.Types.Mixed,

    config: Schema.Types.Mixed,
    blindList: Schema.Types.Mixed,
    gameType: { type: Number, default: 0 },
    statistics: Schema.Types.Mixed,
};

const tableSchema = new Schema(TableTemplate, { collection: 'poker_table', versionKey: false });

module.exports.Model = mongoose.model('poker_table', tableSchema);
module.exports.TableTemplate = TableTemplate;
module.exports.PlayerTemplate = PlayerTemplate; 