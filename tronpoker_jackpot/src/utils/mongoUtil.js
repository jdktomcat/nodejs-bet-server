const mongoose = require('mongoose')
const mongoConfig = require('../configs/config').mongoConfig

const dbURL = "mongodb://" + mongoConfig.user + ":" + mongoConfig.pwd + "@" + mongoConfig.host + ":" + mongoConfig.port + "/" + mongoConfig.db;

/**
 * 连接
 */
mongoose.connect(dbURL, {useNewUrlParser: true});

const connection = mongoose.createConnection(dbURL, {useNewUrlParser: true})

/**
  * 连接成功
  */
mongoose.connection.on('connected', function () {    
    console.log('Mongoose connection open to ' + dbURL);  
});    

/**
 * 连接异常
 */
mongoose.connection.on('error',function (err) {    
    console.log('Mongoose connection error: ' + err);  
});    
 
/**
 * 连接断开
 */
mongoose.connection.on('disconnected', function () {    
    console.log('Mongoose connection disconnected');  
});


module.exports = {
    mongoose,
    connection
}