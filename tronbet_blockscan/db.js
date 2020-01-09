const mysql = require('mysql')
var conf = require('./config')

const pool = mysql.createPool({
    host     : conf.dbhost,
    user     : conf.dbuser,
    password : conf.dbpass,
    database : conf.dbname,
})

let query = function( sql, values ) {
  return new Promise(( resolve, reject ) => {
    pool.getConnection(function(err, connection) {
      if (err) {
        reject( err )
      } else {
        connection.query(sql, values, ( err, rows) => {

          if ( err ) {
            reject( err )
          } else {
            resolve( rows )
          }
          connection.release()
        })
      }
    })
  })
}

let execTrans = async function (sql, param, connection) {
  return new Promise((reslove, reject) => {
      if (connection == null) { return; }
      connection.query(sql, param, function (err, result) {
          if (err) {
              return reject(err);
          }
          return reslove(result);
      });
  });
}

let getConnection = () => {
  return new Promise((reslove, reject) => {
      pool.getConnection(async (err, conn) => {
          if (err) {
              loggerError.error(err);
              return reject(null);
          }
          return reslove(conn);
      });
  });
}

module.exports = { query, pool, execTrans, getConnection}