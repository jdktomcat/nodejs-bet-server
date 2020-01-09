const conf = require('./src/configs/config');
let io = require('socket.io')(conf.app.websocket_port);
io.set('origins', '*:*'); //运行跨域
// const WhiteHosts = [
//     'https://cdn.tronbet.io',
//     'https://res.tronbet.io',
//     'https://www.tronbet.io',
//     'https://tronbet.io',
//     'http://cdn.tronbet.io',
//     'http://res.tronbet.io',
//     'http://www.tronbet.io',
//     'http://tronbet.io',
//     'https://backend.tronbet.io',
//     'https://korea.tronbet.io',
//     'http://korea.tronbet.io',
//     'https://mirror.tronbet.io',
//     'http://mirror.tronbet.io',
//     'https://mirror2.tronbet.io',
//     'http://mirror2.tronbet.io',
//     'http://localhost:3000',
//     'http://192.168.6.202:3000',
//     'https://www.wink.org',
//     'https://wink.org',
//     'https://cdn.wink.org',
//     'https://res.wink.org',
//     'http://www.wink.org',
//     'http://wink.org',
//     'http://cdn.wink.org',
//     'http://res.wink.org',
//   ]

// io.origins((origin, callback) => {
//   for (let one of WhiteHosts) {
//       if (one == origin) return callback(null, true);
//   }
//   callback('origin not allowed', false)
// });

function getIo() {
    return io
}

module.exports.getIo = getIo
