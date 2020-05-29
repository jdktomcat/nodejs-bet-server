// process.env.NODE_ENV = 'test'
const Sequelize = require("sequelize")
const config = require('../configs/config');
const db_host = config.mysqlConfig.db_host
const db_port = config.mysqlConfig.db_port
const database = config.mysqlConfig.db_name
const username = config.mysqlConfig.db_user
const password = config.mysqlConfig.db_pwd

const sequelize = new Sequelize(database, username, password, {
    host: db_host,
    port: db_port,
    dialect: 'mysql',
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: console.log,
})


const rawQuery = async function (sql, params, transaction = null) {
    const a = await sequelize.query(
        sql,
        {
            replacements: params,
            type: Sequelize.QueryTypes.SELECT,
            transaction: transaction
        }
    );
    return a
}


const updateQuery = async function (sql, params, transaction = null) {
    console.log("params: ",params)
    const a = await sequelize.query(
        sql,
        {
            replacements: params,
            type: Sequelize.QueryTypes.UPDATE,
            transaction: transaction,
        }
    );
    return a
}

let o = {}
const initSeq = function () {
    if(Object.keys(o).length === 0){
        o = {
            "sequelize" : sequelize,
            rawQuery : rawQuery,
            updateQuery : updateQuery,
        }
    }
}
initSeq()


module.exports = o