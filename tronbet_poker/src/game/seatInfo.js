const _ = require('lodash')._;

class seatInfo {
    constructor(_seatNo) {
        this.seatNo = _seatNo;
        this.player = null;
    }
    getPlayerInfo() {
        if (this.player == null) return { seatNo: this.seatNo };
        let player = this.player;
        return {
            seatNo: this.seatNo,
            position: player.position,
            uname: player.uname,
            uid: player.uid,
            photoIdx: player.photoIdx,
            playerState: player.playerState,
            lv: player.lv || 1,
            balance: player.getBalance(),
            //sng
            robot: player.robot || false,
            sng_rank: player.sng_rank,
        }
    }
    getPlayingPlayerInfo() {
        if (this.player == null) return { seatNo: this.seatNo };
        return this.player.getPlayerState();
    }
}

module.exports = seatInfo;