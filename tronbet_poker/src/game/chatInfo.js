const { PLAYER_MESSAGE_TYPE_TOSTRING, MESSAGE_FROM_TYPE } = require('../common/commonEnum');

class chatInfo {
    constructor(_tableId, _from, _to = 0, _content = "hi", _type = PLAYER_MESSAGE_TYPE.TEXT, _fromName, _fromLv, _toName, _toLv, _msgtype = MESSAGE_FROM_TYPE.USER) {
        this.tableId = _tableId;
        this.from = _from;
        this.fromName = _fromName || _from;
        this.fromLv = _fromLv || 1;
        this.to = _to;
        this.toName = _toName || _to;
        this.toLv = _toLv || 1;
        this.content = _content;
        this.type = _type;
        this.msgType = _msgtype;
    }
    toString() {
        console.log("from:" + this.fromName + " to:" + this.toName + " content:" + this.content + " type:" + PLAYER_MESSAGE_TYPE_TOSTRING(this.type));
    }
}

module.exports = chatInfo;