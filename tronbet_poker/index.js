const _ = require('lodash')._;
const axios = require('axios');
const TronWeb = require('tronweb');
const ErrCode = require('./src/common/errorCode').ErrCode;
const commonEnum = require('./src/common/commonEnum');
const stringUtil = require('./src/common/stringUtil');
const dbService = require('./src/service/dbService');
const log4js = require('./src/configs/log4js.config');
const config = require('./src/configs/config');

const loggerDefault = log4js.getLogger('print');

const GLOBAL_EVENT = commonEnum.GLOBAL_EVENT;
const PayInState = commonEnum.PAYIN_STATE;
const IsValidTableId = commonEnum.VALID_TABLEID;
const getUnixTimeStamp = stringUtil.getUnixTimeStamp;
const assert = stringUtil.assert;

const addrAdmins = config.tronConfig.addrAdmins || [];
const addrPlayers = config.cupConfig.addrPlayers || {};

let PokerAccountMap = {};            // address => PokerAccount
let SocketIdToAccountMap = {};       // socketid => PokerAccount
let AccountToSocketIdMap = {};       // address => socketid

const scan = require('./src/service/scanService');
const ScanInstance = scan.TexasScan.getInstance();
const lobby = require('./src/service/lobbyService');
const LobbyInstance = lobby.TronTexasLobby.getInstance();
LobbyInstance.loadLobby();
ScanInstance.init(LobbyInstance);

initVipAccount();

let io = require('socket.io')(config.app.port);
io.set('origins', '*:*'); //运行跨域

io.on('connection', function (socket) {
    socketConnect(socket);

    //断开事件
    socket.on('disconnect', function () {
        try {
            socketDisconnect(socket);

            let addr = SocketIdToAccountMap[socket.id];
            if (!TronWeb.isAddress(addr)) {
                loggerDefault.info("Connect close without sign", socket.id);
                delete SocketIdToAccountMap[socket.id];
            } else {
                loggerDefault.info("Connect close from addr:", addr, socket.id);
                delete SocketIdToAccountMap[socket.id];
                delete AccountToSocketIdMap[addr];
            }
        } catch (e) {
            loggerDefault.error("disconnect exception, addr: " + e + "\n" + e.stack);
        }
    })

    socket.on('getlobby', (data) => {
        try {
            if (data == null) { return; }

            let { tabletype, blindtype } = data;

            if (tabletype == null || blindtype == null) {
                return;
            }

            if (!Number.isInteger(tabletype) || !Number.isInteger(blindtype)) {
                return;
            }

            LobbyInstance.getLobby(socket, tabletype, blindtype);
        } catch (e) {
            loggerDefault.error("getlobby exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('getCupInfo', () => {
        try {
            LobbyInstance.getCupInfo(socket);
        } catch (e) {
            loggerDefault.error("getCupInfo exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('getbaseinfo', (data) => {
        try {
            let addr = data.addr;
            if (addr == null) { return; }
            getAccount(addr, null, (account) => {
                if (account == null) {
                    loggerDefault.error("getplaytables.getAccount failed, addr: %s", addr);
                    return;
                }

                let msg = {
                    addr: addr,
                    name: account.getNickName(),
                    lv: account.tronbetLv || 1,
                    head: account.head,
                    poker: {
                        totalPlay: 0,
                        totalWin: 0,
                        buyIn: 0,
                        avg100Win: 0,
                        preflopRais: 0,
                        preflop3Bet: 0,
                        aFactor: 0,
                        contBet: 0
                    }
                };
                socket.emit('baseinfo', msg);
            }).catch((ex) => {
                loggerDefault.error("getplaytables exception, addr: " + ex + "\n" + ex.stack);
            });
        } catch (e) {
            loggerDefault.error("getplaytables.getbaseinfo exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('getplaytables', () => {
        loggerDefault.info('getplaytables');
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                return;
            }

            getAccount(addrSigned, null, (account) => {
                if (account == null) {
                    loggerDefault.error("getplaytables.getAccount failed, addr: %s", addrSigned);
                    return;
                }

                LobbyInstance.getPlayingTables(socket, account);
            }).catch((ex) => {
                loggerDefault.error("getplaytables exception, addr: " + ex + "\n" + ex.stack);
            });
        } catch (e) {
            loggerDefault.error("getplaytables.getAccount exception, addr: " + e + "\n" + e.stack);
        }
    });

    /**
     * @param {signtype} 1显式签名, 客户端签名之后再发起入座操作, 2隐式签名, 客户端打开页面后适时向服务器报告身份
     */
    socket.on('sign', async (data) => {
        try {
            if (data == null) { return; }

            let { addr, msg, signature, signtype } = data;
            loggerDefault.info("--->>>>>>>sign<<<<<<<---", data);

            if (addr == null || msg == null || signature == null || signtype == null) {
                return;
            }

            if (!Number.isInteger(signtype)) {
                return;
            }

            // 签名的msg需要增加时间戳的参数, 防止本地盗用
            // 暂时不验证过期
            if (process.env.NODE_ENV === 'production') {
                signature = TronWeb.toHex(signature);
                msg = TronWeb.toHex(msg);

                let verify = await stringUtil.verifySign(msg, signature, addr);
                if (!verify) {
                    socket.emit('errcode', ErrCode.ERR_SIGN_FAILED);
                    return;
                }
            }

            // 1.先查看是不是该socketid已经指向了有签名的用户
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("repeat sign check in same socket", addrSigned, addr);
                addr = addrSigned;
            }

            // 2.查看该账号是不是已经有socket连接了, 有则断开之
            let oldSockId = AccountToSocketIdMap[addr];
            if (oldSockId != null && oldSockId != socket.id) {
                let oldSock = io.sockets.connected[oldSockId];
                if (oldSock) {
                    let ipAddr = socket.handshake.address.replace('::ffff:', '');
                    oldSock.emit("sockreplace", ipAddr);
                    let tm = setTimeout(() => {
                        if (oldSock != null) {
                            oldSock.disconnect(true);
                        }
                        clearTimeout(tm);
                    }, 50);
                }
            }

            getAccount(addr, socket, (account) => {
                if (account == null) {
                    loggerDefault.error("sign.getAccount failed, addr: %s", addr);
                    return;
                }
                assert(addr, account.addr);

                SocketIdToAccountMap[socket.id] = addr;
                AccountToSocketIdMap[addr] = socket.id;

                account.sendInfo(socket, signtype);
            }).catch((ex) => {
                loggerDefault.error("sign.getAccount exception, addr: " + ex + "\n" + ex.stack);
            });
        } catch (e) {
            loggerDefault.error("sign.getAccount exception, addr: " + e + "\n" + e.stack);
        }
    })

    socket.on('watch', (data) => {
        try {
            if (data == null || data.room == null) {
                return;
            }

            loggerDefault.info('watch', data);

            let tableId = data.room;
            if (!IsValidTableId(tableId)) {
                return;
            }
            let addrSigned = SocketIdToAccountMap[socket.id];
            LobbyInstance.watchSeat(socket, addrSigned, tableId);
        } catch (e) {
            loggerDefault.error("watch exception, addr: " + e + "\n" + e.stack);
        }
    })

    // TODO: 原指令为seatin, 参数{room, seatNo}
    socket.on('sitDown', (data) => {
        //console.log("sitDown sitDown sitDown", data);
        try {
            if (data == null) { return; }

            loggerDefault.info('sitDown', data);
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }

            let tableId = parseInt(data.room);
            if (!IsValidTableId(tableId)) {
                return;
            }

            let tableType = Math.floor(tableId / 100000);

            let seatNo = parseInt(data.seatNo) || 0;
            if (seatNo < 0 || seatNo >= tableType) {
                return;
            }

            let errCode = LobbyInstance.checkSeat(addrSigned, tableId, seatNo);
            if (errCode != null) {
                socket.emit('errcode', errCode);
                return;
            }

            getAccount(addrSigned, null, (account) => {
                if (account == null) {
                    loggerDefault.error("seatin.getAccount failed, addr: %s", addrSigned);
                    return;
                }

                LobbyInstance.sitDown(socket, account, tableId, seatNo);
            }).catch((ex) => {
                loggerDefault.error("seatin exception, addr: " + ex + "\n" + ex.stack);
            });
        } catch (e) {
            loggerDefault.error("seatin exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('exit', (data) => {
        try {
            loggerDefault.info('exit', data);
            let addrSigned = SocketIdToAccountMap[socket.id];
            let tableId = parseInt(data.room);

            if (!IsValidTableId(tableId)) {
                loggerDefault.info("exitTable tableId invalid: %s, %s", addrSigned, tableId);
                return;
            }

            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                LobbyInstance.removeFromWatch(socket, tableId);
            } else {
                getAccount(addrSigned, null, (account) => {
                    if (account == null) {
                        loggerDefault.error("exitTable.getAccount failed, addr: %s", addrSigned);
                        return;
                    }
                    LobbyInstance.exitTable(socket, account, tableId);
                }).catch((ex) => {
                    loggerDefault.error("exitTable exception, addr: " + ex + "\n" + ex.stack);
                });
            }
        } catch (e) {
            loggerDefault.error("exitTable exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('bet', (data) => {
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }

            if (data == null || data.bet == null || data.room == null) {
                return;
            }
            loggerDefault.info('bet', data);

            // TODO: 这里需要考虑JS能处理的最大整数是多少, 需要做一个测试
            // if (data.bet % 10000 > 0) {
            //     loggerDefault.info("数值错误, trx最多两位小数", addrSigned, data.bet);
            //     return;
            // }

            LobbyInstance.doBet(socket, addrSigned, data.bet, data.room);
        } catch (e) {
            loggerDefault.error("bet exception, addr: " + e + "\n" + e.stack);
        }
    })

    socket.on('fold', (data) => {
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }

            if (data == null || data.room == null) {
                return;
            }
            loggerDefault.info('bet', data);

            LobbyInstance.doBet(socket, addrSigned, 0, data.room);
        } catch (e) {
            loggerDefault.error("bet exception, addr: " + e + "\n" + e.stack);
        }
    })

    socket.on('sitOut', (data) => {
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }
            if (data == null) { return; }
            let room = parseInt(data.room);

            if (room <= 0) { return; }

            LobbyInstance.sitOut(room, addrSigned);
        } catch (e) {
            loggerDefault.error("sitOutNextHand exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('backSeat', (data) => {
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }
            if (data == null) { return; }
            let room = parseInt(data.room);

            if (room <= 0) { return; }

            LobbyInstance.backSeat(room, addrSigned);
        } catch (e) {
            loggerDefault.error("backSeat exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('killRobot', (data) => {
        console.log("killRobot------->", data);
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }
            if (data == null) { return; }
            let room = parseInt(data.room);

            if (room <= 0) { return; }

            LobbyInstance.killRobot(room, addrSigned);
        } catch (e) {
            loggerDefault.error("killRobot exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('extraBB', (data) => {
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }
            if (data == null) { return; }
            let room = parseInt(data.room);

            if (room <= 0) { return; }

            LobbyInstance.extraBB(socket, room, addrSigned);
        } catch (e) {
            loggerDefault.error("sitOutNextHand exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('cancelBB', (data) => {
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }
            if (data == null) { return; }
            let room = parseInt(data.room);

            if (room <= 0) { return; }

            LobbyInstance.cancelBB(socket, room, addrSigned);
        } catch (e) {
            loggerDefault.error("sitOutNextHand exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('timeMachine', (data) => {
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }
            if (data == null) { return; }
            let tableId = parseInt(data.room);

            if (tableId <= 0) { return; }

            // LobbyInstance.exitTable(socket, { addr: addrSigned }, tableId); //TODO:TEST
            LobbyInstance.timeMachine(socket, tableId, addrSigned);
        } catch (e) {
            loggerDefault.error("sitOutNextHand exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('showPoker', (data) => {
        // console.log("client showPoker", data);
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }
            if (data == null) { return; }
            // console.log("client showPoker", data);
            let tableId = parseInt(data.room);
            // console.log("client showPoker", tableId);
            let idx = parseInt(data.idx || '0');

            if (tableId <= 0) { return; }

            // console.log("client showPoker", tableId);
            LobbyInstance.showPoker(socket, tableId, addrSigned, idx);
        } catch (e) {
            loggerDefault.error("sitOutNextHand exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('hidePoker', (data) => {
        try {
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }
            if (data == null) { return; }
            let tableId = parseInt(data.room);
            let idx = parseInt(data.idx || '0');

            if (tableId <= 0) { return; }

            LobbyInstance.hidePoker(socket, tableId, addrSigned, idx);
        } catch (e) {
            loggerDefault.error("sitOutNextHand exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('getAllInfo', (data) => {
        console.log("getAllInfo", data);
    });

    socket.on('getReportList', (data) => {
        console.log("getReportList", data);
    });

    socket.on('getReport', (data) => {
        console.log("getReport", data);
    });

    socket.on('chat', (data) => {
        try {
            let { room, to, content, type } = data;
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                loggerDefault.info("socket didn't sign", socket.id);
                return;
            }

            if (!_.isString(content)) {
                return;
            }
            content = _.trim(content);
            if (content.length == 0) {
                return;
            }

            let tableId = parseInt(room);

            getAccount(addrSigned, null, (account) => {
                if (account == null) {
                    loggerDefault.error("exitTable.getAccount failed, addr: %s", addrSigned);
                    return;
                }
                LobbyInstance.chat(socket, addrSigned, tableId, to, content, type, account.name, account.tronbetLv);
            }).catch((ex) => {
                loggerDefault.error("chat exception, addr: " + ex + "\n" + ex.stack);
            });
        } catch (e) {
            loggerDefault.error("chat exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('getHistoryDetail', (data) => {
        try {
            let { room, no } = data;
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
                addrSigned = "";
            }

            let tableId = parseInt(room);
            no = parseInt(no);

            LobbyInstance.getHistoryDetail(socket.id, addrSigned, tableId, no);
        } catch (e) {
            loggerDefault.error("table_history_detail exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('getRankInfo', (data) => {
        console.log("getRankInfo", data);
        try {
            let { room } = data;
            let tableId = parseInt(room);
            LobbyInstance.getRankInfo(socket.id, tableId);
        } catch (e) {
            loggerDefault.error("table_history_detail exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('getGodCards', (data) => {
        console.log("getGodCards", data);
        try {
            let { room, seatNo } = data;
            let tableId = parseInt(room);

            if (config.cupConfig.tableId !== tableId) {
                return;
            }

            let addrSigned = SocketIdToAccountMap[socket.id];
            if (_.find(config.cupConfig.addrVIPs, (o) => { return o === addrSigned }) == null) {
                console.error("getGodCards --> your addr not in config.cupConfig.addrVIPs", addrSigned);
                return;
            }

            LobbyInstance.getGodCards(tableId, socket.id, seatNo);
        } catch (e) {
            loggerDefault.error("getGodCards exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('adminStart', (data) => {
        console.log("adminStart", data);
        try {
            let { room, sec } = data;
            let tableId = parseInt(room);
            sec = sec || 10;
            console.log("adminStart", tableId, sec);
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (_.find(config.cupConfig.addrGMs, (o) => { return o === addrSigned }) == null) {
                console.error("adminStart --> your addr not in config.cupConfig.addrGMs", addrSigned);
                return;
            }
            LobbyInstance.adminStart(tableId, sec);
        } catch (e) {
            loggerDefault.error("adminStart exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('adminStop', (data) => {
        console.log("adminStop", data);
        try {
            let { room, sec } = data;
            let tableId = parseInt(room);
            sec = sec || 10;
            console.log("adminStop", tableId, sec);
            let addrSigned = SocketIdToAccountMap[socket.id];
            if (_.find(config.cupConfig.addrGMs, (o) => { return o === addrSigned }) == null) {
                console.error("adminStop --> your addr not in config.cupConfig.addrGMs", addrSigned);
                return;
            }
            LobbyInstance.adminStop(tableId, sec);
        } catch (e) {
            loggerDefault.error("adminStop exception, addr: " + e + "\n" + e.stack);
        }
    });

    socket.on('adminCMD', async (data) => {
        console.log("adminCMD", data);
        try {
            let { addr, msg, signature, cmd, param } = data;
            let utf8Str = TronWeb.toUtf8(msg);
            let timestamp = parseInt(utf8Str.substr(utf8Str.length - 10, 11));

            let tmNow = getUnixTimeStamp();
            if (timestamp > tmNow && timestamp - tmNow > 7200) {
                socket.emit('errcode', ErrCode.ERR_SIGN_TIMEOUT);
                return;
            }
            if (_.findIndex(addrAdmins, (ad) => { return ad === addr; }) < 0) {
                return;
            }

            let verify = await stringUtil.verifySign(msg, signature, addr);
            if (!verify) {
                socket.emit('errcode', ErrCode.ERR_SIGN_FAILED);
                return;
            }

            // TODO:通过指定账户签名来验证是否可以咨询gm命令
            // 1. 给指定桌的指定充值订单退费
            // 2. 给指定桌指定用户退费
            // 3. 踢出指定桌指定用户
            // 4. 关闭所有桌/关闭指定桌
            // 5. 强制维护, 此轮牌局结束后, 不再继续牌局, 并自行关闭
            // 6. 强制重启
            // 7. 重启scan模块
            // 8. 强制进入下一步玩家操作

            if (cmd === 'resettable') {
                // 重置指定桌
                let tableId = parseInt(param);
                if (tableId <= 0) { return; }
                LobbyInstance.resetTable(tableId);
            } else if (cmd === 'kickout') {
                // 将指定玩家从指定桌踢出
            } else if (cmd === 'printtable') {
                // 打印指定桌
                let tableId = parseInt(param);
                if (tableId <= 0) { return; }
            }

        } catch (e) {
            loggerDefault.error("admincmd exception, addr: " + e + "\n" + e.stack);
            return;
        }
    });

    // TODO: 测试充值代码
    socket.on('buyIn', (data) => {
        if (process.env.NODE_ENV === 'production') {
            return;
        }

        let addrSigned = SocketIdToAccountMap[socket.id];
        if (addrSigned == null || !TronWeb.isAddress(addrSigned)) {
            loggerDefault.info("socket didn't sign", socket.id);
            return;
        }

        let tableId = parseInt(data.room);

        let txID = TronWeb.sha3(Date.now().toString());
        let testOrder = {
            txID: txID,
            addr: addrSigned,
            tableId: tableId,
            trxAmount: 400e6,
            paytime: getUnixTimeStamp(),
            blockId: 11001000,
            status: PayInState.TABLEKNOW,
            lastUpdate: getUnixTimeStamp(),
        }
        // console.log(testOrder);
        let t1 = setTimeout(() => {
            clearTimeout(t1);
            let t2 = LobbyInstance.sendUnconfirmedOrder(testOrder);
            setTimeout(() => {
                clearTimeout(t2);
                testOrder.status = PayInState.CONFIRMED;
                LobbyInstance.sendConfirmedOrder(testOrder);
            }, 20000);
        }, 2000);
    });
});


// GLOBAL_EVENT.on('msg', (subject, data, toRommId, toUid) => {
//     console.log("-------------msg", toRommId, toUid, subject, data);
//     if(_.isEmpty( )){

//     }
//     if (_.isEmpty(subject) || _.isEmpty(data)) return;
//     if (!_.isEmpty(toRommId)) {
//         io.sockets.to(toRommId).emit(subject, data);
//     } else {
//         io.sockets[toUid].emit(subject, data);
//     }
// });
GLOBAL_EVENT.on('errcode', (addr, data) => {

});

GLOBAL_EVENT.on('broadcast', (data) => {
    io.sockets.emit(data.title, data.content);
});

GLOBAL_EVENT.on('room', (tableId, data) => {
    io.sockets.to(tableId.toString()).emit(data.title, data.content);
});

GLOBAL_EVENT.on('roomNotin', (tableId, sockMap, data) => {
    try {
        let room = io.sockets.adapter.rooms[tableId.toString()];
        if (room == null || room.sockets == null) {
            return;
        }
        let sock = null;
        for (let socketId in room.sockets) {
            if (sockMap[socketId] == null) {
                sock = io.sockets.connected[socketId];
                if (sock != null) {
                    sock.emit(data.title, data.content);
                }
            }
        }
    } catch (e) {
        loggerDefault.error("roomNotin exception: ", e);
    }
});

GLOBAL_EVENT.on('chatInfo', (tableId, data) => {
    io.sockets.to(tableId.toString()).emit(data);
});

GLOBAL_EVENT.on('player', (data) => {
    let addr = data.addr;
    let socketId = AccountToSocketIdMap[addr];
    let sock = io.sockets.connected[socketId];
    if (sock != null) {
        sock.emit(data.title, data.content);
    }
});

GLOBAL_EVENT.on('sock', (socketId, title, data) => {
    // console.log("---sock---", data.type)
    let sock = io.sockets.connected[socketId];
    if (sock != null) {
        sock.emit(title, data);
    }
});

GLOBAL_EVENT.on('msg', (data) => {
    // console.log("-------------msg", data);
    // io.sockets.emit('msg', data);
});

GLOBAL_EVENT.on('table_aj', (data) => {
    // console.log("-------------table_aj", data);
    if (data == null) return;
    io.sockets.emit('table_aj', data);
});

GLOBAL_EVENT.on('table_aj_socket_id', (socket_id, data) => {
    console.log("------------", socket_id)
    if (socket_id == null || data == null) return;
    let socket = io.sockets.connected[socket_id];
    if (socket != null) socket.emit("table_aj", data);
});

GLOBAL_EVENT.on('table_all_info', (socket_id, data) => {
    if (socket_id == null || data == null) return;
    let socket = io.sockets.connected[socket_id];
    if (socket != null) socket.emit("table_all_info", data);
});

function socketConnect(socket) {
    LobbyInstance.onlineCount += 1;
    loggerDefault.info("Socket %s connect, online %d", socket.id, LobbyInstance.onlineCount);
}

function socketDisconnect(socket) {
    LobbyInstance.onlineCount -= 1;
    loggerDefault.info("Socket %s disconnect, online %d", socket.id, LobbyInstance.onlineCount);
}

async function getAccount(addr, socket, cb) {
    let account = PokerAccountMap[addr];
    if (account != null) {
        cb(account);
        checkAccount(account);
    } else {
        // 从数据库中查询
        let dbAccount = await dbService.getAccountByAddr(addr);
        if (dbAccount == null || dbAccount == 0) {
            account = new lobby.PokerAccount(addr);
            PokerAccountMap[addr] = account;
            cb(account);
            if (dbAccount == null) {
                dbService.saveAccount(account);
            }
            checkAccount(account);
        } else {
            account = new lobby.PokerAccount(addr);
            PokerAccountMap[addr] = account;
            account.name = dbAccount.name || '';
            account.score = dbAccount.score || 0;
            cb(account);
            checkAccount(account);
        }
    }
}

function initVipAccount() {
    for (let addr in addrPlayers) {
        let vip = addrPlayers[addr];
        let account = new lobby.PokerAccount(addr);
        account.name = vip.name;
        account.tronbetLv = vip.lv;
        account.head = vip.head;
        PokerAccountMap[addr] = account;
    }
}

function checkAccount(account) {
    let now = getUnixTimeStamp();
    if (now - account.pullTime > 300) {
        account.pullTime = now;

        if (account.name == '') {
            stringUtil.getAccountName(account.addr, (name) => {
                if (name && name !== '') {
                    account.setNickName(name);
                    dbService.saveAccount(account);
                }
            });
        }

        getAccountParam(account.addr, (tbLv, head) => {
            if (tbLv > 0) {
                account.tronbetLv = tbLv;
            }
            if (head != null && head != "" && head !== account.head) {
                account.head = head;
                LobbyInstance.updateHead(account.addr, head);
            }
        });
    }
}

// 获取链上Account和TronBet平台等级
function getAccountParam(addr, callback) {
    // 比赛特殊账号处理
    if (addrPlayers[addr] != null) {
        let vipData = addrPlayers[addr];
        callback(vipData.lv, vipData.head);
        return;
    }

    axios.get(config.userInfoUrl + addr).then((res) => {
        let data = res.data;
        if (data.errno == 0 && data.data) {
            callback(data.data.lv || 1, data.data.img || '10000');
        }
    }).catch((err) => {
        console.log(err);
    });
}

process.on('SIGINT', async () => {
    if (process.env.NODE_ENV !== 'production') {
        process.exit(0);
    } else {
        loggerDefault.info("[shutdown ... by SIGINT]");
        LobbyInstance.closeService();
    }
});
