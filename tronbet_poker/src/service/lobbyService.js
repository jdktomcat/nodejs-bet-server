const _ = require('lodash')._;
const stringUtil = require('../common/stringUtil');
const commomEnum = require('../common/commonEnum');
const GAME_TYPE = commomEnum.GAME_TYPE;
const ErrCode = require('../common/errorCode').ErrCode;
const log4js = require('../configs/log4js.config');
const config = require('../configs/config');

const message = require('../game/gameMessage');
const pokerCashTable = require('../game/table');
const pokerSngTable = require('../game/sng');

const dbService = require('./dbService');
const logService = require('./logService');
const scan = require('./scanService');

const ScanInstance = scan.TexasScan.getInstance();
const loggerDefault = log4js.getLogger('print');
const TronWeb = require('tronweb');

const TABLE_STATE = commomEnum.TABLE_STATE;
const LOBBY_STATE = commomEnum.LOBBY_STATE;
const TABLE_TYPE = commomEnum.TABLE_TYPE;
const BIGBLIND_TYPE = commomEnum.BIGBLIND_TYPE;
const MIN_BUYIN = commomEnum.MIN_BUYIN;
const MAX_BUYIN = commomEnum.MAX_BUYIN;
const MAX_TABLE_COUNT = commomEnum.MAX_TABLE_COUNT;

const GLOBAL_EVENT = commomEnum.GLOBAL_EVENT;
const PAYOUT_STATE = commomEnum.PAYOUT_STATE;
const REVENUE_OPTYPE = commomEnum.REVENUE_OPTYPE;

let getUnixTimeStamp = stringUtil.getUnixTimeStamp;

const addrVIPs = config.cupConfig.addrVIPs || [];
const addrPlayers = config.cupConfig.addrPlayers || {};
const cupTableId = config.cupConfig.tableId;

const InitTemplate = [
    {
        tableType: TABLE_TYPE[0],           // 2人桌
        gameMap: [
            {
                gameType: GAME_TYPE.CASH,
                blindType: BIGBLIND_TYPE,
                minBuyIn: MIN_BUYIN,
                maxBuyIn: MAX_BUYIN,
                talbeCount: 9
            },
        ],
    },
    {
        tableType: TABLE_TYPE[2],           // 6人桌
        gameMap: [
            {
                gameType: GAME_TYPE.CASH,
                blindType: BIGBLIND_TYPE,
                minBuyIn: MIN_BUYIN,
                maxBuyIn: MAX_BUYIN,
                talbeCount: 12
            },
            {
                gameType: GAME_TYPE.SNG,
                blindType: BIGBLIND_TYPE,
                minBuyIn: MIN_BUYIN,
                maxBuyIn: MAX_BUYIN,
                talbeCount: 3
            },
        ],
    },
    {
        tableType: TABLE_TYPE[3],           // 9人桌
        gameMap: [
            {
                gameType: GAME_TYPE.CASH,
                blindType: BIGBLIND_TYPE,
                minBuyIn: MIN_BUYIN,
                maxBuyIn: MAX_BUYIN,
                talbeCount: 15
            },
            {
                gameType: GAME_TYPE.SNG,
                blindType: BIGBLIND_TYPE,
                minBuyIn: MIN_BUYIN,
                maxBuyIn: MAX_BUYIN,
                talbeCount: 3
            },
        ],
    }
];

let InitTableIdArray = [];

class TronTexasLobby {
    constructor() {
        this.lobbyId = 1;
        this.instance = null;       // 单例实例
        this.onlineCount = 0;       // 在线人数
        this.tablesMap = {};        // 所有桌Map, [tableId] = TexasTable
        this.address2TablesMap = {};        // 玩家正在玩的牌局, [address] = [tableId1,tableId2,...] 
        this.totalFee = 0; //历史总抽成
        this.totalPot = 0; //当前总奖池
        this.jackpot = 0; //当前总彩池
        this.lobbyState = LOBBY_STATE.OPEN;
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new TronTexasLobby();
        }
        return this.instance;
    }

    async loadLobby() {
        pokerCashTable.setLobby(this);
        pokerSngTable.setLobby(this);

        let lobbyDoc = await dbService.getLobby();
        if (lobbyDoc != null) {
            // 这里只关注还有多少fee
            this.totalFee = lobbyDoc.totalFee || 0;
            this.totalPot = lobbyDoc.totalPot || 0;
            this.jackpot = lobbyDoc.jackpot || 0;
        }

        // 加载所有Table数据, 检查是否有需要退钱的, 有就退钱, 并且记录日志
        let tableRet = await dbService.getTables();

        for (let i = 0; i < InitTemplate.length; ++i) {
            let tableTypeObj = InitTemplate[i];

            let tableType = tableTypeObj.tableType;

            for (let g = 0; g < tableTypeObj.gameMap.length; ++g) {
                let gameTypeObj = tableTypeObj.gameMap[g];

                let gtype = gameTypeObj.gameType;
                let blindType = gameTypeObj.blindType;
                let minBuyIn = gameTypeObj.minBuyIn;
                let maxBuyIn = gameTypeObj.maxBuyIn;

                for (let j = 0; j < blindType.length; ++j) {
                    for (let k = 1; k <= gameTypeObj.talbeCount; ++k) {
                        let tableId = tableType * 100000 + gtype * 10000 + (j + 1) * 1000 + k;
                        if (j >= 5 && tableId != cupTableId) {
                            continue;
                        }

                        InitTableIdArray.push(tableId);

                        if (this.tablesMap[tableId] == null) {
                            let options = {
                                tableId: tableId,
                                smallBlind: blindType[j] / 2,
                                bigBlind: blindType[j],
                                maxPlayers: tableType,
                                minBuyIn: minBuyIn[j],
                                maxBuyIn: maxBuyIn[j],
                                gameType: gtype
                            }
                            let tbl = null;
                            if (gtype === 0) {
                                tbl = new pokerCashTable.tableInfo(options);
                            } else if (gtype === 2) {
                                tbl = new pokerSngTable.tableInfo(options);
                            }
                            if (tbl != null) {
                                tbl.tableId = tableId;
                                this.tablesMap[tableId] = tbl;
                            }
                        } else {
                            let tbl = this.tablesMap[tableId];
                            let cfg = tbl.config;
                            cfg.smallBlind = blindType[j] / 2;
                            cfg.bigBlind = blindType[j];
                            cfg.maxPlayers = tableType[i];
                            cfg.minBuyIn = minBuyIn[j];
                            cfg.maxBuyIn = maxBuyIn[j];
                            cfg.gameType = gtype;
                        }
                    }
                }
            }
        }

        // 将玩家身上的钱退走, 将未确认和已确认的order全部加到table里面
        if (tableRet.ret && tableRet.dataRow && tableRet.dataRow.length > 0) {
            for (let i = 0; i < tableRet.dataRow.length; ++i) {
                let doc = tableRet.dataRow[i];
                let tableId = doc.tableId;

                //console.log("---loadTable---", tableId, doc)
                let realTable = this.tablesMap[tableId];
                if (realTable == null) {
                    continue;
                }

                //恢复table参数
                realTable.load(doc.config, doc.blindList);
                //恢复table参数

                if (doc.unConfirmedOrder != null && !_.isEmpty(doc.unConfirmedOrder)) {
                    realTable.unConfirmedOrder = doc.unConfirmedOrder;
                }
                if (doc.confirmedOrder != null && !_.isEmpty(doc.confirmedOrder)) {
                    realTable.confirmedOrder = doc.confirmedOrder;
                }
                if (doc.no != null && Number.isInteger(doc.no)) {
                    realTable.no = doc.no;
                }

                let saveRet = false;
                if (tableId != cupTableId) {
                    saveRet = await dbService.saveTable(tableId, { allPlayers: {} });
                    if (!saveRet) {
                        loggerDefault.error("重新启动后玩家返款失败:", tableId, doc.allPlayers);
                    }
                }

                for (let uid in doc.allPlayers) {
                    let playDoc = doc.allPlayers[uid];
                    if (playDoc == null || playDoc.init_balance <= 0) { continue; }
                    let init_balance = playDoc.init_balance;
                    let totalBuyIn = playDoc.totalBuyIn;
                    // TODO:比赛临时代码处理
                    if (tableId != cupTableId) {
                        playDoc.init_balance = 0;
                        if (playDoc.init_balance <= 100e10 && TronWeb.isAddress(playDoc.uid) && saveRet) {
                            this.withdraw(playDoc.uid, tableId, playDoc.no || 0, init_balance, REVENUE_OPTYPE.PAYOUT_INIT, init_balance, 0);
                        } else {
                            loggerDefault.error("重新启动后玩家提款金额可疑: tableId:%s, addr:%s, balance:%s", tableId, playDoc.uid, init_balance);
                        }
                    } else {
                        realTable.sitDownQuiet(playDoc.seatNo, playDoc.uid, playDoc.uname, playDoc.photoIdx, playDoc.lv, init_balance, totalBuyIn);
                    }
                }
            }
        }
    }

    addTotalFee(fee) {
        this.totalFee += fee;
        let gamePotValue = Math.floor(fee * 0.97);
        this.totalPot += gamePotValue;
        this.jackpot += (fee - gamePotValue);
        console.log("addTotalFee==>", fee, this.totalFee, this.totalPot, this.jackpot)
        // this.totalFee = 92421769072164
        // this.totalPot = 89649116000000
        // this.jackpot = 208671613000
        dbService.saveLobby({ totalFee: this.totalFee, totalPot: this.totalPot, jackpot: this.jackpot })
        return true;
    }

    getJackpot() {
        return this.jackpot || 0;
    }

    getLobby(socket, tabletype, blindtype) {
        let tType = parseInt(tabletype);

        var typeArray;
        if (tType != 2 && tType != 6 && tType != 9) {
            typeArray = [2, 6, 9];
        } else {
            typeArray = [tType];
        }

        let tArray = [];
        var tbl;

        for (let i = 0; i < InitTableIdArray.length; i++) {
            tbl = this.getTableById(InitTableIdArray[i]);
            if (tbl != null) {
                tArray.push(tbl);
            }
        }
        socket.emit('lobbytables', { lobby: tArray, tabletype: tabletype, blindtype: blindtype, maxCnt: MAX_TABLE_COUNT, jackpot: this.jackpot || 0 });
    }

    getCupInfo(socket) {
        let cupConfog = config.cupConfig;
        let startCountDown = Math.floor((cupConfog.startTs - _.now()) / 1000);
        let endCountDown = Math.floor((cupConfog.endTs - _.now()) / 1000);
        if (startCountDown < 0) startCountDown = 0;
        if (endCountDown < 0) endCountDown = 0;
        let addrPlayers = cupConfog.addrPlayers;
        let whiteList = [];
        for (let key in addrPlayers) {
            whiteList.push(key);
        }
        let addrVIPs = cupConfog.addrVIPs;
        for (let key in addrVIPs) {
            whiteList.push(addrVIPs[key]);
        }
        let addrGMs = cupConfog.addrGMs;
        for (let key in addrGMs) {
            whiteList.push(addrGMs[key]);
        }
        socket.emit('cupInfo', { tableId: cupConfog.tableId, startCountDown: startCountDown, endCountDown: endCountDown, whiteList: whiteList });
    }

    getTableById(tableId) {
        let tbl = this.tablesMap[tableId];
        if (tbl == null) {
            return null;
        }

        let tblMsg = { tableId: tableId, gameType: commomEnum.GAME_TYPE.CASH, maxPlayers: tbl.config.maxPlayers, curPlayers: 0, bigBlind: tbl.config.bigBlind, seats: [] };
        tblMsg.curPlayers = tbl.getPlayersCount();
        tbl.allSeats.findNextNode(null, (o) => {
            let player = o.data.player;
            if (player != null && player.seatNo >= 0) {
                tblMsg.seats.push({
                    seatNo: player.seatNo,
                    addr: player.uid,
                    name: player.uname || player.uid,
                    lv: player.lv,
                    head: player.photoIdx
                });
            }
        });

        tblMsg.gameType = tbl.gameType;
        return tblMsg;
    }

    isTablePlaying(addr, tableId) {
        let tbl = this.tablesMap[tableId];
        if (tbl == null) {
            return false;
        }

        return tbl.getPlayerByUID(addr) != null;
    }

    checkSeat(addr, tableId, seatNo) {
        let tbl = this.tablesMap[tableId];
        if (tbl == null) {
            return ErrCode.ERR_NOT_IN_TABLE;
        }

        if (tbl.canSeat(seatNo)) {
            return ErrCode.ERR_SEAT_FULL;
        }

        if (tbl.getPlayerByUID(addr) != null) {
            return ErrCode.ERR_HAD_SEAT;
        }

        return null;
    }

    watchSeat(socket, addr, tableId) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                loggerDefault.info('Table not exist', tableId);
                return;
            }
            this._tryWatchSeat(socket, tbl);

            if (!TronWeb.isAddress(addr)) {
                tbl.getTableInfo(socket.id, addr);
                return;
            }
            let player = tbl.getPlayerByUID(addr);
            if (player == null || player.seatNo < 0) {
                tbl.getTableInfo(socket.id, addr);
                return;
            }
            let playTables = this.address2TablesMap[addr];
            if (playTables == null || !Array.isArray(playTables)) {
                playTables = [tableId];
                this.address2TablesMap[addr] = playTables;
            } else {
                if (playTables.length == 0 || _.indexOf(playTables, tableId) < 0) {
                    playTables.push(tableId);
                }
            }
            let ipAddr = socket.handshake.address.replace('::ffff:', '');
            tbl.reSitDown(addr, ipAddr, socket);
        } catch (e) {
            loggerDefault.error("watchSeat exception: ", e);
        }
    }

    _tryWatchSeat(socket, tbl) {
        let tableId = tbl.tableId;
        socket.join(tableId.toString());
    }

    removeFromWatch(socket, tableId) {
        socket.leave(tableId.toString());
    }

    sitDown(socket, account, tableId, seat) {
        try {
            loggerDefault.info("----lobby.sitDown----", { account, tableId, seat });
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                loggerDefault.info('Table not exist', tableId);
                return;
            }

            if (tableId === cupTableId && addrPlayers[account.addr] == null) {
                loggerDefault.info('account is not BOSS', tableId, account.addr);
                return;
            }

            if (tbl.getPlayerByUID(account.addr) != null) {
                loggerDefault.info('account is playing already 1', tableId, account.addr);
                return;
            }

            if (tbl.tableState === TABLE_STATE.STOP) {
                loggerDefault.info('table is closed', tableId, account.addr);
                return;
            }

            if (this.lobbyState == LOBBY_STATE.STOP) {
                socket.emit('errcode', ErrCode.TronPoker_0007);
                return;
            }

            let playTables = this.address2TablesMap[account.addr];
            let ipAddr = socket.handshake.address.replace('::ffff:', '');

            // 检测tableId是否在Array里面, 如果在里面, 并且真实在桌子里面, 就需要改成重入
            if (playTables != null && Array.isArray(playTables)) {
                let idx = _.indexOf(playTables, tableId);
                if (idx >= 0) {
                    let realPlayer = tbl.getPlayerByUID(account.addr);
                    if (realPlayer != null) {
                        let ipAddr = socket.handshake.address.replace('::ffff:', '');

                        tbl.reSitDown(account.addr, ipAddr, socket);
                    } else {
                        playTables.splice(idx, 1);
                    }
                }
            }

            if (playTables == null || !Array.isArray(playTables)) {
                this._tryWatchSeat(socket, tbl);     // 检测或加入观看列表
                let realSeat = tbl.sitDown(seat, account.addr, account.getNickName(), account.head, socket.id);
                if (realSeat >= 0) {
                    playTables = [tableId];
                    this.address2TablesMap[account.addr] = playTables;

                    // 广播给大厅入座成功
                    let msg = {
                        title: 'tablein',
                        content: {
                            tableId: tableId,
                            seatNo: realSeat,
                            addr: account.addr,
                            name: account.getNickName(),
                            head: account.head,
                            lv: account.tronbetLv,
                            curPlayers: tbl.getPlayersCount()
                        }
                    };
                    GLOBAL_EVENT.emit('broadcast', msg);
                } else {
                    return;
                }
            } else {
                let realSeat = tbl.sitDown(seat, account.addr, account.getNickName(), account.head, socket.id);
                if (realSeat >= 0) {
                    this._tryWatchSeat(socket, tbl);     // 检测或加入观看列表
                    playTables.push(tableId);

                    // 广播给大厅入座成功
                    let msg = {
                        title: 'tablein',
                        content: {
                            tableId: tableId,
                            seatNo: realSeat,
                            addr: account.addr,
                            name: account.getNickName(),
                            head: account.head,
                            lv: account.tronbetLv,
                            curPlayers: tbl.getPlayersCount()
                        }
                    };
                    GLOBAL_EVENT.emit('broadcast', msg);
                } else {
                    return;
                }
            }
            dbService.saveLobby(this);
        } catch (e) {
            loggerDefault.error("watchSeat exception: ", e);
        }
    }

    exitTable(socket, account, tableId) {
        try {
            console.log('exitTable', { account, tableId })
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                loggerDefault.info('Table not exist', tableId);
                return;
            }

            this.removeFromWatch(socket, tableId);

            let realPlayer = tbl.getPlayerByUID(account.addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                return;
            }

            tbl.playerExit(account.addr);
        } catch (e) {
            loggerDefault.error("exitTable exception: ", e);
        }
    }

    sitOut(tableId, addr) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                loggerDefault.info('Table not exist', tableId);
                return;
            }

            let realPlayer = tbl.getPlayerByUID(addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                return;
            }

            tbl.sitOutNextHand(addr);
        } catch (e) {
            loggerDefault.error("sitOut exception: ", e);
        }
    }

    backSeat(tableId, addr) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                loggerDefault.info('Table not exist', tableId);
                return;
            }

            let realPlayer = tbl.getPlayerByUID(addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                return;
            }

            tbl.backSeatNextHand(addr);
        } catch (e) {
            loggerDefault.error("backSeat exception: ", e);
        }
    }

    killRobot(tableId, addr) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                loggerDefault.info('Table not exist', tableId);
                return;
            }

            let realPlayer = tbl.getPlayerByUID(addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                return;
            }

            tbl.killRobot(addr);
        } catch (e) {
            loggerDefault.error("killRobot exception: ", e);
        }
    }

    resetTable(tableId) {
        try {
            console.log("---resetTable---", tableId)
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                return;
            }

            tbl.restTable();
        } catch (e) {
            loggerDefault.error("resetTable exception: ", e);
        }
    }

    // 超时踢出
    kickOut(addr, tableId, no, trxAmount, playerCnt, oldAmount, newAmount) {
        try {
            loggerDefault.info('--------kickOut-------', { addr, tableId, trxAmount })

            if (trxAmount != null && trxAmount > 0) {
                this.withdraw(addr, tableId, no, trxAmount, REVENUE_OPTYPE.PAYOUT, oldAmount, newAmount);
            }

            let playTables = this.address2TablesMap[addr];
            if (playTables != null && Array.isArray(playTables)) {
                if (playTables.length > 0) {
                    _.remove(playTables, function (o) { return o == tableId });
                }

                if (playTables.length == 0) {
                    delete this.address2TablesMap[addr];
                }
            }

            let msg = {
                title: 'tableout',
                content: {
                    tableId: tableId,
                    addr: addr,
                    curPlayers: playerCnt
                }
            };
            GLOBAL_EVENT.emit('broadcast', msg);
        } catch (e) {
            loggerDefault.error("kickOut exception, addr: " + e + "\n" + e.stack);
        }
    }

    // 由桌子调用
    async withdraw(addr, tableId, no, trxAmount, optype, oldAmount, newAmount) {
        trxAmount = Math.floor(trxAmount);
        if (trxAmount <= 0) {
            return;
        }

        let tmNow = getUnixTimeStamp();
        let order = {
            sysTxID: stringUtil.getRandomSeed(),
            txID: '',
            addr: addr,
            tableId: tableId,

            trxAmount: trxAmount,
            paytime: tmNow,
            blockId: 0,
            status: PAYOUT_STATE.NEW,
            lastUpdate: tmNow,
            lastCheckBlock: 0,
            lastSubmit: 0,
            retry: 0,
            optype: optype || 999,
            // RevenueLog需要的额外的数据
            no: no,
            oldAmount: oldAmount,
            newAmount: newAmount
        };


        // 数据库插入日志
        let addRet = await dbService.addPayOutOrder(order);
        if (addRet.ret) {
            ScanInstance.doPayOut(order, (ret, txID) => {
                if (ret) {
                    order.txID = txID;
                    dbService.updatePayOutOrder(order.sysTxID, { txID: txID, status: PAYOUT_STATE.SUBMITED });
                } else {
                    loggerDefault.error("withdraw调用合约失败1!!!", order.sysTxID);
                }
            });
        } else {
            loggerDefault.error("withdraw插入数据库失败!!!", order.sysTxID);
        }
    }

    getCanWinJackpot(cardsType, bb_lv) {
        let jackpotTRX = this.jackpot; //jackpot金额
        let trxAmount = Math.floor(jackpotTRX * commomEnum.JACKPOT_RATE(cardsType) * commomEnum.BB_LV_RATE(bb_lv));
        if (trxAmount <= 0) trxAmount = 0;
        return trxAmount;
    }

    async winJackpot(addr, tableId, tableNo, cardShow, cardsType, bb_lv) {
        // TODO: 去的正确的jackpot金额, 奖励金额, 牌组成, 牌型
        // TODO: 以下仅是测试代码
        // 1-4是花色, 1-E是点数
        // cardShow = 0x4A4B4C4D4E; // 代表方块皇家同花顺
        // cardsType = commomEnum.CARDS_TYPE.ROYAL_FLUSH;

        let jackpotTRX = this.jackpot; //jackpot金额
        let trxAmount = Math.floor(jackpotTRX * commomEnum.JACKPOT_RATE(cardsType) * commomEnum.BB_LV_RATE(bb_lv));
        if (trxAmount <= 0) {
            return;         // 没钱可以奖励(基本不会出现)
        }

        let tmNow = getUnixTimeStamp();
        let order = {
            sysTxID: stringUtil.getRandomSeed(),
            txID: '',
            addr: addr,
            tableId: tableId + tableNo * 1000000,
            cardShow: cardShow,
            jackpotType: cardsType,
            trxAmount: trxAmount,
            poolAmount: jackpotTRX,
            paytime: tmNow,
            blockId: 0,
            status: commomEnum.JACKPOT_STATE.NEW,
            lastUpdate: tmNow,
            lastCheckBlock: 0,
            lastSubmit: 0,
            retry: 0
        };

        let _val = this.jackpot - trxAmount;
        if (_val < 0) {
            _val = 0;
        }
        this.jackpot = _val;

        // 数据库插入日志
        let addRet = await dbService.addJackpotOrder(order);
        if (addRet.ret) {
            ScanInstance.doJackpot(order, (ret, txID) => {
                if (ret) {
                    order.txID = txID;
                    dbService.updateJackpotOrder(order.sysTxID, { txID: txID, status: PAYOUT_STATE.SUBMITED });
                } else {
                    loggerDefault.error("jackpot调用合约失败1!!!", order.sysTxID);
                }
            });
        } else {
            loggerDefault.error("jackpot插入数据库失败!!!", order.sysTxID);
            this.jackpot = this.jackpot + trxAmount;
        }
    }

    async sendback(addr, tableId, no, trxAmount, optype) {
        this.withdraw(addr, tableId, no, trxAmount, optype, 0, 0);
    }

    getPlayingTables(socket, account) {
        try {
            let playTables = this.address2TablesMap[account.addr];
            if (playTables == null || !Array.isArray(playTables) || playTables.length == 0) {
                socket.emit('playingtables', { playingTables: [] });
                return;
            }

            let existTables = [];
            let tableIdArray = [];
            for (let i = 0; i < playTables.length; ++i) {
                let tableId = playTables[i];
                let tbl = this.tablesMap[tableId];
                if (tbl != null && tbl.getPlayerByUID(account.addr) != null) {
                    existTables.push(playTables[i]);
                    if (tableId == cupTableId) {
                        tableIdArray.push({ tableId: tableId, gameType: commomEnum.GAME_TYPE.CUP });
                    } else {
                        tableIdArray.push({ tableId: tableId, gameType: commomEnum.GAME_TYPE.CASH });
                    }
                }
            }

            if (existTables.length < playTables.length) {
                playTables.length = 0;
                for (let i = 0; i < existTables.length; ++i) {
                    playTables.push(existTables[i]);
                }
            }

            socket.emit('playingtables', { playingTables: tableIdArray });
        } catch (e) {
            loggerDefault.error("getPlayingTables exception: ", e);
        }
    }

    doBet(socket, addr, val, tableId) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) { return; }

            let realPlayer = tbl.getPlayerByUID(addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                socket.emit('errcode', ErrCode.ERR_NOT_IN_TABLE);
                return;
            }

            tbl.playerBet(addr, val);
        } catch (e) {
            loggerDefault.error("doBet exception: ", e);
        }
    }

    doFold(socket, addr, tableId) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) { return; }

            let realPlayer = tbl.getPlayerByUID(addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                socket.emit('errcode', ErrCode.ERR_NOT_IN_TABLE);
                return;
            }

            tbl.playerBet(addr, 0);
        } catch (e) {
            loggerDefault.error("doFold exception: ", e);
        }
    }

    extraBB(socket, tableId, addr) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) { return; }

            let realPlayer = tbl.getPlayerByUID(addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                socket.emit('errcode', ErrCode.ERR_NOT_IN_TABLE);
                return;
            }

            tbl.cancelWaitingForBB(addr);
        } catch (e) {
            loggerDefault.error("extraBB exception: ", e);
        }
    }

    cancelBB(socket, tableId, addr) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) { return; }

            let realPlayer = tbl.getPlayerByUID(addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                socket.emit('errcode', ErrCode.ERR_NOT_IN_TABLE);
                return;
            }

            tbl.waitingForBB(addr);
        } catch (e) {
            loggerDefault.error("waitingForBB exception: ", e);
        }
    }

    timeMachine(socket, tableId, addr) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) { return; }

            let realPlayer = tbl.getPlayerByUID(addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                socket.emit('errcode', ErrCode.ERR_NOT_IN_TABLE);
                return;
            }

            tbl.timeMachine(addr);
        } catch (e) {
            loggerDefault.error("timeMachine exception: ", e);
        }
    }

    showPoker(socket, tableId, addr, idx) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) { return; }

            let realPlayer = tbl.getPlayerByUID(addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                socket.emit('errcode', ErrCode.ERR_NOT_IN_TABLE);
                return;
            }

            tbl.showPoker(addr, idx);
        } catch (e) {
            loggerDefault.error("showPoker exception: ", e);
        }
    }

    hidePoker(socket, tableId, addr, idx) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                return;
            }

            let realPlayer = tbl.getPlayerByUID(addr);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                socket.emit('errcode', ErrCode.ERR_NOT_IN_TABLE);
                return;
            }

            tbl.hidePoker(addr, idx);
        } catch (e) {
            loggerDefault.error("hidePoker exception: ", e);
        }
    }

    chat(socket, _from, tableId, _to, _content, _type, _fromName, _fromLv) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                return;
            }

            let realPlayer = tbl.getPlayerByUID(_from);
            if (realPlayer == null || realPlayer.seatNo < 0) {
                let vipIndex = _.findIndex(addrVIPs, (ad) => { return ad === _from; });
                console.log('chat', _content, vipIndex)
                if (vipIndex < 0) {
                    socket.emit('errcode', ErrCode.ERR_NOT_IN_TABLE);
                    return;
                }

                tbl.chatVIP(_from, _fromName, _fromLv, _to, _content, _type);
            } else {
                tbl.chat(_from, _to, _content, _type);
            }
        } catch (e) {
            loggerDefault.error("chat exception: ", e);
        }
    }

    getHistoryDetail(socket_id, addr, tableId, no) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                return;
            }

            tbl.getHistoryDetail(socket_id, addr, tableId, no);
        } catch (e) {
            loggerDefault.error("table_history_detail exception: ", e);
        }
    }

    getRankInfo(socket_id, tableId) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                return;
            }

            tbl.getRankInfo(socket_id);
        } catch (e) {
            loggerDefault.error("table_history_detail exception: ", e);
        }
    }

    adminStart(tableId, sec) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                return;
            }
            sec = parseInt(sec);
            tbl.adminStart(sec);
        } catch (e) {
            loggerDefault.error("adminStop exception: ", e);
        }
    }

    adminStop(tableId, sec) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                return;
            }
            sec = parseInt(sec);
            tbl.adminStop(sec);
        } catch (e) {
            loggerDefault.error("adminStop exception: ", e);
        }
    }

    getGodCards(tableId, socket_id, seatNo) {
        try {
            let tbl = this.tablesMap[tableId];
            if (tbl == null) {
                return;
            }

            tbl.getGodCards(socket_id, seatNo);
        } catch (e) {
            loggerDefault.error("getGodCards exception: ", e);
        }
    }

    getReportList(socket, tableId) {
        // let tbl = this.tablesMap[tableId];
        // if (tbl == null) {
        //     //loggerDefault.info('Table not exist', tableId);
        //     return;
        // }
        // tbl.getReportList(socket, tableId);
    }

    getReportDetail(socket, tableId, addr, no) {
        // let tbl = this.tablesMap[tableId];
        // if (tbl == null) {
        //     //loggerDefault.info('Table not exist', tableId);
        //     return;
        // }
        // tbl.getReportDetail(socket, tableId, addr, no);
    }

    updateHead(addr, head) {
        let playTables = this.address2TablesMap[addr];
        if (playTables != null && Array.isArray(playTables)) {
            let photoIdx = parseInt(head);
            if (photoIdx == 0) { photoIdx = 10000; }
            for (let i = 0; i < playTables.length; ++i) {
                let tbl = this.tablesMap[playTables[i]];
                if (tbl == null) { continue; }
                let player = tbl.getPlayerByUID(addr);
                if (player != null) {
                    player.photoIdx = photoIdx;
                }
            }
        }
    }

    sendUnconfirmedOrder(order) {
        try {
            let tbl = this.tablesMap[order.tableId];
            if (tbl == null) {
                return;
            }

            tbl.addUnconfirmedOrder(order);
        } catch (e) {
            // 抛出异常的订单, 将视为已处理
            loggerDefault.error("addUnconfirmedOrder exception: ", e);
        }
    }

    sendConfirmedOrder(order) {
        try {
            let tbl = this.tablesMap[order.tableId];
            if (tbl == null) {
                return;
            }

            tbl.orderConfirmed(order);
        } catch (e) {
            loggerDefault.error("sendConfirmedOrder exception: ", e);
        }
    }

    rollbackOrder(order) {
        try {
            let tbl = this.tablesMap[order.tableId];
            if (tbl == null) {
                return;
            }

            tbl.orderRollback(order);
        } catch (e) {
            loggerDefault.error("orderRollback exception: ", e);
        }
    }

    // 检测已经所有桌已经停止游戏
    async checkAllTableClosed() {
        if (this.lobbyState != LOBBY_STATE.STOP) {
            return false;
        }

        try {
            let allClear = true;
            for (let i = 0; i < InitTableIdArray.length; ++i) {
                let tableId = InitTableIdArray[i];
                let tbl = this.tablesMap[tableId];
                if (tbl != null && !tbl.clearCompleted) {
                    allClear = false;
                    await tbl.tryCloseTable();
                }
            }
            return allClear;
        } catch (e) {
            loggerDefault.error("checkAllTableClosed exception, " + e + "\n" + e.stack);
            return false;
        }
    }

    closeService() {
        if (this.lobbyState == LOBBY_STATE.STOP) { return; }
        this.lobbyState = LOBBY_STATE.STOP;

        // 这里要停止继续Scan, 防止保存冲突
        ScanInstance.stoped = true;

        let msg = { title: 'serverstop', };

        GLOBAL_EVENT.emit('broadcast', msg)
        let i = 0;
        let timer = setInterval(async () => {
            i += 1;
            console.log("--------checkAllTableClosed: allClear-------", i)
            let allClear = await this.checkAllTableClosed();
            console.log("--------checkAllTableClosed: allClear-------", allClear, i)
            if (allClear || i > 300) {
                clearInterval(timer);
                // 等待那些异步调用完成
                let tmo = setTimeout(() => {
                    clearTimeout(tmo);
                    dbService.closeMongodb(() => {
                        process.exit(0);
                    });
                }, 30000);
            }
        }, 10000);
    }
}

class PokerAccount {
    constructor(_addr) {
        this.addr = _addr;       // 钱包地址
        this.name = "";         // 昵称
        this.tronbetLv = 1;         // 平台等级
        this.head = "10000";        // 平台头像
        this.score = 0;             // 积分
        this.pullTime = 0;          // 拉取等级和头像的时间
    }

    setNickName(name) {
        this.name = name;
    }

    getNickName() {
        if (this.name == null || this.name === '') {
            return this.addr;
        } else {
            return this.name;
        }
    }

    sendInfo(socket, signtype) {
        socket.emit("accountinfo", {
            addr: this.addr,
            name: this.name,
            lv: this.tronbetLv,
            head: this.head,
            score: this.score,
            signtype: signtype          // 0无签名, 1显式, 2隐式
        });
    }
}


module.exports.TABLE_TYPE = TABLE_TYPE;
module.exports.BIGBLIND_TYPE = BIGBLIND_TYPE;
module.exports.TronTexasLobby = TronTexasLobby;
module.exports.PokerAccount = PokerAccount;
