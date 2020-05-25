const Sequelize = require("sequelize")
const config = require('../configs/config');
const database = config.mysqlConfig.db_name
const username = config.mysqlConfig.db_user
const password = config.mysqlConfig.db_pwd

const sequelize = new Sequelize(database, username, password, {
    dialect: 'mysql',
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: console.log,
    benchmark: true,
})

const generateModel = function () {
    const LiveBalance = sequelize.define('live_balance', {
        // attributes
        uid: {
            type: Sequelize.BIGINT,
            allowNull: false,
            primaryKey: true
        },
        currency: {
            type: Sequelize.STRING
        },
        addr: {
            type: Sequelize.STRING
            // allowNull defaults to true
        },
        tag: {
            type: Sequelize.STRING
        },
        balance: {
            type: Sequelize.STRING
        }
    }, {
        // options
        freezeTableName: true,
        timestamps: false,
        //乐观锁
        // version: true,

    });
    return LiveBalance
}

const model = generateModel()

class Balance {

    static async getOne(condition) {
        const data = await model.findOne(condition)
        if (data == null) {
            throw new Error(`user not found condition is___>${JSON.stringify(condition)}`)
        }
        const d = data.dataValues || {}
        // 处理trx,usdt
        const o = {
            currency: d.currency,
            addr: d.addr,
            balance: d.balance / 1e6
        }
        return o
    }

    static async getOneWithLock(condition) {
        condition.lock = true
        const data = await model.findOne(condition)
        const d = data.dataValues || {}
        // 处理trx,usdt
        const o = {
            currency: d.currency,
            addr: d.addr,
            balance: d.balance / 1e6
        }
        return o
    }


    static async updateByCondition(value, condition) {
        //自动事务
        const query_condition = Object.assign({lock: true}, condition)
        const result = await sequelize.transaction(async (t) => {
            console.log(t.id + "_excute_time is", new Date().toJSON())
            //
            const user = await model.findOne(query_condition, {transaction: t});
            //
            const userInfo = user.dataValues || {}
            const balance = userInfo.balance
            //
            const update_condition = Object.assign({transaction: t}, condition)
            console.log("update condition : ", update_condition.where, value)
            await model.update(value, update_condition);
            //
            return balance;
        })
        const newUser = await this.getOneWithLock(condition)
        return newUser
    }


    static async addBalance(params) {
        const amount = Number(params.amount)
        if (amount < 0) {
            throw new Error("amount error")
        }
        const amountOp = 'balance + ' + amount
        const value = {
            balance: sequelize.literal(amountOp)
        }
        const condition = {
            where: {
                addr: params.addr,
                currency: params.currency
            },
        }
        const info = await Balance.updateByCondition(value, condition)
        return info
    }

    static async decreaseBalance(params) {
        const self = this
        const amount = Number(params.amount)
        if (amount < 0) {
            throw new Error("amount error")
        }
        //

        const amountOp = 'balance - ' + amount
        const value = {
            balance: sequelize.literal(amountOp)
        }
        const condition = {
            where: {
                addr: params.addr,
                currency: params.currency
            },
        }
        //
        const user = await self.getOneWithLock(condition)
        console.log("debug--->", amount, user)
        if (amount > user.balance * 1e6) {
            throw new Error("balance not enough !")
        }
        const info = await self.updateByCondition(value, condition)
        return info
    }


}


const test = async function () {
    const a = {
        addr: "TJ8x34N7H3MxQkucpjFhnwW8aGjcYA94Ab",
        currency: 'TRX',
        amount: 2 * 1e6
    }
    const b = {
        addr: "TJ8x34N7H3MxQkucpjFhnwW8aGjcYA94Ab",
        currency: 'TRX',
        amount: 3 * 1e6
    }
    //
    // const now = await Balance.getOne(a)
    // 100000
    // console.log(now)
    // 10次 +1  20次 -2  实际上 = 100000 + 10 - 20 = 99990

    for (let i = 0; i < 10; i ++){
        await Promise.all([Balance.addBalance(a),Balance.decreaseBalance(b)])
    }

    const now = await Balance.getOne({
        where: {
            addr: "TJ8x34N7H3MxQkucpjFhnwW8aGjcYA94Ab",
            currency: "TRX"
        }
    })
    console.log(now)
}

test()


module.exports = Balance