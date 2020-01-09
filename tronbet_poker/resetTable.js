const io = require('socket.io-client');
const readline = require('readline');
const _ = require('lodash')._;
const TronWeb = require('tronweb');

const socket = io("http://127.0.0.1:9011");
const tronUrl = 'https://api.trongrid.io';

const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider(tronUrl);
const solidityNode = new HttpProvider(tronUrl);


socket.on('connect', () => {
    console.log("connect success", socket.id);
    let args = process.argv.splice(2)
    console.log(args);
    let pk = args[0];
    let param = args[1];

    let tronWeb = new TronWeb(fullNode, solidityNode, tronUrl, pk);
    let time = Math.floor(Date.now() / 1000);
    let msg = TronWeb.fromUtf8('tronbetio' + time);
    

    tronWeb.trx.sign(msg, (err, signature) => {
        if (err) { console.log(err); return; }
        let data = {
            addr: TronWeb.address.fromPrivateKey(pk),
            msg: msg,
            signature: signature,
            cmd: 'resettable',
            param: param.toString()
        };

        console.log(data);
         
        socket.emit('adminCMD', data);
    });
});

socket.on('disconnect', () => {
    console.log("socket disconnect", socket.id);
    process.exit(0);
});

process.on('SIGINT', async () => {
    process.exit(0);
});
