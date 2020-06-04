const {raw} = require("./utils/dbutils")
/**
 * 余额审计数据访问接口
 */
class BalanceAudit {
    /**
     * 分页查询余额审计列表
     *
     * @param addr 钱包地址
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @param offset 起始索引
     * @param limit 分页大小
     * @returns {Promise<*>} 列表
     */
    static async getBalanceAuditPage(addr, startTime, endTime, offset, limit) {
        let sql, params
        if (addr) {
            sql = `select id, addr, live_balance, calc_balance, flag, create_time, last_modify_time from live_balance_audit where  addr = ? AND flag = 'malicious'`
            params = [addr]
        } else {
            sql = `select id, addr, live_balance, calc_balance, flag, create_time, last_modify_time from 
                         tron_live.live_balance_audit where create_time >= ? AND create_time < ? AND flag = 'malicious' order by create_time desc limit ?,?`
            params = [startTime + " 00:00:00", endTime + " 23:59:59", offset - 1, limit]
        }
        return await raw(sql, params);
    }

    /**
     * 查询余额审计列表
     *
     * @param addr 钱包地址
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @returns {Promise<*>} 列表
     */
    static async getBalanceAuditList(addr, startTime, endTime) {
        let sql, params
        if (addr) {
            sql = `select id, addr, live_balance, calc_balance, flag, create_time, last_modify_time from live_balance_audit where  addr = ? AND flag = 'malicious'`
            params = [addr]
        } else {
            sql = `select id, addr, live_balance, calc_balance, flag, create_time, last_modify_time from 
                         live_balance_audit where create_time >= ? AND create_time < ? AND flag = 'malicious' order by create_time desc`
            params = [
                new Date(startTime + " 00:00:00"), new Date(endTime + " 23:59:59")
            ]
        }
        return await raw(sql, params);
    }

    /**
     * 查询钱包地址清空记录日志列表
     *
     * @param addr 钱包地址
     * @returns {Promise<void>}
     */
    static async queryClearLogList(addr) {
        const querySql = `select addr,clear_balance,live_balance,cal_balance,create_time from tron_live.live_balance_clear_log where addr=? order by create_time desc`
        const params = [addr]
        return await raw(querySql, params)
    }
}

module.exports = BalanceAudit
