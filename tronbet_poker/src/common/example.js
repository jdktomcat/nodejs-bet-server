[
    {
        type: "seat_log",
        data: {
            tableId: 901001,
            no: 199,
            seatNo: 3,
            uid: "uid_deng_feng",
            uname: "John",
            photoIdx: 48,
            balance: 246 * 1e6,
            playerState: 1,
            ts: 15011112222
        }
    },
    {
        type: "seat_log",
        data: {
            tableId: 901001,
            no: 199,
            seatNo: 5,
            uid: "uid_xi_gua",
            uname: "Nelson",
            photoIdx: 20,
            balance: 110 * 1e6,
            playerState: 1,
            ts: 15011112222
        }
    },
    {
        type: "seat_log",
        data: {
            tableId: 901001,
            no: 199,
            seatNo: 8,
            uid: "uid_sam",
            uname: "Irving",
            photoIdx: 20000,
            balance: 20 * 1e6,
            playerState: 1,
            ts: 15011112222
        }
    },
    {
        type: "table_begin",
        data: {
            id: 901001,
            no: 199,
            ante: 1,
            sb: 2,
            bb: 4 * 1e6,
            straddle: 8,
            now: 1543455,//当前时间戳
            playersInfo: [
                { seatNo: 0 },
                { seatNo: 1 },
                { seatNo: 2 },
                { seatNo: 3, position: "SB", uname: "John", uid: "uid_deng_feng", photoIdx: 48, playerState: 2, balance: 246 * 1e6 },
                { seatNo: 4 },
                { seatNo: 5, position: "BB", uname: "Nelson", uid: "uid_xi_gua", photoIdx: 20, playerState: 2, balance: 110 * 1e6 },
                { seatNo: 6 },
                { seatNo: 7 },
                { seatNo: 8, position: "BTN", uname: "Irving", uid: "uid_sam", photoIdx: 20000, playerState: 2, balance: 20 * 1e6 },
            ],
            yourSeatNo: 5,
            yourHandCards: [{ style: 'c', point: 12 }, { style: 'd', point: 3 }]
        }
    },
    {
        type: "round_begin",
        data: {
            roundIndex: 1,
            round: "PRE_FLOP",
            communityCards: [],
            pot: 0,
            lastPot: 0,
        }
    },
    {
        type: "next_actor",
        data: {
            player: { seatNo: 3, position: "SB", init_balance: 6000, round_begin_balance: 5999, nowBalance: 5997, opType: "SB", round_bet: 2, betArray: [2] },
        }
    },
    {
        type: "player_log",
        data: {
            logs: [
                { seatNo: 3, nowBalance: 201 * 1e6, opType: 9, lastBet: 0, roundBet: 45 * 1e6, betArray: [30 * 1e6, 15 * 1e6] }
            ],
            pot: 45 * 1e6
        }
    },
    {
        type: "next_actor",
        data: {
            player: { seatNo: 5, position: "BB", init_balance: 6000, round_begin_balance: 5999, nowBalance: 5997, opType: "SB", round_bet: 2, betArray: [2] },
        }
    },
    {
        type: "player_log",
        data: {
            logs: [
                { seatNo: 5, nowBalance: 65 * 1e6, opType: 3, lastBet: 0, roundBet: 45 * 1e6, betArray: [30 * 1e6, 15 * 1e6] }
            ],
            pot: 90 * 1e6
        }
    },
    {
        type: "next_actor",
        data: {
            player: { seatNo: 8, position: "SB", init_balance: 6000, round_begin_balance: 5999, nowBalance: 5997, opType: "SB", round_bet: 2, betArray: [2] },
        }
    },
    {
        type: "player_log",
        data: {
            logs: [
                { seatNo: 8, nowBalance: 20 * 1e6, opType: 4, lastBet: 0, roundBet: 0, betArray: 0 }
            ],
            pot: 90 * 1e6
        }
    },
    {
        type: "round_end",
        data: {
            roundIndex: 1,
            round: "PRE_FLOP",
            pot: 90 * 1e6,
            lastPot: 387,
            pots: [
                { idx: 0, value: 90 * 1e6, players: ["SB", "BB", "BTN"] }
            ]
        }
    },
    {
        type: "round_begin",
        data: {
            roundIndex: 2,
            round: "FLOP",
            communityCards: [{ style: "c", point: 1, idx: 0 }, { style: "c", point: 12, idx: 1 }, { style: "d", point: 6, idx: 2 }],
            pot: 90 * 1e6,
            lastPot: 3,
        }
    },
    {
        type: "next_actor",
        data: {
            player: { seatNo: 3, position: "SB", init_balance: 6000, round_begin_balance: 5999, nowBalance: 5997, opType: "SB", round_bet: 2, betArray: [2] },
        }
    }, {
        type: "player_log",
        data: {
            logs: [
                { seatNo: 3, nowBalance: 201 * 1e6, opType: 2, lastBet: 0, roundBet: 0, betArray: 0 }
            ],
            pot: 90 * 1e6
        }
    },
    {
        type: "next_actor",
        data: {
            player: { seatNo: 5, position: "BB", init_balance: 6000, round_begin_balance: 5999, nowBalance: 5997, opType: "SB", round_bet: 2, betArray: [2] },
        }
    }, {
        type: "player_log",
        data: {
            logs: [
                { seatNo: 5, nowBalance: 65 * 1e6, opType: 2, lastBet: 0, roundBet: 0, betArray: 0 }
            ],
            pot: 90 * 1e6
        }
    },
    {
        type: "round_end",
        data: {
            roundIndex: 2,
            round: "FLOP",
            pot: 90 * 1e6,
            lastPot: 387,
            pots: [
                { idx: 0, value: 90 * 1e6, players: ["SB", "BB", "BTN"] }
            ]
        }
    },
    {
        type: "round_begin",
        data: {
            roundIndex: 3,
            round: "TURN",
            communityCards: [{ style: "d", point: 11, idx: 3 }],
            pot: 90 * 1e6,
            lastPot: 3,
        }
    },
    {
        type: "next_actor",
        data: {
            player: { seatNo: 3, position: "SB", init_balance: 6000, round_begin_balance: 5999, nowBalance: 5997, opType: "SB", round_bet: 2, betArray: [2] },
        }
    },
    {
        type: "player_log",
        data: {
            logs: [
                { seatNo: 3, nowBalance: 181 * 1e6, opType: 9, lastBet: 0, roundBet: 20 * 1e6, betArray: [20 * 1e6] }
            ],
            pot: 110 * 1e6
        }
    },
    {
        type: "next_actor",
        data: {
            player: { seatNo: 5, position: "BB", init_balance: 6000, round_begin_balance: 5999, nowBalance: 5997, opType: "SB", round_bet: 2, betArray: [2] },
        }
    },
    {
        type: "player_log",
        data: {
            logs: [
                { seatNo: 5, nowBalance: 23 * 1e6, opType: 5, lastBet: 0, roundBet: 42 * 1e6, betArray: [20 * 1e6, 22 * 1e6] }
            ],
            pot: 152 * 1e6
        }
    },
    {
        type: "next_actor",
        data: {
            player: { seatNo: 3, position: "SB", init_balance: 6000, round_begin_balance: 5999, nowBalance: 5997, opType: "SB", round_bet: 2, betArray: [2] },
        }
    },
    {
        type: "player_log",
        data: {
            logs: [
                { seatNo: 3, nowBalance: 159 * 1e6, opType: 3, lastBet: 20 * 1e6, roundBet: 42 * 1e6, betArray: [20 * 1e6, 22 * 1e6] }
            ],
            pot: 174 * 1e6
        }
    },
    {
        type: "round_end",
        data: {
            roundIndex: 3,
            round: "TURN",
            pot: 174 * 1e6,
            lastPot: 387,
            pots: [
                { idx: 0, value: 174 * 1e6, players: ["SB", "BB", "BTN"] }
            ]
        }
    },
    {
        type: "round_begin",
        data: {
            roundIndex: 4,
            round: "RIVER",
            communityCards: [{ style: "d", point: 9, idx: 4 }],
            pot: 174 * 1e6,
            lastPot: 3,
        }
    },
    {
        type: "next_actor",
        data: {
            player: { seatNo: 3, position: "SB", init_balance: 6000, round_begin_balance: 5999, nowBalance: 5997, opType: "SB", round_bet: 2, betArray: [2] },
        }
    },
    {
        type: "player_log",
        data: {
            logs: [
                { seatNo: 3, nowBalance: 129 * 1e6, opType: 9, lastBet: 0, roundBet: 30 * 1e6, betArray: [30 * 1e6] }
            ],
            pot: 204 * 1e6
        }
    },
    {
        type: "next_actor",
        data: {
            player: { seatNo: 5, position: "BB", init_balance: 6000, round_begin_balance: 5999, nowBalance: 5997, opType: "SB", round_bet: 2, betArray: [2], timeBank = 0, ms = 1 },
        }
    },
    {
        type: "player_log",
        data: {
            logs: [
                { seatNo: 5, nowBalance: 159 * 1e6, opType: 1, lastBet: 0, roundBet: 23 * 1e6, betArray: [23 * 1e6] }
            ],
            pot: 227 * 1e6
        }
    },
    {
        type: "round_end",
        data: {
            roundIndex: 4,
            round: "RIVER",
            pot: 220 * 1e6,
            lastPot: 387,
            pots: [
                { idx: 0, value: 220 * 1e6, players: ["SB", "BB", "BTN"] }
            ],
            return: { value: 6 * 1e6, seatNo: 3, nowBalance: 136 * 1e6 }
        }
    },
    {
        type: "show_cards",
        data: {
            players: [
                { seatNo: 3, position: "SB", cards: [{ style: "d", point: 12, idx: 0 }], reson: "allin" },
                { seatNo: 8, position: "BTN", cards: [{ style: "c", point: 11, idx: 1 }], reson: "allin" }
            ]
        }
    },
    {
        type: "show_down",
        data: {
            pot: 220 * 1e6,
            lastPot: 387,
            pots: [
                {
                    idx: 0, value: 220 * 1e6, players: ["SB", "BB", "BTN"], winners: [
                        { seatNo: 3, nowBalance: 356 * 1e6, value: 220 * 1e6 }
                    ]
                }
                // {idx:1, value: 2000, players: ["BB", "BTN"],winners:["BB"] }
            ],
            // showdown:[
            //     { seatNo: 2, position: "SB", cards: [{ style: "c", point: 12 }, { style: "d", point: 12 }], reson: "showdown" },
            //     { seatNo: 5, position: "BB", cards: [{ style: "c", point: 14 }, { style: "c", point: 13 }], reson: "showdown" },
            //     { seatNo: 9, position: "BTN", cards: [{ style: "d", point: 13 }, { style: "h", point: 12 }], reson: "allin" },
            // ]
        }
    },
    {
        type: "table_end",
        data: {
            ts: 15011112222
        }
    },
    {
        type: "seat_log",
        data: {
            tableId: 901001,
            no: 199,
            seatNo: 3
        }
    },
    {
        type: "table_begin",
        data: {
            id: 901001,
            no: 199,
            ante: 1,
            sb: 2,
            bb: 4 * 1e6,
            straddle: 8,
            now: 1543455,//当前时间戳
            playersInfo: [
                { seatNo: 0 },
                { seatNo: 1 },
                { seatNo: 2 },
                { seatNo: 3 },
                { seatNo: 4 },
                { seatNo: 5, position: "BB", uname: "Nelson", uid: "uid_xi_gua", photoIdx: 20, playerState: 2, balance: 110 * 1e6 },
                { seatNo: 6 },
                { seatNo: 7 },
                { seatNo: 8, position: "BTN", uname: "Irving", uid: "uid_sam", photoIdx: 20000, playerState: 2, balance: 20 * 1e6 },
            ],
            yourSeatNo: 5,
            yourHandCards: []
        }
    },
    {}
]





1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
let all_info = {
    type: "all_info",
    data: {
        id: 901001,
        no: 199,
        ante: 1,
        sb: 2,
        bb: 4 * 1e6,
        btn: 8,
        straddle: 8,
        now: 1543455,//当前时间戳
        communityCards: [
            { style: "c", point: 11, idx: 0 },
            { style: "s", point: 10, idx: 1 },
            { style: "d", point: 12, idx: 2 }
        ],
        playersInfo: [
            { seatNo: 0 },
            { seatNo: 1 },
            { seatNo: 2, showCards: [], position: "SB", uname: "Micheal", uid: "uid_deng_feng", photoIdx: 48, playerState: 2, balance: 246 * 1e6, opType: 1, bet: 30 * 1e6, betArray: [30 * 1e6] },
            { seatNo: 3 },
            { seatNo: 4 },
            { seatNo: 5, showCards: [{ style: 's', point: 14, idx: 0 }], position: "BB", uname: "John", uid: "uid_xi_gua", photoIdx: 20, playerState: 2, balance: 110 * 1e6, opType: 2, bet: 0, betArray: [] },
            { seatNo: 6, showCards: [], position: "BB", uname: "Robot", uid: "uid_dealer", photoIdx: 20002, playerState: 2, balance: 25 * 1e6, opType: 4, bet: 0, betArray: [] },
            { seatNo: 7 },
            { seatNo: 8, showCards: [], position: "BTN", uname: "Garnnet", uid: "uid_sam", photoIdx: 20000, playerState: 2, balance: 20 * 1e6, opType: 2, bet: 0, betArray: [] },
        ],
        pot: 756 * 1e6,
        pots: [
            { idx: 0, value: 174 * 1e6, players: ["SB", "BB", "BTN"] },
            { idx: 1, value: 552 * 1e6, players: ["SB", "BB", "BTN"] }
        ],
        yourSeatNo: 5,
        yourHandCards: [{ style: 's', point: 14 }, { style: 's', point: 5 }],
        currentTalker: { seatNo: 8, countDown: 12000, timeBank: 300000, ms: 20000 },
        showdown: {
            winners: [
                { seatNo: 3, value: 200 * 1e6 },
            ]
        }
    }
}