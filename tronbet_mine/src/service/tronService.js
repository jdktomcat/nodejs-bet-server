let contractInsMap={};//合约地址=>合约实例

/*
 * 查询合约
 * 不用每次都创建合约的实例，直接调用存在的合约，如果合约调用失败,假设是因为网络原因调用失败
 * 那么将会重新构建合约实例（用tronNodePool里面）最好的节点进行调用,当然也同样有可能一样失败
 */
function query(tronNodePool,contractAddr,funcName,args,repeatTime,callback){
	getContactIns(tronNodePool,contractAddr,repeatTime,function(err,ins){
		if(err){
			callback(err,null);
		}else{
			ins.methods[funcName](...args).call().then((rs)=>{
				callback(null,rs);
			}).catch((e)=>{
				console.log(e);
				console.log("调用合约[%s]=>[%s(%s)]，重新获取合约实例，再次获取合约,剩余次数%s",contractAddr,funcName,args,repeatTime);
				if(repeatTime>0){
					contractInsMap[contractAddr]=null;
					repeatTime--;
					query(tronNodePool,contractAddr,funcName,args,repeatTime,callback);
				}else{
					callback('尝试重新调用合约[%s]=>[%s(%s)]失败次数达到上限....',contractAddr,funcName,args);
				}
			});
		}
	});
}

/*
 * 执行合约
 * 不用每次都创建合约的实例，直接调用存在的合约，如果合约调用失败,假设是因为网络原因调用失败
 * 那么将会重新构建合约实例（用tronNodePool里面）最好的节点进行调用,当然也同样有可能一样失败
 * 注意发钱等这样的操作不能在这里操作，只有那种重复调用但是不影响的合约才能这样操作
 * 执行的都是不要钱的操作(即合约消耗能量，自己不出钱)
 */
function execute(tronNodePool,contractAddr,funcName,args,repeatTime,callback){
	getContactIns(tronNodePool,contractAddr,repeatTime,function(err,ins){
		if(err){
			callback(err,null);
		}else{
			ins.methods[funcName](...args).send().then((rs)=>{
				callback(null,rs);
			}).catch((e)=>{
				console.log(e);
				console.log("调用合约[%s]=>[%s(%s)]，重新获取合约实例，再次获取合约,剩余次数%s",contractAddr,funcName,args,repeatTime);
				if(repeatTime>0){
					contractInsMap[contractAddr]=null;
					repeatTime--;
					execute(tronNodePool,contractAddr,funcName,args,repeatTime,callback);
				}else{
					callback('尝试重新调用合约[%s]=>[%s(%s)]失败次数达到上限....',contractAddr,funcName,args);
				}
			});
		}
	});
}



/*
 * 获得一个合约实例
 */
function getContactIns(tronNodePool,contractAddr,repeatTime,callback){
	let ins=contractInsMap[contractAddr];
	if(ins){
		callback(null,ins);	
	}else{
		getTrobWebExist(tronNodePool,repeatTime*10*3,function(err,tronWeb){
			if(!tronWeb){
				callback("没有可用的tronweb实例",null);
			}else{
				tronWeb.contract().at(contractAddr).then((ins)=>{
					contractInsMap[contractAddr]=ins;
					callback(null,ins);
				}).catch((e)=>{
					console.log("尝试使用最优化tronWeb获取合约[%s]实例失败.",contractAddr);//有时候这里也会失败的
					callback(e,null);
				});
			}
		});
	}
}

function getTrobWebExist(tronNodePool,repeatTime,callback){
	let tronWeb=tronNodePool.getTronWeb();
	if(!tronWeb){
		if(repeatTime>0){
			repeatTime--;
			console.log("没有可用的tronweb实例,休眠1s后重新获取，剩余次数:%s",repeatTime);
			setTimeout(getTrobWebExist.bind(this,tronNodePool,repeatTime,callback),1000);
		}else{
			console.log("没有可用的tronweb实例,重试次数已经达到上限..");
			callback("无法获取TronWeb",null);
		}
		
	}else{
		callback(null,tronWeb);
	}
}


module.exports.query= query;
module.exports.execute= execute;

