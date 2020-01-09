const tronNodePool = require('./src/service/tronNodePool');
const modelLogDice = require('./src/models/modelLogDice');
const gameCenter = require('./src/games/center');
const appData = require('./appData');
const _ = require('lodash')._;

async function fix() {
    await tronNodePool.init();
    let t_getAllPlayersAddress = setTimeout(async () => {
        clearTimeout(t_getAllPlayersAddress);
        let res = await modelLogDice.getAllPlayersAddress();
        for (let info of res) {
            let addr = info.addr;
            let name = info.name;
            if (_.isEmpty(name)) {
                let t_getAccount = setTimeout(() => {
                    clearTimeout(t_getAccount);
                    gameCenter.getAccount(addr, (err, res) => {
                        if (err) return;
                        if (res == null) return;
                        name = res.account_name || '';
                        if (!_.isEmpty(name)) {
                            console.log("address:name =>", addr, name);
                            appData.updateName(addr, name);
                        }
                    });
                }, 50);
            }
        }
    }, 10000);
}

fix();