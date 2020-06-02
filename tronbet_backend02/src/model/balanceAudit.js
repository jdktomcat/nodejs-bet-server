const {raw} = require("./utils/dbutils")

/**
 * 余额审计数据访问接口
 */
class BalanceAudit {
    /**
     * 分页查询余额审计列表
     *
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param offset 起始索引
     * @param limit 分页大小
     * @returns {Promise<*>} 列表
     */
    static async getBalanceAuditPage(startTime, endTime, offset, limit) {
        const sql = `select id, addr, live_balance, cal_balance, flag, create_time, last_modify_time from 
                         live_balance_audit where create_time >= ? AND create_time < ? AND flag = 'malicious' order by create_time desc limit ?,?`
        let params = [
            startTime, endTime, offset, limit
        ]
        return await raw(sql, params);
    }

    /**
     * 查询余额审计列表
     *
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @returns {Promise<*>} 列表
     */
    static async getBalanceAuditList(startTime, endTime) {
        const sql = `select id, addr, live_balance, cal_balance, flag, create_time, last_modify_time from 
                         live_balance_audit where create_time >= ? AND create_time < ? AND flag = 'malicious' order by create_time desc`
        let params = [
            startTime, endTime
        ]
        return await raw(sql, params);
    }


    /**
     * 查询余额审计列表
     *
     * @param addr 钱包地址
     * @returns {Promise<*>}余额审计信息
     */
    static async fetchBalanceAudit(addr) {
        const sql = `select id, addr, live_balance, cal_balance, flag, create_time, last_modify_time from live_balance_audit where  addr = ? flag = 'malicious'`
        let params = [
            addr
        ]
        return await raw(sql, params);
    }
}

module.exports = BalanceAudit
