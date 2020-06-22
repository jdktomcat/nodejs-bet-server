const dbUtil = require("../../src/utils/dbUtil");

/**
 * 创建活动表
 * @returns {Promise<void>}
 */
function createActivityTable() {
    let sql =
        "CREATE TABLE IF NOT EXISTS `tron_bet_event`.`award_log` (\n" +
        "  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '标示',\n" +
        "  `addr` varchar(100) NOT NULL COMMENT '用户钱包地址',\n" +
        "  `order` int(10) unsigned NOT NULL COMMENT '排名',\n" +
        "  `integral` decimal(20,4) NOT NULL COMMENT '积分',\n" +
        "  `prize` int(10) unsigned NOT NULL COMMENT '奖励',\n" +
        "  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '发放状态（0:待发放 1:发放成功）',\n" +
        "  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n" +
        "  PRIMARY KEY (`id`),\n" +
        "  UNIQUE KEY `award_log_order_UN` (`order`)\n" +
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='中奖纪录表';"

    let res = dbUtil.query(sql)
    console.log('create activity table award_log success!' + res)
    sql = "CREATE TABLE IF NOT EXISTS `tron_bet_event`.`flight_log` (\n" +
        "  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '飞行日志标示',\n" +
        "  `addr` varchar(100) NOT NULL COMMENT '用户钱包地址',\n" +
        "  `from_plant` int(10) unsigned NOT NULL COMMENT '起始星球标示',\n" +
        "  `to_plant` int(10) unsigned NOT NULL COMMENT '到达星球标示',\n" +
        "  `reward` int(10) unsigned NOT NULL COMMENT '奖励',\n" +
        "  `status` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '奖励发放状态 0:待发放 1:已发放',\n" +
        "  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',\n" +
        "  PRIMARY KEY (`id`)\n" +
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='飞行日志表';"
    res = dbUtil.query(sql)
    console.log('create activity table flight_log success!' + res)

    sql = "CREATE TABLE IF NOT EXISTS `tron_bet_event`.`user_bet_log` (\n" +
        "  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键标示',\n" +
        "  `addr` varchar(100) NOT NULL COMMENT '用户钱包地址',\n" +
        "  `order_id` bigint(20) NOT NULL COMMENT '订单标示',\n" +
        "  `amount` bigint(20) NOT NULL COMMENT '下注金额单位trx',\n" +
        "  `bet_type` tinyint(3) unsigned NOT NULL COMMENT '下注类型:0-dice,1-moon,2-ring,3-duel,4-em,5-hub88,6-sport,7-platipus,8-binary,9-poker',\n" +
        "  `ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下注时间',\n" +
        "  PRIMARY KEY (`id`),\n" +
        "  UNIQUE KEY `user_bet_log_addr_order_type_UN` (`addr`,`order_id`,`bet_type`),\n" +
        "  KEY `user_bet_log_addr_IDX` (`addr`) USING BTREE,\n" +
        "  KEY `user_bet_log_ts_IDX` (`ts`) USING BTREE\n" +
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户下注表';"
    res = dbUtil.query(sql)
    console.log('create activity table user_bet_log success!' + res)

    sql = "CREATE TABLE IF NOT EXISTS `tron_bet_event`.`user_flight` (\n" +
        "  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '标示',\n" +
        "  `addr` varchar(100) NOT NULL COMMENT '用户钱包地址',\n" +
        "  `fuel` decimal(20,4) NOT NULL COMMENT '用户燃料剩余值',\n" +
        "  `plant` int(10) unsigned NOT NULL COMMENT '星球标示',\n" +
        "  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n" +
        "  `update_time` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '最近更新时间',\n" +
        "  PRIMARY KEY (`id`),\n" +
        "  UNIQUE KEY `flight_user_info__addr_UN` (`addr`)\n" +
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='飞行用户信息表';"
    res = dbUtil.query(sql)
    console.log('create activity table user_flight success!' + res)

    sql = "CREATE TABLE IF NOT EXISTS `tron_bet_event`.`user_integral` (\n" +
        "  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '标示',\n" +
        "  `addr` varchar(100) NOT NULL COMMENT '用户钱包地址',\n" +
        "  `integral` decimal(20,4) NOT NULL COMMENT '积分值',\n" +
        "  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n" +
        "  `update_time` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '最近更新时间',\n" +
        "  PRIMARY KEY (`id`),\n" +
        "  UNIQUE KEY `user_integral_addr_IDX` (`addr`) USING BTREE\n" +
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='锦标赛用户积分表';"
    res = dbUtil.query(sql)
    console.log('create activity table user_integral success!' + res)

    sql = "CREATE TABLE IF NOT EXISTS `tron_bet_wzc`.`mine_event_log` (\n" +
        "  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '标示',\n" +
        "  `tx_id` varchar(100) NOT NULL COMMENT '交易编号',\n" +
        "  `addr` varchar(100) NOT NULL COMMENT '用户钱包地址',\n" +
        "  `mentor_addr` varchar(100) DEFAULT NULL COMMENT '推荐人钱包地址',\n" +
        "  `mentor_rate` float DEFAULT NULL COMMENT '推荐人费率',\n" +
        "  `amount` bigint(20) NOT NULL COMMENT '下注金额',\n" +
        "  `win_amount` bigint(20) DEFAULT NULL COMMENT '扫雷游戏赢取金额，0时是输掉游戏',\n" +
        "  `order_id` bigint(20) NOT NULL COMMENT '订单标示',\n" +
        "  `order_state` tinyint(4) NOT NULL COMMENT '订单状态',\n" +
        "  `order_ts` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下订单时间',\n" +
        "  `order_block_height` int(11) NOT NULL COMMENT '订单区块高度',\n" +
        "  `order_finish_block_height` int(11) NOT NULL COMMENT '订单完结区块高度',\n" +
        "  `mode` tinyint(4) NOT NULL COMMENT '游戏模式0：个人模式1：英雄模式',\n" +
        "  `mine_region_height` int(11) NOT NULL COMMENT '雷区高度',\n" +
        "  `mine_region_width` int(11) NOT NULL COMMENT '雷区宽度',\n" +
        "  `ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',\n" +
        "  PRIMARY KEY (`id`),\n" +
        "  UNIQUE KEY `mine_event_log_tx_id_UN` (`tx_id`)\n" +
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='扫雷游戏日志流水表';"

    res = dbUtil.query(sql)
    console.log('create mine table mine_event_log success!' + res)
}

function alertTable() {
    const alertSql = 'ALTER TABLE tron_bet_wzc.mine_event_log MODIFY COLUMN order_state INT NOT NULL COMMENT \'订单状态\';  ';
    const res = dbUtil.query(alertSql)
    console.log('alert table mine table mine_event_log success!' + res)
    process.exit(0)
}


/**
 * 修复异常金额
 * @returns {Promise<void>}
 */
async function fixActivityData() {

    const updateBetLogSql = 'update tron_bet_event.user_bet_log set amount = amount / 1000000 where bet_type = 7 and ts >= "2020-06-22 04:05:00" and ts < "2020-06-22 04:06:00" '
    const updateBetLogResult = await dbUtil.query(updateBetLogSql)
    console.log('fix bet log affected rows:')
    console.log(updateBetLogResult.affectedRows)

    const querySQL = 'select addr, sum(amount) as amount from `tron_bet_event`.`user_bet_log` where ts >= "2020-06-22 00:00:00" group by addr '
    const queryData = await dbUtil.exec(querySQL)
    if (queryData && queryData.length !== 0) {
        const updateFlightData = []
        const updateIntegralData = []
        queryData.forEach(record => {
            updateIntegralData.push([record.addr, record.amount * 0.001])
            updateFlightData.push([record.addr, record.amount * 0.005, 0])
        })
        console.log('fix integral detail:')
        console.log(updateIntegralData)
        console.log('fix flight detail:')
        console.log(updateFlightData)
        const insertIntegralSql = "insert into tron_bet_event.user_integral(addr, integral) values ? " +
            " on duplicate key update integral=values(integral)"
        const updateIntegralResult = await dbUtil.query(insertIntegralSql, [updateIntegralData])
        console.log('fix integral affected rows:')
        console.log(updateIntegralResult.affectedRows)

        const insertFlightSql = "insert into tron_bet_event.user_flight(addr, fuel, plant) values ? " +
            "on duplicate key update fuel=values(fuel)"
        const updateFlightResult = await dbUtil.query(insertFlightSql, [updateFlightData])
        console.log('fix flight affected rows:')
        console.log(updateFlightResult.affectedRows)
    }
    process.exit(0)
}

// createActivityTable()
fixActivityData()

