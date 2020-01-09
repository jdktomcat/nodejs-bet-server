const ErrCode = {
    ERR_NOT_SIGNED: 'TronPoker_0001',       // 尚未签名登录
    ERR_SEAT_FULL: 'TronPoker_0002',        // 座位已有其他人 
    ERR_TABLE_FULL: 'TronPoker_0003',       // 牌局已满
    ERR_NOT_IN_TABLE: 'TronPoker_0004',      // 你现在不在这一桌
    ERR_SIGN_TIMEOUT: 'TronPoker_0005',      // 签名已过期
    ERR_SIGN_FAILED: 'TronPoker_0006',       // 签名错误
    ERR_GAME_STOP: 'TronPoker_0007',         // 游戏将要维护
    ERR_NOT_YOUR_TURN: 'TronPoker_ERR_NOT_YOUR_TURN',      //非当前操作者
    ERR_HAD_SEAT: 'TronPoker_HAD_SEAT',      //已上桌
} ;

module.exports.ErrCode = ErrCode;