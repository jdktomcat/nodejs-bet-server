const fs = require('fs');
const path = require('path');

let NODE_ENV=process.env.NODE_ENV||'production';
let gobalConfigFileLocation=process.env.NODE_CONFIG_DIR||"/data/tronbet_config";
console.log(gobalConfigFileLocation);
let appConfigFileLocation=__dirname + '/config_'+NODE_ENV+".js";

if(NODE_ENV=== 'test'){
	gobalConfigFileLocation+="/config_test";
}else if(NODE_ENV=== 'development'){
	gobalConfigFileLocation+="/config_dev";
}else if(NODE_ENV=== 'production'){
	gobalConfigFileLocation+="/config";
}

let config= {};//全局配置
try {
  config= require(gobalConfigFileLocation);
} catch (error) {
  console.log('无法找到配置文件:%s',gobalConfigFileLocation);
}

config= Object.assign(config, require(appConfigFileLocation));

module.exports = config;
