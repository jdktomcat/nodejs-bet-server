const _ = require('lodash')._;
const crypto =require('crypto');
const config = require('./src/configs/config');
const log4js = require('./src/configs/log4js.config');
const sha3 = require('js-sha3');

const loggerDefault = log4js.getLogger('default');
const loggerError = log4js.getLogger('error');

const tronNodePool = require('./src/service/tronNodePool');
const tronSerivce= require('./src/service/tronService');
const db=require('./src/utils/dbUtil');

const events = require('events');
const Redis=require("ioredis");
const appDataEvent = new events.EventEmitter();


const gameDesc="扫雷游戏";


//扫雷活动需求
const gameType='mine';
const mineTrx=100;//trx的数量，没有小数点 类似100trx这种
let exchangeMap={
	"trx":1,
	"usdt":62.847//默认值
};
let decimalPoint={
	"trx":1000000,
	"usdt":1000000//需要根据usdt发行的小数点填写
}
let ACTIVITY_START_TS = config.activity.startTime;
let ACTIVITY_END_TS = config.activity.endTime;


//合约相关数据
const MAIN_MINE_GAME='TronBetMine';
const MINE_GAME_ORACLE='TronBetMineOracle';
const MAIN_MINE_GAME_GET_ORDER='getOrder';
const MAIN_MINE_GAME_GET_ORDERS_BY_MINERS='getOrdersByMiners';
const MINE_GAME_ORACLE_BEGIN_GAME='gameBegin';
const MINE_GAME_ORACLE_END_GAME='gameEnd';
const MINE_GAME_CANCEL_MIND='cancleMine';
const MINE_GAME_SET_TOKEN_RATE='setToken2TrxRate';

//用户登陆签名允许的最大时间偏差值
const USER_LOGIN_TIME_DEVIATION=3*60*1000;

const USER_LOGIN_TIME_INVALID=1000;
const USER_LOGIN_SIGN_INVALID=1001;
const ORDER_STATUS_IS_NOT_ALLOW_TO_MIND=1002;
const USER_MINE_COL_NOT_RIGHT_OVER_LIMIT=1003;
const USER_MINE_ROW_NOT_RIGHT_OVER_LIMIT=1004;
const USER_MINE_COL_IS_NOT_EQUAL_TO_REDIS=1005;
const USER_MINE_TIME_IS_USED_OUT=1006;
const USER_ORDER_STATUS_IS_NOT_USER_READY=1007;
const SERVER_SEND_START_GAME_TX_FAILURE=1008;
const SERVER_SEND_CANCEL_GAME_TX_FAILURE=1009;
const SERVER_SEND_END_GAME_TX_FAILURE=1010;
const USER_MINE_STEP_TIME_IS_OUT=10061;
const USER_TIME_LIFE_TIME_IS_OUT=10062;
const TOKEN_EXPIRE=9999;

const SUCCESS=0;
const SERVER_BUSY=999;
const NOT_PASS=998;
const REDIS_GAME_DATA_NOT_RIGHT=997;
const REDIS_GAME_DATA_NOT_EXIST=996;
const NET_BUSY=995;
const STORE_BUSY=994;
const USER_GAME_DATA_NOT_FOUND=993;


const MAIN_MINE_GAME_GET_ORDER_RESULT='getOrderResult';
const USER_LOGIN_RESULT='userLoginResult';
const START_NEW_GAME_RESULT='startNewGameResult';
const LAST_GAME_RESULT="lastGameResult";
const GAME_OVER='gameOver';
const GAME_START='gameStart';
const MINE_RESULT='userMineResult';
const QUIT_MINE_RESULT='quitMineResult';
const QUERY_GAME_DATA_RESULT='queryGameDataResult';
const IS_TIME_OUT_RESULT='isTimeOutResult';
const QUERY_USER_LOGS_RESULT='queryUserLogsResult';


const ZEROS="00000000000000000000000000000000000000";//用来把长度不足的字符串前面进行补0使用

const ORDER_STATUS_USER_READY=0x01;//用户发送交易
const ORDER_STATUS_SERVER_READY=0x02;//服务器已发送交易
const ORDER_STATUS_CLOSE=0xFF;//订单关闭


const GAME_RESULT_WIN=0x01;
const GAME_RESULT_LOSE=0x02;
const GAME_RESULT_CANCEL=0x03;


const MINE_REDIS_PREFIX='MINE:MULTI:COIN:USER:';
const LATEST_GAME_INFO='LATEST:';
const USER_LOG='player:logs';

const RETRY_TIME=0;
const GAME_LIFE_TIME=24*60*60*1000;//游戏从下单到被强制结束的时间(毫秒)
const GAME_STEP_TIME=30*60*1000;//游戏每一步的时间(步时)
const TOKEN_EXPIRE_TIME=24*60*60*1000;//token 失效时间


const GAME_MODEL_NORMAL=0x01;//普通模式
const GAME_MODEL_HERO=0x02;//英雄模式

/*
 * 每次启动的时候PRE_SALT 都会不一样，不可以预测的前缀
 */
const PRE_SALT=crypto.randomBytes(32).toString('hex');

let UserTokenMap={};
let UserLastOpTimeMap={};
let PENDING_ORDERS={};//value 是希望监控到的订单状态，如果订单状态没有改变，同样不会处理
let LastGameResultReturn={};
let USER_GAMING={};

let io = require('socket.io')(config.port.tronbet_mine);
io.set('origins', '*:*'); 

let redis;
let Map_addr_socket = {};
let Map_socket_addr = {};

let tronWeb;

init();//进程入口

/*
 * 主函数
 */
async function init() {
	await initProcessEventHandler();
	await initDb();
	await initCurrencyPrice();
	await initTronWebPool();
	await initRedis();
	await initSocketIO();
	await initCheckOrders();
}

async function initTronWebPool(){
	await tronNodePool.init();
}

async function initDb(){
	await db.init(config);
}

async function initCurrencyPrice(){
	await refreshPrice();
}

/*
 * 初始化redis
 */
async function initRedis(){
	redis=Redis.createClient(
	{
		host: config.redisConfig.host,
		port: config.redisConfig.port,
		password: config.redisConfig.pwd,
		db: config.redisConfig.db
	});
	redis.on('ready',function(err){
		if(!err){
			console.log("Redis is ready for "+gameDesc);
		}else{
			console.log(err);
		}
	});
}

/*
 * 初始化socket 链接
 */
async function initSocketIO(){
	io.on('connection', socketConnected);
}

/*
 * 用户进入
 */
function socketConnected(newSocket){
	console.log("用户访问["+gameDesc+"]");
	newSocket.on('disconnect',socketDisconnected.bind(newSocket));//断开链接的时候
	newSocket.on('getOrder',getOrder.bind(newSocket));//获取订单
	newSocket.on('userLogin',userLogin.bind(newSocket));//登陆
	newSocket.on('startNewGame',startNewGame.bind(newSocket));//开启新的游戏
	newSocket.on('userMine',userMine.bind(newSocket));//用户挖雷了
	newSocket.on('quitMine',quitMine.bind(newSocket));//用户结束扫雷
	newSocket.on('queryGameData',queryGameData.bind(newSocket));//查询游戏信息
	newSocket.on('isTimeOut',isTimeOut.bind(newSocket));//判断是否超时，超时会直接结束游戏，所以需要传递token
	newSocket.on('queryUserLogs',queryUserLogs.bind(newSocket));//查询用户的游戏记录(最后10条)，从redis中获取
}


/*
 * 查询用户游戏记录
 */
function queryUserLogs(data){
	console.log("queryUserLogs....");
	let tw=getTronWeb();	
	let socket=this;
	let result={};
	let addr=data.addr;
	if(!tw.isAddress(addr)){
		console.log("用户使用不正确的地址[%s]进行[queryUserLogs]",addr);
		return;	
	}
	redis.get(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,function(err,info){
		if(err){
			console.log("获取Redis失败[%s][queryUserLogs]",addr);
			result.errorCode=STORE_BUSY;
			socket.emit(QUERY_USER_LOGS_RESULT,result);	
			return;
		}
		let userLatestRedisInfo;						
		if(!info){//用户没有玩过游戏，自然也不存在什么超时了
			result.errorCode=USER_GAME_DATA_NOT_FOUND;	
			socket.emit(QUERY_USER_LOGS_RESULT,result);	
			return;
		}
		userLatestRedisInfo=JSON.parse(info);
		let lastOrderNo=parseInt(userLatestRedisInfo.order.orderNo);//一般不会出现异常 
		//获取最近9条已经完结的日志，有可能会没有那么多
		let orderIdList=[];
		for(var i=lastOrderNo-1;i>0;i--){
			if(orderIdList.length>=9){
				break;
			}
			orderIdList.push(i);
		}
		let userLogList=[];//返回给客户端的用户
		let win=userLatestRedisInfo.gameResult===1;//通过计算
		let close=userLatestRedisInfo.gameStatus==ORDER_STATUS_CLOSE;

		//用户的挖雷记录
		let userSteps=[];
		//已经显示的地雷
		let mines=[];
		for(var i=31;i>0;i--){
			if(userLatestRedisInfo.mineSteps[i]==0){
				break;
			}
			userSteps.push(userLatestRedisInfo.mineSteps[i]);
			mines.push(userLatestRedisInfo.mines[i]);
		}
		//如果游戏已经结束了，那么可以显示所有的地雷给用户看
		let allMines=[]
		if(userLatestRedisInfo.gameStatus===ORDER_STATUS_CLOSE){
			for(var i=31;i>0;i--){
				if(userLatestRedisInfo.mines[i]!=0){
					allMines.push(userLatestRedisInfo.mines[i]);
				}
			}
		}
		if(userLatestRedisInfo.gameStatus!==ORDER_STATUS_CLOSE){
			userLatestRedisInfo.salt="0x"+userLatestRedisInfo.salt;
			userLogList.push({
				"id":userLatestRedisInfo.order.orderNo,
				"bet":parseInt(userLatestRedisInfo.order.orderAmount._hex),
				"prefix":MINE_REDIS_PREFIX,
				"order":userLatestRedisInfo.order,
				"orderTokenId":userLatestRedisInfo.order.orderTokenId,
				"blockNo":userLatestRedisInfo.order.orderBlockH,
				"now":userLatestRedisInfo.mineHash,
				"payout":userLatestRedisInfo.winAmount,//需要计算出来 win 计算出来 lose 0
				"now":userLatestRedisInfo.mineHash,//当前mineHash
				"result":close?allMines:mines,//已关闭显示所有的地雷，未关闭显示用户挖的地雷
				"userSteps":userSteps,
				"mines":mines,
				"allMines":close?allMines:[],
				"salt":close?userLatestRedisInfo.salt:'',
				"gameResult":userLatestRedisInfo.gameResult
			});
		}else{
			orderIdList.push(userLatestRedisInfo.order.orderNo);
		}
		//console.log(JSON.stringify(orderIdList));
		if(orderIdList.length>0){ 
			redis.hmget(MINE_REDIS_PREFIX+USER_LOG+addr,orderIdList,function(err,rs){
				if(err){
					console.log("获取Redis失败[%s][queryUserLogs]=orderNos=[%s]",addr,JSON.stringify(orderIdList));
					console.log(err);
					result.errorCode=STORE_BUSY;
					socket.emit(QUERY_USER_LOGS_RESULT,result);	
					return;
				}//只有完结的才会在这里显示，可以全部列出
				for(var index=0;index<rs.length;index++){
					if(rs[index]==null){
						continue;
					}
					let tmpInfo=JSON.parse(rs[index]);
					tmpInfo.salt="0x"+tmpInfo.salt;
					win=(tmpInfo.gameResult===1?true:false);//通过计算
					close=(tmpInfo.gameStatus==ORDER_STATUS_CLOSE?true:false);
					tmpInfo.mineSteps=Object.values(tmpInfo.mineSteps);
					//用户挖的地方
					let userSteps=[];
					//已经显示的地雷
					let mines=[];
					for( var i=31;i>0;i--){
						if(tmpInfo.mineSteps[i]==0){
							break;
						}
						userSteps.push(tmpInfo.mineSteps[i]);
						mines.push(tmpInfo.mines[i]);
					}
					//如果游戏已经结束了，那么可以显示所有的地雷给用户看
					allMines=[]
					if(tmpInfo.gameStatus===ORDER_STATUS_CLOSE){
						for(var i=31;i>0;i--){
							if(tmpInfo.mines[i]!=0){
								allMines.push(tmpInfo.mines[i]);
							}
						}
					}
					userLogList.push({
						"id":tmpInfo.order.orderNo,
						"bet":tmpInfo.order.orderAmount,
						"prefix":MINE_REDIS_PREFIX,
						"order":tmpInfo.order,
						"orderTokenId":tmpInfo.order.orderTokenId,
						"blockNo":tmpInfo.order.orderBlockH,
						"now":tmpInfo.mineHash,
						"payout":tmpInfo.order.winAmount,//需要计算出来 win 计算出来 lose 0
						"now":tmpInfo.mineHash,//当前mineHash
						"result":close?allMines:mines,//已关闭显示所有的地雷，未关闭显示用户挖的地雷
						"userSteps":userSteps,
						"mines":mines,
						"allMines":close?allMines:[],
						"salt":tmpInfo.salt,
						"gameResult":tmpInfo.gameResult
					});
				}
				console.log(JSON.stringify(userLogList));
				result.errorCode=SUCCESS;
				result.data=userLogList;
				socket.emit(QUERY_USER_LOGS_RESULT,result);
				return;
			});
		}

	});
	
	
	
}

/*
 * 判断是否超时
 * 现在没有使用到
 */
function isTimeOut(data){
	let tw=getTronWeb();	
	let socket=this;
	let result={};
	let addr=data.addr;
	if(!tw.isAddress(addr)){
		console.log("用户使用不正确的地址[%s]进行[isTimeOut]",addr);
		return;	
	}
	//多币种增加
	redis.get(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,function(err,info){
		if(err){
			console.log("获取Redis失败[%s][isTimeOut]",addr);
			result.errorCode=SERVER_BUSY;
			socket.emit(IS_TIME_OUT_RESULT,result);	
			return;
		}
		let userLatestRedisInfo;						
		if(!info){//用户没有玩过游戏，自然也不存在什么超时了
			result.errorCode=USER_GAME_DATA_NOT_FOUND;	
			socket.emit(IS_TIME_OUT_RESULT,result);	
			return;
		}
		userLatestRedisInfo=JSON.parse(info);
		let _now=new Date().getTime();
		let lastTs=userLatestRedisInfo.lastTs;
		let startTime=userLatestRedisInfo.order.orderBlockT.toNumber()*1000;//有可能异常

		result.data={};
		result.data.order=info.order;
		result.data.userSteps=[];
		result.data.mines=[];
		result.data.mineHash=userLatestRedisInfo.mineHash;
		result.data.gameStatus=userLatestRedisInfo.gameStatus;
		result.data.gameResult=userLatestRedisInfo.gameResult;
		result.data.addr=addr;
		result.data.errorCode=SUCCESS;
		result.lastTs=userLatestRedisInfo.lastTs;//提交时间
		for(var i=31;i>0;i--){
			if(userLatestRedisInfo.mineSteps[i]==0){
				break;
			}
			result.data.userSteps.push(userLatestRedisInfo.mineSteps[i]);
			result.data.mines.push(userLatestRedisInfo.mines[i]);
		}
		result.data.allMines=[]
		if(userLatestRedisInfo.gameStatus===ORDER_STATUS_CLOSE){//
			for(var i=31;i>0;i--){
				if(userLatestRedisInfo.mines[i]!=0){
					result.data.allMines.push(userLatestRedisInfo.mines[i]);
				}
			}
		}
		if(_now>lastTs+GAME_STEP_TIME){//步时超时
			result.errorCode=USER_MINE_STEP_TIME_IS_OUT;
			socket.emit(IS_TIME_OUT_RESULT,result);	
			return;
		}else if(_now>startTime+GAME_LIFE_TIME){//局时超时
			result.errorCode=USER_TIME_LIFE_TIME_IS_OUT;
			socket.emit(IS_TIME_OUT_RESULT,result);	
			return;
		}
		socket.emit(IS_TIME_OUT_RESULT,result);	
		return;
	});


}

/*
 * 查询用户信息
 * 无需登陆，查询当前用户的游戏信息
 */
function queryGameData(data){
	let tw=getTronWeb();	
	let socket=this;
	let result={};
	let addr=data.addr;
	if(!tw.isAddress(addr)){
		console.log("用户使用不正确的地址[%s]进行查询游戏信息",addr);
		return;	
	}
	redis.get(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,function(err,info){
		if(err){
			console.log("获取Redis失败[%s][queryGameData]",addr);
			result.errorCode=SERVER_BUSY;
			socket.emit(QUERY_GAME_DATA_RESULT,result);	
			return;
		}
		let userLatestRedisInfo;						
		if(!info){
			result.errorCode=SUCCESS;//如果为空代表没有玩过游戏，内存中没有用户信息
			socket.emit(QUERY_GAME_DATA_RESULT,result);	
			return;
		}
		userLatestRedisInfo=JSON.parse(info);
		tronSerivce.query(
		tronNodePool,config.contract[MAIN_MINE_GAME],
		MAIN_MINE_GAME_GET_ORDER,[data.addr],RETRY_TIME,function(err,rs){
			if(err){
				result.errorCode=NET_BUSY;
				socket.emit(QUERY_GAME_DATA_RESULT,result);	
				return;
			}
			//需要更新订单的状态
			//触发的情况可能是因为服务器启动了游戏，发送了交易
			if(rs.orderStatus==ORDER_STATUS_SERVER_READY && userLatestRedisInfo.gameStatus==ORDER_STATUS_USER_READY){
				userLatestRedisInfo.gameStatus=ORDER_STATUS_SERVER_READY;
				redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,JSON.stringify(userLatestRedisInfo));//不管成不成功
			}else if(rs.orderStatus==ORDER_STATUS_CLOSE && userLatestRedisInfo.gameStatus!=ORDER_STATUS_CLOSE){
				userLatestRedisInfo.gameStatus=ORDER_STATUS_CLOSE;
				redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,JSON.stringify(userLatestRedisInfo));//不管成不成功
			}
			result.data={};
			result.data.order=rs;
			result.data.userSteps=[];
			result.data.mines=[];
			result.data.mineHash=userLatestRedisInfo.mineHash;
			result.data.gameStatus=userLatestRedisInfo.gameStatus;
			result.data.gameResult=userLatestRedisInfo.gameResult;
			result.data.addr=addr;
			result.lastTs=userLatestRedisInfo.lastTs;//提交时间
			for(var i=31;i>0;i--){
				if(userLatestRedisInfo.mineSteps[i]==0){
					break;
				}
				result.data.userSteps.push(userLatestRedisInfo.mineSteps[i]);
				result.data.mines.push(userLatestRedisInfo.mines[i]);
			}
			result.data.allMines=[]
			if(userLatestRedisInfo.gameStatus===ORDER_STATUS_CLOSE){//
				for(var i=31;i>0;i--){
					if(userLatestRedisInfo.mines[i]!=0){
						result.data.allMines.push(userLatestRedisInfo.mines[i]);
					}
				}
			}
			result.errorCode=SUCCESS;
			socket.emit(QUERY_GAME_DATA_RESULT,result);
		});

	});
	
}

/*
 * 退出游戏 READY 状态都可以
 */
function quitMine(data){
	let tw=getTronWeb();
	if(!tw.isAddress(data.addr)){
		console.log("用户使用不正确的地址[%s]quitMine",data.addr);
		return;
	}
	
	let token=data.token;
	let addr=data.addr;
	let socket=this;
	let orderNo=data.orderNo;
	if(!processUserToken(socket,addr,token,QUIT_MINE_RESULT)){
		return;
	}
	let result={};
	tronSerivce.query(
		tronNodePool,config.contract[MAIN_MINE_GAME],
		MAIN_MINE_GAME_GET_ORDER,[data.addr],RETRY_TIME,function(err,rs){
		if(err){
			result.errorCode=NET_BUSY;
			socket.emit(QUIT_MINE_RESULT,result);	
			console.log("服务器异常，查询用户订单出错:%s",data.addr);
			return;
		}
		if(rs.orderStatus!=ORDER_STATUS_SERVER_READY){//如果失败了重新来，这里应该也是ORDER_STATUS_SERVER_READY
			result.errorCode=NOT_PASS;
			socket.emit(QUIT_MINE_RESULT,result);	
			console.log("订单状态异常，必须订单处于:%s 才可以退出扫雷:%s",ORDER_STATUS_SERVER_READY,data.addr);
			return;
		}
		processQuit(socket,data,rs);
	});
	
}

/*
 * 1.从redis中获取玩家的游戏数据，然后根据玩家的游戏数据
 * 退出游戏，玩家已经在内存是退出了，当然有可能因为上链的原因导致，还是ORDER_STATUS_SERVER_READY状态，从而无法玩新的游戏
 * 这个时候也需要退出
 */
function processQuit(socket,data,order){
	let result={};
	redis.get(MINE_REDIS_PREFIX+LATEST_GAME_INFO+data.addr,function(err,info){
		if(err){
			console.log("无法退出扫雷[processQuit]，因为redis无法获取数据");
			result.errorCode=STORE_BUSY;
			socket.emit(QUIT_MINE_RESULT,result);	
			return;
		}
		let userLatestRedisInfo;						
		if(!info){
			result.errorCode=REDIS_GAME_DATA_NOT_EXIST;
			socket.emit(QUIT_MINE_RESULT,result);	
			console.log("服务器异常[processQuit],Redis 中没有用户的游戏信息:%s",data.addr);
			return;
		}
		userLatestRedisInfo=JSON.parse(info);
		//开始进来的时候，重新登陆的时候，游戏会有一个定性，直接存储失败或者其他的
		if(userLatestRedisInfo.gameStatus!==ORDER_STATUS_SERVER_READY &&
			userLatestRedisInfo.gameStatus!==ORDER_STATUS_CLOSE){//有可能游戏只是内存结束了，然而实际上链上并没有结束到，需要继续结束
			console.log(userLatestRedisInfo.gameStatus);
			console.log(userLatestRedisInfo.gameStatus===ORDER_STATUS_SERVER_READY);
			result.errorCode=REDIS_GAME_DATA_NOT_EXIST;
			socket.emit(QUIT_MINE_RESULT,result);	
			console.log("服务器异常[processQuit],Redis存储的[%s]游戏数据显示用户游戏状态不是:%s",data.addr,ORDER_STATUS_SERVER_READY);
			return;
		}
		//游戏状态是正在运行中的，没有输掉，或者其他的才可以
		endGame(socket,data.addr,userLatestRedisInfo,QUIT_MINE_RESULT);
	});
}

/*
 * 
 */

/*
 * 用户挖雷
 * 确定订单状态是否正确
 */
function userMine(data){

	let tw=getTronWeb();
	if(!tw.isAddress(data.addr)){
		console.log("用户使用不正确的地址[%s]进行登陆",data.addr);
		return;
	}

	let token=data.token;
	let addr=data.addr;
	let socket=this;
	let orderNo=data.orderNo;
	if(!processUserToken(socket,addr,token,MINE_RESULT)){
		return;
	}
	let result={};
	tronSerivce.query(
	tronNodePool,config.contract[MAIN_MINE_GAME],
		MAIN_MINE_GAME_GET_ORDER,[data.addr],RETRY_TIME,function(err,rs){
		if(err){
			result.errorCode=NET_BUSY;
			socket.emit(MINE_RESULT,result);	
			console.log("服务器异常，查询用户订单出错:%s",data.addr);
			return;
		}
		/*
		 * 即使在挖雷的过程，比如已经挖了一个了，但是交易依然有可能回滚，即用户的订单状态又变成了0x01
		 * 这种情况可能是因为交易在区块里面的顺序是 0x01状态的改变在0x02 之后，因为先更新为0x02是无法成功的
		 * 只有在0x01执行之后才能成功，所以交易被回滚了
		 * 需要告知客户端已经被revet掉的交易么？
		 */
		if(rs.orderStatus!=ORDER_STATUS_SERVER_READY){
			result.errorCode=ORDER_STATUS_IS_NOT_ALLOW_TO_MIND;
			socket.emit(MINE_RESULT,result);	
			console.log("订单状态异常，服务器没有成功开始游戏[交易失败]:%s",data.addr);
			return;

		}
		processMine(socket,data,rs);
	});

}

/*
 * 获取用户正在游戏的数据
 */
function processMine(socket,data,order){
	let result={};
	redis.get(MINE_REDIS_PREFIX+LATEST_GAME_INFO+data.addr,function(err,info){
		if(err){
			console.log("无法挖雷，因为redis无法获取数据");
			result.errorCode=STORE_BUSY;
			socket.emit(MINE_RESULT,result);	
			return;
		}
		let userLatestRedisInfo;						
		if(!info){
			result.errorCode=REDIS_GAME_DATA_NOT_EXIST;
			socket.emit(MINE_RESULT,result);	
			console.log("服务器异常，Redis 中没有用户的游戏信息:%s",data.addr);
			return;
		}
		userLatestRedisInfo=JSON.parse(info);
		if(userLatestRedisInfo.gameStatus!=ORDER_STATUS_SERVER_READY){
			result.errorCode=ORDER_STATUS_IS_NOT_ALLOW_TO_MIND;
			result.data={};
			result.data.gameStauts=userLatestRedisInfo.gameStatus;
			socket.emit(MINE_RESULT,result);	
			console.log("redis中用户的游戏数据显示，游戏还没有开始[%s]或者已经结束:%s",userLatestRedisInfo.gameStatus,data.addr);
			return;
		}
		if(userLatestRedisInfo.order.orderNo!=order.orderNo){
			console.log("服务器异常，redis中存储的游戏数据，不是最新数据[%s]",data.addr)
			console.log(JSON.stringify(userLatestRedisInfo));
			console.log(JSON.stringify(order));
			result.errorCode=REDIS_GAME_DATA_NOT_RIGHT;
			socket.emit(MINE_RESULT,result);	
			console.log("redis中用户的游戏数据显示，游戏还没有开始[%s]或者已经结束:%s",userLatestRedisInfo.gameStatus,data.addr);
			return;
		}
		if(new Date().getTime()>userLatestRedisInfo.lastTs+GAME_STEP_TIME){
			//result.errorCode=USER_MINE_TIME_IS_USED_OUT;
			//socket.emit(MINE_RESULT,result);//会发出一个交易，但是不确保成功
			console.log("用户步时已经用完，超时了:%s",userLatestRedisInfo.gameStatus,data.addr);
			processUserLose(socket,data.addr,MINE_RESULT);
			return;
		}
		USER_GAMING[data.addr]=true;
		//用户提交的数据 第几列 挖的行数
		let col=data.col;//col 从1 开始.....
		let row=data.row;//row 从1 开始.....
		if( !(col>=1&&col<=order.mineFieldW) ){
			result.errorCode=USER_MINE_COL_NOT_RIGHT_OVER_LIMIT;//超出了范围
			socket.emit(MINE_RESULT,result);	
			return;
		}
		if( !(row>=1 && row<=order.mineFieldH) ){
			result.errorCode=USER_MINE_ROW_NOT_RIGHT_OVER_LIMIT;//超出了范围
			socket.emit(MINE_RESULT,result);	
			return;
		}
		if (!(col==userLatestRedisInfo.currStep+2)){//应该是相等
			result.errorCode=USER_MINE_COL_IS_NOT_EQUAL_TO_REDIS;//超出了范围
			socket.emit(MINE_RESULT,result);	
			return;
		}
		userLatestRedisInfo.currStep=userLatestRedisInfo.currStep+1;
		userLatestRedisInfo.mineSteps[31-userLatestRedisInfo.currStep]=row;
		userLatestRedisInfo.lastTs=new Date().getTime();
		userLatestRedisInfo.order=order;
		console.log("gameModel:%s",order.gameModel);
		console.log("用户提交的row:%s",row);
		console.log("雷的数组index:%s",31-userLatestRedisInfo.currStep);
		console.log("雷的位置:%s",userLatestRedisInfo.mines[31-userLatestRedisInfo.currStep]);
		//根据是否是英雄模式来判断
		if(order.gameModel==GAME_MODEL_HERO){
			if(row!==userLatestRedisInfo.mines[31-userLatestRedisInfo.currStep]){
				//失败
				redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+data.addr,JSON.stringify(userLatestRedisInfo),
				function(err,rs){
					if(err){
						console.log("用户扫雷失败，将用户数据存储到redis失败");
						console.log(JSON.stringify(userLatestRedisInfo));//在里面寻找
					}
					processUserLose(socket,data.addr,MINE_RESULT);
				});
				return;
			}
		}else{//普通模式
			console.log("普通模式地雷游戏");
			let userMineAt=parseInt(row);
			let existMines=parseInt(userLatestRedisInfo.mines[31-userLatestRedisInfo.currStep]);
			if(userMineAt==existMines){
				console.log("地雷在%s 用户踩在%s",existMines,userMineAt);
				//失败
				redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+data.addr,JSON.stringify(userLatestRedisInfo),
				function(err,rs){
					if(err){
						console.log("用户扫雷失败，将用户数据存储到redis失败");
						console.log(JSON.stringify(userLatestRedisInfo));
					}
					processUserLose(socket,data.addr,MINE_RESULT);//
				});
				return;
			}
		}
		//如果用户赢了
		//通关了这个地雷
		//判断是否到了终点
		let mineFieldW=order.mineFieldW;
		if(data.col==order.mineFieldW){

			//结束游戏，用户通关游戏
			let boxs=sendGameMsg(data.addr,'trx',order.orderAmount,getHeroDropRate(order.mineFieldH,order.mineFieldW,order.gameModel==GAME_MODEL_HERO));//有一定概率获取到宝箱
			if(boxs && boxs.boxCount>0){
				userLatestRedisInfo.boxs=boxs;
			}
			userLatestRedisInfo.mineSteps[0]=mineFieldW;
			userLatestRedisInfo.gameResult=GAME_RESULT_WIN;//可以增加赢的金额
			endGame(socket,data.addr,userLatestRedisInfo,MINE_RESULT);
			

		}else{
			//存储到redis里面去，然后返回结果
			//通关这列雷 通关进度通关进度增加

			let boxs=sendGameMsg(data.addr,'trx',order.orderAmount,0);//有一定概率获取到宝箱
			if(boxs && boxs.boxCount>0){
				userLatestRedisInfo.boxs=boxs;
			}

			userLatestRedisInfo.mineSteps[0]=userLatestRedisInfo.currStep+1;
			redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+data.addr,JSON.stringify(userLatestRedisInfo),//存储到redis中去
				function(err,rs){
				if(err){
					console.log("[1]将生成好的数据雷数据，存储到redis失败....");
					console.log(JSON.stringify(userLatestRedisInfo));
					return;
				}

				result.data={};
				result.errorCode=SUCCESS;
				result.data.order=order;
				result.data.userSteps=[];
				result.data.mines=[];
				result.data.mineHash=userLatestRedisInfo.mineHash;
				result.data.gameStatus=userLatestRedisInfo.gameStatus;
				result.data.gameResult=userLatestRedisInfo.gameResult;
				result.data.addr=data.addr;
				result.boxs=userLatestRedisInfo.boxs;
				result.lastTs=userLatestRedisInfo.lastTs;//提交时间
				for(var i=31;i>0;i--){
					if(userLatestRedisInfo.mineSteps[i]==0){
						break;
					}
					result.data.userSteps.push(userLatestRedisInfo.mineSteps[i]);
					result.data.mines.push(userLatestRedisInfo.mines[i]);
				}
				console.log(result);
				//提交用户step 给它
				socket.emit(MINE_RESULT,result);	
				return;
			});
		}
	});
}


/*
 * 首先需要必须登陆之后才能开启新的游戏
 * 校验token
 */
function startNewGame(data){
	console.log("startNewGame:%s",JSON.stringify(data));
	let tw=getTronWeb();
	if(!tw.isAddress(data.addr)){
		console.log("用户使用不正确的地址[%s]startNewGame",data.addr);
		return;
	}

	let token=data.token;
	let addr=data.addr;
	let socket=this;
	if(!processUserToken(socket,addr,token,START_NEW_GAME_RESULT)){
		return;
	}
	let result={};
	//确认用户的订单状态
	tronSerivce.query(
		tronNodePool,config.contract[MAIN_MINE_GAME],
		MAIN_MINE_GAME_GET_ORDER,[data.addr],RETRY_TIME,function(err,rs){
		if(err){
			result.errorCode=NET_BUSY;
			socket.emit(START_NEW_GAME_RESULT,result);	
			console.log("服务器异常，查询用户订单状态出错地址:%s",data.addr);
			return;
		}
		if(rs.orderStatus==ORDER_STATUS_USER_READY){//USER_READY
			startGame(socket,addr,rs,START_NEW_GAME_RESULT);//开始游戏
		}else if(rs.orderStatus==ORDER_STATUS_SERVER_READY){
			result.errorCode=SUCCESS;
			result.order=rs;
			socket.emit(START_NEW_GAME_RESULT,result);	
			return;
		}else{
			let result={};
			result.order=rs;
			result.errorCode=USER_ORDER_STATUS_IS_NOT_USER_READY;
			socket.emit(START_NEW_GAME_RESULT,result);	
			console.log(JSON.stringify(rs));
			console.log("服务器异常，查询用户订单状态不正常:%s",data.addr);
			return;
		}
	});

}

/*
 * 用户登入
 * 1.玩家正常登陆(没有正在运行的游戏)
 * 2.玩家在游戏中掉线后重新登陆(有正在运行的游戏，可能结束，也可能继续游戏)
 * 3.玩家在服务器掉线后重新登陆(有正在运行的游戏，可能结束，也可能继续游戏)
 * 4.玩家登陆，有游戏订单，但从来没有进入过游戏...
 * 服务器如何知道自己是在玩家游戏过程中掉线？
 * 在redis中存储正在运行的游戏..... 在内存中也存储正在运行的游戏....当游戏结束，删除redis中用户的数据 删除内存中的用户的数据
 * 当服务器重新启动游戏....redis中存在用户的游戏数据，但是内存因为重启导致用户的数据丢失了，所以用户重新登陆后，服务器知道自己掉线了
 * 如果服务器没有重启，假设一直在运行，客户端没有关闭 那么游戏必然正常的结束(客户端会发送消息，服务器会判断用户是否超时了)
 * 客户端关闭了.......我们认为客户端掉线了...... 在redis中以及内存中标记用户已经掉线了
 * 假如用户重新登陆了
 * 	redis中有，内存中也有用户的数据，那么按照最小超时时间判断用户有没有超时，超时判定为用户输了(每一步运行的超时时间)
 *	redis中有，内存中没有用户的数据，那么我们知道，服务器应该是重启过了，根据游戏存在生命周期判定用户游戏是否超时
 *	redis中没有用户的游戏，用户可能只是发出了扫雷游戏的交易，但是从来没有进行过游戏，游戏现在开始,也可以根据order中的时间，判定用户是否超时了...
 * 登陆成功之后返回token 给对方，需要校验用户的签名是否正确
 * data
 * {
 * 	time:xxxx,	
 * 	addr:xxxx,
 * 	sign:xxxx
 * }
 * 1.校验签名是否正确
 * 2.成功之后返回一个token给对方
 * 3.查找用
 * 	1）存在未结束的订单
 * 		1).在redis中获取订单情况
 * 			1）不存在，根据订单情况判断，订单每局存在的最大时间，如果超过，结束游戏，用户失败[24h],如果没有超过，用户可以继续游戏。
 * 			2）存在
 * 				1）判断内存中是否有订单数据
 * 					1）存在 判断用户是否超时了，每一步的超时时间[3分钟】
 * 					2）不存在 服务器重启了，那么判断是否超过了没局最大的持续时间[24h],如果超过了，用户扫雷失败.
 * 	2）不存在未结束的订单
 */
async function userLogin(data){
	console.log(JSON.stringify(data));
	let tw=getTronWeb();	
	let socket=this;
	let result={};

	if(!tw.isAddress(data.addr)){
		console.log("用户使用不正确的地址[%s]进行登陆",data.addr);
		return;	
	}
	//这里需要存储一下socket的信息
	Map_addr_socket[data.addr] = socket.id;
	Map_socket_addr[socket.id] = data.addr;

	let _now=new Date().getTime();
	if((_now<data.time && _now <data.time-USER_LOGIN_TIME_DEVIATION)||_now>data.time+USER_LOGIN_TIME_DEVIATION){
		result.errorCode=USER_LOGIN_TIME_INVALID;
		socket.emit(USER_LOGIN_RESULT,result);	
		return;
	}
	let message=(data.addr+data.time);
	message= Buffer.from(message, 'utf8').toString('hex');//转化成为hex string
	tronWeb.trx.verifyMessage(message, data.sign, data.addr, (err, res)=>{
		if(res!=true){
			result.errorCode=USER_LOGIN_SIGN_INVALID;
			socket.emit(USER_LOGIN_RESULT,result);	
			return;
		}else{//如果校验成功，说明用户是登陆成功的
			doLoginInSucesss(socket,data);
		}
	});
	
}


/*
 * 用户登陆成功 拆分userLogin中的逻辑
 * 登陆成功，因为有可能要恢复先前的游戏逻辑，所以还是需要将以前的游戏加载起来，无论
 * 它将是一个什么样的结局
 * 前端获取到订单，可以先提示用户，然后加载雷区信息等，然后后端将以前的游戏恢复,然后前端等待后端的lastGameResult
 * lastGameResult 有可能会继续，也有可能会爆掉....
 */
function doLoginInSucesss(socket,data){
	let result={};
	//登陆成功先查询用户的订单,万一用户有正在有正在进行的扫雷游戏，需要马上恢复
	tronSerivce.query(
		tronNodePool,config.contract[MAIN_MINE_GAME],
		MAIN_MINE_GAME_GET_ORDER,[data.addr],RETRY_TIME,function(err,rs){
		let existNoClose=true;
		if(err){
			result.errorCode=SERVER_BUSY;//这个其实对用户不公平的，因为用户的时间在被，是否可以增加玩家的步时
			socketEmit(socket,data.addr,LAST_GAME_RESULT,result);
			console.log("服务器异常，查询用户订单状态出错地址:%s",data.addr);
			return;
		}
		if(rs.orderStatus==0){
			console.log("新用户[%s] 登陆系统",data.addr);
			result.lastOrderNo=0;//0 表示是新用户
			result.orderStatus=0xff;//0xff 表示已经关闭
			socketEmit(socket,data.addr,LAST_GAME_RESULT,result);
			existNoClose=false;
		}else if(rs.orderStatus==ORDER_STATUS_CLOSE){
			console.log("老用户[%s] 登陆系统",data.addr);
			result.lastOrderNo=rs.orderNo;// 最后订单
			result.orderStatus=0xff;//0xff 表示已经关闭
			socketEmit(socket,data.addr,LAST_GAME_RESULT,result);
			existNoClose=false;
		}
		//用户有正在进行中的游戏，让客户端恢复游戏，然后等待服务器返回游戏结果.

		
		result.token=registerToken(data.addr);//登陆成功统一返回token
		//UserLastOpTimeMap[data.addr];
		result.data={};
		result.data.order=rs;
		result.errorCode=SUCCESS;
		socket.emit(USER_LOGIN_RESULT,result);//告知用户已经登陆成功
		if(!existNoClose){
			return;
		}
		/*
		前端检查到有正在进行的游戏
		检查到了
		重新加载游戏,向服务器获取上次游戏的游戏进度
		加载游戏之后可能继续完，也有可能会马上爆掉,具体取决于当前游戏是否超时了
		*/
		/*
		* 登陆成功之后，需要向客户端推送LastGameResult，上次游戏的游戏情况
		*/
		processLastGameResult(socket,data,rs);
	});
}

/*
 * 处理上次的游戏结果
 * 向客户端推送上次的游戏结果
 */
function processLastGameResult(socket,data,order){
	console.log("====process last game result=====");
	let result={};
	let userLatestRedisInfo;
	let userOpTime=UserLastOpTimeMap[data.addr];
	let beforeGaming=USER_GAMING[data.addr];
	let _now=new Date().getTime();
	//以下都是处理尚未完结的订单，订单要么是ORDER_STATUS_USER_READY，要么是ORDER_STATUS_SERVER_READY
	if(_now-order.orderBlockT.toNumber()*1000>GAME_LIFE_TIME){//生命周期之外，游戏应该要结束掉
		console.log("_now=%s,orderTime=%s,GAME_LIFE_TIME=%s",_now,order.orderBlockT.toNumber()*1000,GAME_LIFE_TIME);
		if(order.orderStatus==ORDER_STATUS_USER_READY){//退款,这个应该是很少会触发的
			processCancelMine(socket,data.addr,LAST_GAME_RESULT);//取消游戏，成功之后需要返回时间，可以监听事件
			return;//游戏结果告诉玩家,告诉玩家游戏结果
		}else if(order.orderStatus==ORDER_STATUS_SERVER_READY){//用户扫雷失败
			processUserLose(socket,data.addr,LAST_GAME_RESULT);//用户扫雷失败
			return;
		}
	}
	//生命周期之内,且订单情况是ORDER_STATUS_USER_READY
	if(order.orderStatus==ORDER_STATUS_USER_READY){//不需要判读redis状态直接开
		startGame(socket,data.addr,order,LAST_GAME_RESULT);//根据订单启动游戏
		return;
	}
	//以下是处理订单ORDER_STATUS_SERVER_READY的情况,就是游戏已经开始了的情况
	//游戏已经开始了，那么理论上redis中应该会存储了用户的一些信息比较雷，盐值，用户的扫雷等重要的信息
	redis.get(MINE_REDIS_PREFIX+LATEST_GAME_INFO+data.addr,function(err,info){
			if(err){
				result.errorCode=SERVER_BUSY;
				socketEmit(socket,data.addr,LAST_GAME_RESULT,result);//[mark]
				console.log("从Redis中获取用户[%s]正在游戏的数据发生异常....",data.addr);
				return;					
			}
			userLatestRedisInfo=JSON.parse(info);//正在进行中的游戏数据
			if(info){
				//如果订单已经被关闭了，不能判定用户输了，只能endGame
				if(order.orderStatus==ORDER_STATUS_SERVER_READY && userLatestRedisInfo.gameStatus==ORDER_STATUS_CLOSE){
					endGame(socket,data.addr,userLatestRedisInfo,LAST_GAME_RESULT);	
				}else if(beforeGaming){//服务器没有掉线,lastTs是游戏开始时间或者用户最新提交的扫雷时间
					if(_now>userLatestRedisInfo.lastTs+GAME_STEP_TIME){//游戏结束，玩家扫雷失败
						console.log("玩家[%s]扫雷超时:%s",data.addr,userLatestRedisInfo.lastTs);
						processUserLose(socket,data.addr,LAST_GAME_RESULT);
					}else{//玩家可以继续游戏,通知前端重新恢复游戏
						reloadUserGame(socket,data.addr,userLatestRedisInfo);
					}
				}else{//服务器掉线了
					userLatestRedisInfo.lastTs=new Date().getTime();//玩家步时清零,并存储到redis中去
					redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+data.addr,JSON.stringify(userLatestRedisInfo),
						function(err,sr){
						if(err){
							console.log("重置玩家步时，存储到redis失败....");
							console.log(JSON.stringify(userLatestRedisInfo));
							result.errorCode=SERVER_BUSY;[mark]
							socketEmit(socket,data.addr,LAST_GAME_RESULT,result);//[mark]
							return;
						}else{
							//成功自后需要将用户加载到内存
							reloadUserGame(socket,data.addr,userLatestRedisInfo);//重新加载游戏
						}
					});
				}
			}else{  //redis中没有用户的数据，但玩家已在扫雷游戏中,这种诡异的用户不需要解锁它，当然也不需要返回信息给他 
				console.log("异常情况,Redis中没有用户的信息，但是玩家已经正在游戏过程中，redis异常或者其他异常");
			}
	});
}

/*
 * 重新加载游戏
 * 告诉客户端,需要重新加载游戏
 * 订单信心，雷区信息，用户扫雷的信息
 */
function reloadUserGame(socket,addr,userLatestRedisInfo){
	let result={};
	result.errorCode=SUCCESS;
	result.data={};
	result.data.mineHash=userLatestRedisInfo.mineHash;//前端展现的
	result.data.order=userLatestRedisInfo.order;//如果redis中存储的信息不对，那么这里将会有异常...
	result.data.userSteps=[];
	result.addr=addr;
	result.lastTs=userLatestRedisInfo.lastTs;//上一步提交的时间
	for(var i=31;i>0;i--){
		if(userLatestRedisInfo.mineSteps[i]==0){
			break;
		}
		result.data.userSteps.push(userLatestRedisInfo.mineSteps[i]);//访问是没有问题的
	}
	socketEmit(socket,addr,LAST_GAME_RESULT,result);//[mark]

}

/*
 * 开启新的游戏
 * 生成地雷，生成盐值，得到地雷hash
 * 调用oracle 开启游戏
 * 更新redis
 * 更新内存数据
 * 通知客户端
 */
async function startGame(socket,addr,gameOrder,eventName){
	let mines=generateMines(gameOrder.mineFieldH,gameOrder.mineFieldW);	
	let salt = sha3.keccak256(PRE_SALT+new Date().getTime()+crypto.randomBytes(32).toString('hex'));//生成随机的盐值

	let bufMines=Buffer.from(mines);
	let fullString=bufMines.toString('hex')+salt;//只是单纯的字节数组相加在一起
	let byteCom=Uint8Array.from(Buffer.from(fullString,'hex'));

	let mineHash="0x"+sha3.keccak256(byteCom);

	let userLatestRedisInfo={};
	userLatestRedisInfo.order=gameOrder;//游戏的订单
	userLatestRedisInfo.mineHash=mineHash;//有0x开头
	userLatestRedisInfo.mines=mines;//无0x
	userLatestRedisInfo.salt=salt;//无0x
	userLatestRedisInfo.addr=addr;
	userLatestRedisInfo.lastTs=0;//不能马上进行计时,必须等待服务器成功之后才能计算时间
	userLatestRedisInfo.gameStatus=ORDER_STATUS_USER_READY;//用户已确认
	userLatestRedisInfo.gameResult=GAME_RESULT_WIN;
	userLatestRedisInfo.leaveAt=0;//用户需要在1以上逃离，其实就是在第二列以后才能逃离,没有爆掉的情况下
	userLatestRedisInfo.mineSteps=new Uint8Array(32);
	userLatestRedisInfo.currStep=-1;//当前位置，还没有开始
	userLatestRedisInfo.winAmount=0;

	//如果这里失败，游戏无法启动，用户的游戏处于pending...状态
	//此时用户有可能刷新页面，那么用户就会重新登陆，从新登陆之后如果正常也会从新加载游戏.
	//如果异常，客户端也会尝试告诉服务端，应该上传hash值，好让游戏正常的开启...
	let result={};
	redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,JSON.stringify(userLatestRedisInfo),//存储到redis中去
		function(err,rs){
		if(err){
			//不存储到redis是危险的，因为给用户生了的数据，无法存储，所以不能继续游戏
			console.log("将生成好的数据雷数据，存储到redis失败....");//不应该继续执行,因为如果服务器一旦断线
			console.log(JSON.stringify(userLatestRedisInfo));//用户也不可能开始游戏，游戏状态是ready状态
			return;
		}
		tronSerivce.execute(
			tronNodePool,
			config.contract[MINE_GAME_ORACLE],
			MINE_GAME_ORACLE_BEGIN_GAME,[addr,mineHash],RETRY_TIME,function(err,rs){
			//发送交易完毕之后即使出现error，那么也有可能其实交易成功了，因为网络原因等等
			//这里需要一个轮训的机器人，不断的去获取订单的情况，然后机器人会判断交易成功了，然后告诉用户启动游戏
			PENDING_ORDERS[addr]=ORDER_STATUS_SERVER_READY;//监听这个地址的订单情况变成ORDER_STATUS_SERVER_READY
			if(err){
				console.log("服务端发起[%s]开始游戏异常，客户端需要自己确定游戏是否已经启动，或者等待服务器通知 :%s",addr,err);
				result.errorCode=SERVER_SEND_START_GAME_TX_FAILURE;
				//此时客户端应该要检查一下订单情况，有可能因为网络原因其实链上已经确认了交易
				//如果交易成功了，过了一段时间，服务器也会告诉客户端，游戏已经开始了
				//但是如果交易失败了，客户端其实应该要告诉服务器重新startGame...
				socketEmit(socket,addr,eventName,result);//[mark]
				return;
			}
			//通知用户已经交易已经发送成功了
			//这里游戏启动交易有可能也会失败的,前端一样要进行处理
			result.errorCode=SUCCESS;// 不能提供hash是因为这个hash并不一定准确，如果成功了,GAME_START 开始
			result.order=gameOrder;
			socketEmit(socket,addr,eventName,result);//[mark]
			return;
		});
	});
}

/*
 * 根据雷区宽度和高度生成地雷
 * 返回一个
 */
function generateMines(height,width){
	let mines=new Uint8Array(32);
	let index=31;//最右边是第一个雷
	for(var i=0;i<width;i++){
		let mi=Math.floor(Math.random()*height)+1;//地雷的位置
		mines[index]=mi;
		index--;
	}
	return mines;
}

/*
 *
 * 1.将用户扫雷步骤，盐值，雷的信息等等调用oracle 
 */
async function endGame(socket,addr,userLatestRedisInfo,eventName,errorCode){
	userLatestRedisInfo.gameStatus=ORDER_STATUS_CLOSE;//
	let result={};
	//没有成功不需要修改数据
	console.log("====end game====");
	console.log(JSON.stringify(userLatestRedisInfo));
	console.log("====end game====");
	let mines=userLatestRedisInfo.mines;
	let bufMines=Buffer.from(Object.values(mines));
	let mineOrig="0x"+bufMines.toString('hex');
	let mineSteps=userLatestRedisInfo.mineSteps;
	let verifySalt="0x"+userLatestRedisInfo.salt;
	let bufUserStep=Buffer.from(Object.values(mineSteps));
	let userStep="0x"+bufUserStep.toString('hex');
	redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,JSON.stringify(userLatestRedisInfo),function(err,rs){
		if(err){
			//这里感觉将用户的信息存储也存储一份到内存中会好一些，这样即使redis失败，用户也无法通过其他方式来继续扫雷
			console.log("用户[%s]游戏结束，存储用户的信息到redis失败.[%s]",addr,err);
			result.errorCode=STORE_BUSY;//我们的错，我们的服务器出现异常，这种用户是幸运的，可能没有及时把它处理
			socketEmit(socket,addr,eventName,result);//Redis错误的内存处理方法始终没有好的解决方案，完全依赖redis
			return;//不需要告诉前端
		}
		delete USER_GAMING[addr];//已经不在游戏过程中了
		//存储成功，调用合约结束游戏
		tronSerivce.execute(
			tronNodePool,
			config.contract[MINE_GAME_ORACLE],
			MINE_GAME_ORACLE_END_GAME,[addr,mineOrig,verifySalt,userStep],0,function(err,rs){
			//发送交易完毕之后即使出现error，那么也有可能其实交易成功了，因为网络原因等等
			//这里需要一个轮训的机器人，不断的去获取订单的情况，然后机器人会判断交易成功了，然后告诉用户启动游戏
			PENDING_ORDERS[addr]=ORDER_STATUS_CLOSE;//监听这个地址的订单情况变成ORDER_STATUS_CLOSE
			if(err){
				console.log("服务端发起[%s]结束游戏异常，客户端需要自己确定游戏是否结束，或者等待服务器通知 :%s",addr,err);
				result.errorCode=SERVER_SEND_END_GAME_TX_FAILURE;
				//此时客户端应该要检查一下订单情况，有可能因为网络原因其实链上已经确认了交易
				//如果交易成功了，过了一段时间，服务器也会告诉客户端，游戏已经结束了
				//但是如果交易失败了，客户端其实应该要告诉服务器重新endGame
				socketEmit(socket,addr,eventName,result);//[mark]
				return;
			}
			//通知用户已经交易已经发送成功了
			//这里游戏启动交易有可能也会失败的,前端一样要进行处理
			result.data={};
			result.errorCode=SUCCESS;
			result.data.order=userLatestRedisInfo.order;
			result.data.userSteps=[];
			result.data.mines=[];
			result.data.mineHash=userLatestRedisInfo.mineHash;
			result.data.gameStatus=userLatestRedisInfo.gameStatus;
			result.data.gameResult=userLatestRedisInfo.gameResult;
			result.boxs=userLatestRedisInfo.boxs;

			result.data.addr=addr;
			result.lastTs=userLatestRedisInfo.lastTs;//提交时间
			for(var i=31;i>0;i--){
				if(userLatestRedisInfo.mineSteps[i]==0){
					break;
				}
				result.data.userSteps.push(userLatestRedisInfo.mineSteps[i]);
				result.data.mines.push(userLatestRedisInfo.mines[i]);
			}
			result.data.allMines=[]
			if(userLatestRedisInfo.gameStatus===ORDER_STATUS_CLOSE){
				for(var i=31;i>0;i--){
					if(userLatestRedisInfo.mines[i]!=0){
						result.data.allMines.push(userLatestRedisInfo.mines[i]);
					}
				}
			}
			console.log(result);
			socketEmit(socket,addr,eventName,result);//[mark]
			return;
		});
	});
}

/*
 * 获取redis中的用户的最新的扫雷记录，然后调用userLose
 */
async function processUserLose(socket,addr,eventName){
	console.log("processUserLose。。。。"+eventName);
	let result={};
	redis.get(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,function(err,info){
		if(err){
			console.log("[1]从redis中读取[%s]的正在进行的游戏数据失败:%s",addr,err);
			result.errorCode=STORE_BUSY;//我们的错，我们的服务器出现异常，这种用户是幸运的，可能没有及时把它处理
			socketEmit(socket,addr,eventName,result);//Redis错误的内存处理方法始终没有好的解决方案，完全依赖redis
			return;//不应该发生这种事情
		}
		//info 有可能是存在null的情况,诡异用户,不需要解锁
		if(!info){
			console.log("[1]redis中没有用户的数据，但是用户游戏了:%s",addr);
			return;
		}
		let userLatestRedisInfo=JSON.parse(info);//正在进行中的游戏数据
		userLatestRedisInfo.mineSteps[0]=0;//失败
		userLatestRedisInfo.gameResult=GAME_RESULT_LOSE;//输掉了游戏
		endGame(socket,addr,userLatestRedisInfo,eventName);
	});
}


/*
 * 取消扫雷,退款，只允许服务器进行调用，客户端无法请求服务器做这件事情
 */
async function processCancelMine(socket,addr,eventName){
	redis.get(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,function(err,info){
		if(err){
			let result={};
			console.log("[2]从redis中读取[%s]的正在进行的游戏数据失败:%s",addr,err);
			result.errorCode=STORE_BUSY;
			socketEmit(socket,addr,LAST_GAME_RESULT,result);//[mark]
			return;//不应该发生这种事情
		}
		let userLatestRedisInfo=JSON.parse(info);//正在进行中的游戏数据
		cancelMine(socket,addr,userLatestRedisInfo,eventName);
	});

}

async function cancelMine(socket,addr,userLatestRedisInfo,eventName){
	let result={};
	userLatestRedisInfo.gameStatus=ORDER_STATUS_CLOSE;//内存关闭，如果因为内存关闭导致无法玩游戏，客户端需要手动的重试
	userLatestRedisInfo.gameResult=GAME_RESULT_CANCEL;//取消了
	redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,JSON.stringify(userLatestRedisInfo),function(err,rs){
		if(err){
			//这里感觉将用户的信息存储也存储一份到内存中会好一些，这样即使redis失败，用户也无法通过其他方式来继续扫雷
			//断开用户的登陆，使它断线...[MARK]
			console.log("游戏取消，用户[%s]lose，存储用户的信息到redis失败.[%s]",addr,err);
			result.errorCode=SERVER_BUSY;
			socketEmit(socket,addr,eventName,result);//[mark]
			return;

		}
		//存储成功，调用合约结束游戏
		tronSerivce.execute(
			tronNodePool,
			config.contract[MAIN_MINE_GAME],
			MINE_GAME_CANCEL_MIND,[addr],0,function(err,rs){
			//发送交易完毕之后即使出现error，那么也有可能其实交易成功了，因为网络原因等等
			//这里需要一个轮训的机器人，不断的去获取订单的情况，然后机器人会判断交易成功了，然后告诉用户启动游戏
			PENDING_ORDERS[addr]=ORDER_STATUS_CLOSE;//监听这个地址的订单情况变成ORDER_STATUS_CLOSE
			if(err){
				console.log("服务端发起[%s]结束游戏异常，客户端需要自己确定游戏是否结束，或者等待服务器通知 :%s",addr,err);
				result.errorCode=SERVER_SEND_CANCEL_GAME_TX_FAILURE;
				//游戏被CANCEL的原因...
				//此时客户端应该要检查一下订单情况，有可能因为网络原因其实链上已经确认了交易
				//如果交易成功了，过了一段时间，服务器也会告诉客户端，游戏已经结束了
				//但是如果交易失败了，客户端其实应该要告诉服务器重新endGame
				socketEmit(socket,addr,eventName,result);//[mark]
				return;
			}
			//通知用户已经交易已经发送成功了
			//这里游戏启动交易有可能也会失败的,前端一样要进行处理
			result.errorCode=SUCCESS;
			result.data=userLatestRedisInfo;//此时也可以告诉玩家,redis中已经存储了用户的信息了
			socketEmit(socket,addr,eventName,result);//[mark]
			return;
		});
	});

}

/*
 * 根据地址获取用户订单详情
 */
async function getOrder(addr){
	let that=this;
	let tw=getTronWeb();
	let result={};
	if(!tw.isAddress(addr)){
		console.log("用户使用不正确的地址[%s]进行getOrder",addr);
		return;
	}
	tronSerivce.query(tronNodePool,config.contract[MAIN_MINE_GAME],
		MAIN_MINE_GAME_GET_ORDER,[addr],RETRY_TIME,function(err,rs){
		if(!err){
			that.emit(MAIN_MINE_GAME_GET_ORDER_RESULT,rs);
		}
	});
}


/*
 * 一个不断轮询的机器人，将不断的调用合约获取数据
 */
async function initCheckOrders(){
	setTimeout(() => {
		let param = [];
		for (let addr in PENDING_ORDERS) {
			param.push(addr);
		}
		let start=new Date().getTime();
		console.log(JSON.stringify(param));
		tronSerivce.query(tronNodePool,config.contract[MAIN_MINE_GAME],
			MAIN_MINE_GAME_GET_ORDERS_BY_MINERS,[param],3,function(err,rs){

			let end=new Date().getTime();
			//console.log("根据地址列表，获取订单详情列表耗时:[%s]",end-start);
			//console.log("[%s]",JSON.stringify(rs));
			if(err){
				console.log("根据地址列表，获取订单详情列表异常:%s",err);
				initCheckOrders();//递归调用
			}else{
				let orders=rs._orders;
				for(let i=0;i<orders.length;i++){//通知前端已经处理成功了
					let addr=param[i];						
					let order=orders[i]._hex;
					//console.log("地址[%s]监听状态[%s],订单详情",addr,PENDING_ORDERS[addr],order);
					if(order==0){
						continue;
					}
					let resultInfo=getOrderDetail(order);
					let socket_id=Map_addr_socket[addr];//只有登陆才可能加载数据
					let socket = _.findLast(io.sockets.sockets, { id: socket_id });
					redis.get(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,function(err,info){
						if(err){
							console.log("机器人获取Redis失败,忽略处理订单...");//发生就很严重了
							return;//不继续处理这条记录
						}
						let userLatestRedisInfo;						
						if(!info){
							userLatestRedisInfo={};
						}else{
							userLatestRedisInfo=JSON.parse(info);
						}
						userLatestRedisInfo.order=resultInfo;//更新订单信息
						//这里获取的状态一定是用户最新的状态,但如果数据太多了，也有一定的可能出现异常　
						if(resultInfo.orderStatus==ORDER_STATUS_CLOSE){
							if(PENDING_ORDERS[addr]==ORDER_STATUS_CLOSE){//我们监听了ORDER_STATUS_CLOSE事件
								let result={};
								result.errorCode=SUCCESS;
								result.data=userLatestRedisInfo;
								if(socket){
									socket.emit(GAME_OVER,result);
								}
							}
							delete PENDING_ORDERS[addr];
							console.log("地址[%s]游戏结束");
							userLatestRedisInfo.gameStatus=ORDER_STATUS_CLOSE;
							//成功或者失败，都没有办法了
							redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr, JSON.stringify(userLatestRedisInfo),function(err,rd){
								if(err){
									console.log("机器人更新结束订单异常,存储最新信息");
									console.log(err);
								}
							});
							redis.hset(MINE_REDIS_PREFIX+USER_LOG+addr,resultInfo.orderNo,JSON.stringify(userLatestRedisInfo),
							function(err,rd){
								console.log(MINE_REDIS_PREFIX+USER_LOG+addr);
								console.log(resultInfo.orderNo);
								if(err){
									console.log("机器人更新结束订单异常,存储用户日记");
									console.log(err);
								}
							});
						}else if(resultInfo.orderStatus==ORDER_STATUS_SERVER_READY){
							 if(PENDING_ORDERS[addr]==ORDER_STATUS_SERVER_READY){
								if(userLatestRedisInfo.gameStatus==ORDER_STATUS_SERVER_READY){
									//已经开始了游戏了，没有必要重复推送消息到客户端
									delete PENDING_ORDERS[addr];
								}else{
									userLatestRedisInfo.gameStatus=ORDER_STATUS_SERVER_READY;//游戏开始
									userLatestRedisInfo.lastTs=new Date().getTime();//最后一步的时间是这个
									redis.set(MINE_REDIS_PREFIX+LATEST_GAME_INFO+addr,
										JSON.stringify(userLatestRedisInfo),function(err,rs){
										if(!err){
											let result={};
											result.errorCode=SUCCESS;
											result.data={};
											result.data.lastTs=userLatestRedisInfo.lastTs;
											result.data.mineHash=userLatestRedisInfo.mineHash;
											result.data.order=resultInfo;
											console.log("emit:%s",JSON.stringify(result));
											delete PENDING_ORDERS[addr];
											if(socket){//用户有可能已经掉线了
												socket.emit(GAME_START,result);
											}
										}
									});
								}
							 }//不能删除因为有可能在等待close,继续等待

						}//ORDER_STATUS_USER_READY,只是还没有变成期望的状态，继续的等待
					});
				}
				initCheckOrders();//任何异常将导致此函数不再被调用
			}
		});
	},1600);
}

/*
 * 刷新USDT对TRX的价格
 * 同时上传到合约上面去
 */
async function refreshPrice(){
	setTimeout(async () => {
		let sql="select count from TRX_USD order by tid desc limit 1";	
		let res=await db.query(sql,[]);
		if(res){
			exchangeMap['usdt']=res[0].count;
			let usdtRate=Math.floor(exchangeMap['usdt']*1000);
			console.log("USDTRate:%s",usdtRate);
			if(usdtRate>100000){//设置一个限制
				usdtRate=100000;
			}
			tronSerivce.execute(
				tronNodePool,
				config.contract[MAIN_MINE_GAME],
				MINE_GAME_SET_TOKEN_RATE,[7,usdtRate],0,function(err,rs){
				PENDING_ORDERS[addr]=ORDER_STATUS_CLOSE;
				if(err){
					console.log("upadte usdt rate error:\n"+err);
				}
			});
		}
		console.log(JSON.stringify(exchangeMap));
		refreshPrice();
	},3000);
}

/*
 * 用户离开
 */
function socketDisconnected(data){
	let socket_id = this.id;
        let addr = Map_socket_addr[socket_id];
        if (!_.isEmpty(addr)) {
            delete Map_addr_socket[addr];
            delete Map_socket_addr[socket_id];
            console.log(gameDesc+":用户 " + addr + " 离开! socket id = " + socket_id);
        }
}

/*
 * 缓存下来，不需要每次去调用,因为只是校验签名等等，并不需要网络正常的节点
 */
function getTronWeb(){
	if(tronWeb){
		return tronWeb;
	}else{
		tronWeb=tronNodePool.getTronWeb();
		return tronWeb;
	}
}

/*
 * 根据uint256 订单获取订单详情
 */
function getOrderDetail(order){
	order=order.substring(2);
	order=ZEROS.substring(0,64-order.length)+order;
	let json={};
	json.orderStatus=parseInt(order.substring(62,64),16);
	json.mineFieldW=parseInt(order.substring(60,62),16);
	json.mineFieldH=parseInt(order.substring(58,60),16);	
	json.gameModel=parseInt(order.substring(56,58),16);	
	json.orderTokenId=parseInt(order.substring(48,56),16);	
	json.orderNo=parseInt(order.substring(40,48),16);	
	json.orderAmount=parseInt(order.substring(24,40),16);	
	json.orderBlockT=parseInt(order.substring(8,24),16);	
	json.winAmount=parseInt(order.substring(8,24),16);
	json.orderBlockH=parseInt(order.substring(0,8),16);
	return json;
}


/*
 * 用户登陆成功后，在系统内注册token
 * 需要保存用户登陆的token，将旧的token覆盖掉
 */
function registerToken(addr){
	var token = crypto.randomBytes(32).toString('hex');
	UserTokenMap[addr]=token;	
	UserLastOpTimeMap[addr]=new Date().getTime();
	return token;
}

/*

 * 检查用户的token
 */
function processUserToken(socket,addr,token,eventName){
	let result={};
	result.errorCode=TOKEN_EXPIRE;
	if(UserTokenMap[addr] && UserTokenMap[addr]==token){//存在且不为空
		if(new Date().getTime()>UserLastOpTimeMap[addr]+TOKEN_EXPIRE_TIME){//token 超时
			socket.emit(eventName,result);
			return false;
		}
		UserLastOpTimeMap[addr]=new Date().getTime();//更新用户最新登陆信息
		//每次都更新一下信息
		Map_addr_socket[addr] = socket.id;
		Map_socket_addr[socket.id] = addr;
		return true;
	}
	socket.emit(eventName,result);
	return false;
}

/*
 * 主要是有地方需要在某个事件之后做些什么，调用这个方法，对某些事件之后的事情做一个处理
 */
function socketEmit(socket,addr,eventName,result){
	if(eventName==LAST_GAME_RESULT){
		LAST_GAME_RESULT[addr]=true;//重新登陆后，上一盘游戏已经结束
	}
	socket.emit(eventName,result);
}

/*
 * 广播消息
 */
function broadcast(eventName, data) {
    io.emit(eventName, data);
}

/*
 * 根据雷区的宽度和高度计算通关的概率
 */
function getHeroDropRate(h,w,heroModel){
        let k=1;//分子,英雄模式分子都是为1
        let p=1;//分母
        for(let i=0;i<w;i++){
                if(!heroModel){
                        k=k*(h-1);
                }
                p=p*h;
        }
        return parseInt(100/((100*k)/p));
}


/*
 * 发送报销中奖消息
 * 英雄勋章掉落概率 heroDrapRate 百分数 如果为0 不可能掉落 ,可能的数字如 8，12，14，15，16 等等
 */
function sendGameMsg(addr,currency,amount,heroDrapRate) {
    let _now = _.now();
    console.log(ACTIVITY_END_TS);
    if (_now < ACTIVITY_START_TS || _now > ACTIVITY_END_TS) {
		return false;
    }
    let trxAmount=getEqualTrxAmount(currency,amount);
    if(!trxAmount && trxAmount<mineTrx){
	    return false ;//不支持
    }
    let treasures=getTreasures(addr,currency,amount,trxAmount,heroDrapRate);
    if(treasures.boxCount>0){
    	redis.publish("game_message", JSON.stringify(treasures));
	return treasures;
    }
    return false;
    
}

/*
 * 需要将指定金额的币转化为等额的trx数量，目前只是支持usdt对trx进行转化
 * 这个函数需要返回一个整数
 */
function getEqualTrxAmount(currency,amount){
	let rate=exchangeMap[currency];
	if(!rate){
		return 0;//不支持挖宝箱活动
	}
	let dp=decimalPoint[currency];
	if(!dp){
		return 0;
	}
	amount=amount/dp;//去掉小数点 
	fm=Math.floor((rate*amount));
	console.log("fm:%s",fm);
	return fm;
}

/*
 *  addr : ''//地址
 *  currency:'',//币种
 *  amount:0,//数量
 *  boxCount:0,//宝盒的数量
 *  box : {
 *      normal : 0,
 *      silver : 0,
 *      gorden : 0,
 *      hero   : 0
 *  }
 */
function getTreasures(addr,currency,amount,trxAmount,heroDrapRate){
	let rs={};
	rs.addr=addr;
	rs.currency=currency;
	rs.amount=amount.toNumber();
	rs.boxCount=0;//宝箱总数
	rs.gameType=gameType;
	rs.box={};
	rs.box.normal=0;
	rs.box.silver=0;
	rs.box.gorden=0;
	rs.box.hero=0;
	let boxCount=Math.floor(trxAmount/mineTrx);//获得宝箱的数量 
	if(Math.floor(Math.random()*2)==1){//50%的概率成功获取到宝箱
		rs.boxCount=boxCount;//获取到宝箱，现在需要确定宝箱的颜色
		for(let i=0;i<boxCount;i++){
			let rn=Math.floor(Math.random()*101);//出现1～100的数字
			if(rn<=5){
				rs.box.gorden=rs.box.gorden+1;//极小概率获取黄金宝箱
			}else if(rn<=25){
				rs.box.silver=rs.box.silver+1;//普通概率获取白银宝箱
			}else{
				rs.box.normal=rs.box.normal+1;//大概率获取青铜宝箱
			}
		}
	}
	let hrn=Math.floor(Math.random()*101);
	console.log("hrn:%s heroDrapRate:%s",hrn,heroDrapRate);
	if(heroDrapRate>0 && hrn<=heroDrapRate){
		rs.box.hero=rs.box.hero+1;
		rs.boxCount=rs.boxCount+1;
	}
	return rs;
}


/*
 * 处理进程异常
 */
async function initProcessEventHandler(){
	process.on('uncaughtException', function (error) {
	    loggerError.error(gameDesc+"进程出现未捕获异常.");
	    loggerError.error(error.stack);
	});

	process.on('unhandledRejection', error => {
	    loggerError.error(gameDesc+"进程出现未处理的Rejection.");
	    loggerError.error(error.stack);
	});
}
