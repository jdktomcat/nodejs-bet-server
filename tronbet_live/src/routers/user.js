/**
 * 用户登录登出等接口
 */

const router = require('koa-router')();
const user = require('./../service/user');
const cron = require('./../service/cron');

module.exports = router.get('/login', user.login);
module.exports = router.get('/withdraw', user.withdraw);
module.exports = router.get('/balance', user.userBalance);
module.exports = router.get('/games', user.games);
module.exports = router.get('/profit', user.realTimeProfit);
module.exports = router.get('/live2antelog', user.getAddLiveTrxToAntePool);
module.exports = router.get('/jackpot', user.getJackPotDetail);

module.exports = router.post('/login', user.login);
module.exports = router.post('/withdraw', user.withdraw);
module.exports = router.post('/balance', user.userBalance);
module.exports = router.post('/games', user.games);
module.exports = router.post('/verify', user.verifySession);
module.exports = router.post('/profit', user.realTimeProfit);
module.exports = router.post('/jackpot', user.getJackPotDetail);
module.exports = router.post('/getKey', user.getKey);
