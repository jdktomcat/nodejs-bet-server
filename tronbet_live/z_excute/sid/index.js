const db = require("../../src/utils/dbUtil");

/**
 * 创建活动表
 * @returns {Promise<void>}
 */
async function createActivityTable() {
    let createTableSQL = `
        use tron_bet_event;
        CREATE TABLE IF NOT EXISTS 'award_log' (
          'id' bigint(20) NOT NULL AUTO_INCREMENT COMMENT '标示',
          'addr' varchar(100) NOT NULL COMMENT '用户钱包地址',
          'order' int(10) unsigned NOT NULL COMMENT '排名',
          'integral' decimal(20,4) NOT NULL COMMENT '积分',
          'prize' int(10) unsigned NOT NULL COMMENT '奖励',
          'status' tinyint(4) NOT NULL DEFAULT '0' COMMENT '发放状态（0:待发放 1:发放成功）',
          'create_time' timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          PRIMARY KEY ('id'),
          UNIQUE KEY 'award_log_order_UN' ('order')
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='中奖纪录表';
        
        CREATE TABLE IF NOT EXISTS 'flight_log' (
          'id' bigint(20) NOT NULL AUTO_INCREMENT COMMENT '飞行日志标示',
          'addr' varchar(100) NOT NULL COMMENT '用户钱包地址',
          'from_plant' int(10) unsigned NOT NULL COMMENT '起始星球标示',
          'to_plant' int(10) unsigned NOT NULL COMMENT '到达星球标示',
          'reward' int(10) unsigned NOT NULL COMMENT '奖励',
          'status' tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '奖励发放状态 0:待发放 1:已发放',
          'create_time' timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
          PRIMARY KEY ('id')
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='飞行日志表';
        
        CREATE TABLE IF NOT EXISTS 'user_bet_log' (
          'id' bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键标示',
          'addr' varchar(100) NOT NULL COMMENT '用户钱包地址',
          'order_id' bigint(20) NOT NULL COMMENT '订单标示',
          'amount' bigint(20) NOT NULL COMMENT '下注金额单位trx',
          'bet_type' tinyint(3) unsigned NOT NULL COMMENT '下注类型:0-dice,1-moon,2-ring,3-duel,4-em,5-hub88,6-sport,7-platipus,8-binary,9-poker',
          'ts' timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下注时间',
          PRIMARY KEY ('id'),
          UNIQUE KEY 'user_bet_log_addr_order_type_UN' ('addr','order_id','bet_type'),
          KEY 'user_bet_log_addr_IDX' ('addr') USING BTREE,
          KEY 'user_bet_log_ts_IDX' ('ts') USING BTREE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户下注表';
        
        CREATE TABLE IF NOT EXISTS 'user_flight' (
          'id' bigint(20) NOT NULL AUTO_INCREMENT COMMENT '标示',
          'addr' varchar(100) NOT NULL COMMENT '用户钱包地址',
          'fuel' decimal(20,4) NOT NULL COMMENT '用户燃料剩余值',
          'plant' int(10) unsigned NOT NULL COMMENT '星球标示',
          'create_time' timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          'update_time' timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '最近更新时间',
          PRIMARY KEY ('id'),
          UNIQUE KEY 'flight_user_info__addr_UN' ('addr')
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='飞行用户信息表';
        
        CREATE TABLE IF NOT EXISTS 'user_integral' (
          'id' bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '标示',
          'addr' varchar(100) NOT NULL COMMENT '用户钱包地址',
          'integral' decimal(20,4) NOT NULL COMMENT '积分值',
          'create_time' timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          'update_time' timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '最近更新时间',
          PRIMARY KEY ('id'),
          UNIQUE KEY 'user_integral_addr_IDX' ('addr') USING BTREE
        ) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8 COMMENT='锦标赛用户积分表';
    `
    let res = await db.query(createTableSQL)
    console.log('create activity table success:')
    console.log(res)

    createTableSQL = `
        use tron_bet_wzc;
        CREATE TABLE IF NOT EXISTS 'mine_event_log' (
          'id' bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '标示',
          'tx_id' varchar(100) NOT NULL COMMENT '交易编号',
          'addr' varchar(100) NOT NULL COMMENT '用户钱包地址',
          'mentor_addr' varchar(100) DEFAULT NULL COMMENT '推荐人钱包地址',
          'mentor_rate' float DEFAULT NULL COMMENT '推荐人费率',
          'amount' bigint(20) NOT NULL COMMENT '下注金额',
          'win_amount' bigint(20) DEFAULT NULL COMMENT '扫雷游戏赢取金额，0时是输掉游戏',
          'order_id' bigint(20) NOT NULL COMMENT '订单标示',
          'order_state' tinyint(4) NOT NULL COMMENT '订单状态',
          'order_ts' timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下订单时间',
          'order_block_height' int(11) NOT NULL COMMENT '订单区块高度',
          'order_finish_block_height' int(11) NOT NULL COMMENT '订单完结区块高度',
          'mode' tinyint(4) NOT NULL COMMENT '游戏模式0：个人模式1：英雄模式',
          'mine_region_height' int(11) NOT NULL COMMENT '雷区高度',
          'mine_region_width' int(11) NOT NULL COMMENT '雷区宽度',
          'ts' timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
          PRIMARY KEY ('id'),
          UNIQUE KEY 'mine_event_log_tx_id_UN' ('tx_id')
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='扫雷游戏日志流水表';
    `
    res = await db.query(createTableSQL)
    console.log('create mine event log table success:')
    console.log(res)
}

(async function() {
    Log("sid create activity table start!")
    await createActivityTable()
})().then(() => {
    Log("sid create activity table complete!")
    process.exit(0)
}).catch(e => {
    Log("sid create activity table error: ", e)
    process.exit(1)
})
