const io = require('socket.io-client');
const readline = require('readline');
const _ = require('lodash')._;
const playerInfo = require('./player');

class client {
    constructor(player) {
        this.room = 901001,
            this.player = player;
        this.socket = io("http://127.0.0.1:1997");
        this.socket.on('disconnect', () => {
            console.log("WTF disconnect",this.socket.id);
            process.exit(0);
        })
        this.socket.on('table_aj', (data) => {
            console.log("table_aj++", data);
        })
        this.socket.on('msg', (data) => {
            console.log("msg", data);
        })
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.rl.on('line', (args) => {
            args = _.split(args, ' ');
            let command = args[0];
            let value = args[1];
            this.exec(command, value);
        });
    }
    sendMsg(tableId, data) {

    }
    exec(command, value) {
        switch (command) {
            case "b":
                command = "bet";
                break;
            case "x":
                command = "check";
                console.log("过牌(check)", 0);
                break;
            case "f":
                command = "fold";
                console.log("弃牌(fold)", 0);
                break;
            case "d":
                command = "sitdown";
                console.log("坐下(sitdown)", value);
                break;
            case "i":
                command = "buyin";
                console.log("买入(buyin)", 0);
                break;
            case "o":
                command = "sitout";
                console.log("站起(sitout)", 0);
                break;
            case "m":
                command = "message";
                console.log("消息(message)", 0);
                break;
            case "h":
                command = "history";
                console.log("历史(history)", 0);
                break;
            case "t":
                command = "timebank";
                console.log("时间银行(timebank)", 0);
                break;
            case "l":
                command = "leave";
                console.log("离开(leave)", 0);
                break;
        }

        if (_.isFunction(this[command])) {
            this[command](value);
        }
        return "unknown command";

    }
    //坐下
    sitdown(seatNo) {
        let player = this.player;
        this.socket.emit("sitDown", {
            room: this.room,
            addr: player.uid,
            uname: player.uname,
            photoIdx: player.photoIdx,
            seatNo: seatNo
        });
    }
    //站起
    sitout() { }
    //买入
    buyin(value) {
        let player = this.player;
        this.socket.emit("buyIn", {
            room: this.room,
            addr: player.uid,
            value: value
        });
     }
    //补盲
    extrabb() { }
    //离开
    leave() { }
    //查看历史
    history() { }
    //获取牌桌信息
    getTableInfo() { }
    //获取玩家信息
    getPlayerInfo() { }
    //获取自己信息
    getMyselfInfo() { }
    //bet
    bet() { }
    //check
    check() { }
    //fold
    fold() { }
    //call
    call() { }
    //raise
    raise() { }
    //allin
    allin() { }
    //延时
    timeBank() { }
    //发消息
    sendMessage() { }
    //标记别人(备注/颜色)
    tag(uid, remark, color) { }
    //购买保险
    insurance() { }

    autoCheck() { }
    autoFold() { }
    autoCallAny() { }

    onTableInfo() { }
    onRoundInfo() { }
    onPlayerInfo() { }
    onPlayerLog() { }
    onPlayerMessage() { }
    onSystemMessage() { }
    onTableInfo() { }
    onTableInfo() { }
}

const program = require('commander')
const inquirer = require('inquirer')
const chalk = require('chalk')

program
    .version('0.0.1')
    .option('--id <id>', '用户表示/地址')
    .option('--name <name>', '用户名')
    .option('--buyin <buyin>', '用户买入')

program.parse(process.argv);

console.log("process.argv", process.argv);

function start() {
    let uid = program.id;
    let uname = program.name;
    let photoIdx = 10000;
    let seatNo = 0;
    let buyin = program.buyin;
    console.log("client", uid, uname, photoIdx, seatNo, buyin);
    if (_.isEmpty(uid) || _.isEmpty(uname) || buyin <= 0) {
        console.log("Param is error !")
        return;
    }
    let player = new playerInfo(uid, uname, photoIdx, seatNo, buyin);
    new client(player);
}

start();