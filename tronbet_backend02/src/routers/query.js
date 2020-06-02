const router = require('koa-router')()
const controller = require('../controller/queryController')

/**
 * daily data
 */
module.exports = router.get('/dailyData', controller.dailyData)
module.exports = router.get('/dailyDataList', controller.dailyDataList)
/**
 * 亏损排行
 */
module.exports = router.get('/getTopLoss', controller.getTopLoss)
module.exports = router.get('/getTopLossList', controller.getTopLossList)
/**
 * 引流查询
 */
module.exports = router.get('/getDrainage', controller.getDrainageFile)
module.exports = router.get('/getDrainageList', controller.getDrainageList)
/**
 * 亏损最多的游戏id
 */
module.exports = router.get('/topLossById', controller.topLossByIdFile)
module.exports = router.get('/topLossByIdList', controller.topLossById)
/**
 * 玩家赢钱排行
 */
module.exports = router.get('/topUser', controller.topUser)
module.exports = router.get('/topUserList', controller.topUserList)
/**
 * 玩家交易
 */
module.exports = router.get('/getAddrTransactionList', controller.getAddrTransactionList)
module.exports = router.get('/getAddrTransaction', controller.getAddrTransaction)


/**
 * 玩家区间交易
 */
module.exports = router.get('/getAddrDateList', controller.getAddrDateList)
module.exports = router.get('/getAddrDate', controller.getAddrDate)

/**
 * 根据日期分页余额审计查询列表
 */
module.exports = router.get('/getBalanceAuditList', controller.getBalanceAuditList)
/**
 * 根据钱包地址查询余额审计
 */
module.exports = router.get('/fetchBalanceAudit', controller.fetchBalanceAudit)
/**
 * 下载对应的日期分页余额审计查询列表信息
 */
module.exports = router.get('/downloadBalanceAudit', controller.downloadBalanceAudit)


