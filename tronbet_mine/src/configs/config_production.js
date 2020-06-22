const path = require('path');

module.exports = {
	GAME_MANAGER:'a7d1450b24ce774e8efd5f7dfb4ad7239b2ad000ac002dbe3aee48cbb60f0ed7',
	TronWeb:{
		nodes:['master','slave'],//TronWeb 节点
		GAME_MANAGER_PK:'',
		IGNORE_SOLIDITY_NODE_SCAN: true, //忽略检测静态节点状态
		SCAN_NODE_INTERVAL: 3100, //node 扫描间隔(ms)
		HTTP_TIME_OUT: 5000 //node http request 超时时间(ms)
	},
	redisConfig: {
	    host: '127.0.0.1',
	    port: 6379,
	    db: 1,
	    pwd: ''
        }
};
