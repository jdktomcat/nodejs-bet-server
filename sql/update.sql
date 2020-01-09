
CREATE TABLE `tron_live`.`live_trc20_profit_log` (
  `days` INT NOT NULL DEFAULT '0',
  `profit` BIGINT(20) NOT NULL DEFAULT '0',
  `currency` VARCHAR(4) NOT NULL DEFAULT '',
  PRIMARY KEY (`days`));


CREATE TABLE `tron_live`.`live_trc20_div_info` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `round` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `total_token` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计已冻结 live 数',
  `amount` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红数',
  `start` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
  `end` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '结束分红时间戳',
  `state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  `trc20` char(34) NOT NULL DEFAULT '' COMMENT 'trc20地址',
  `currency` VARCHAR(4) NOT NULL DEFAULT '',
  `created_at` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '',
  `updated_at` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '',
  PRIMARY KEY (`log_id`),
  UNIQUE INDEX `index_round_trc20` (`round`, `trc20`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='live 分红总览';

CREATE TABLE `tron_live`.`live_trc20_div_detail` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `round` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `token` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期玩家持有 live 数',
  `amount` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家 token 数',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '分红交易ID',
  `trc20` char(34) NOT NULL DEFAULT '' COMMENT 'trc20地址',
  `currency` VARCHAR(4) NOT NULL DEFAULT '',
  `created_at` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '',
  `updated_at` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '',
  PRIMARY KEY (`log_id`),
  UNIQUE INDEX `index_round_addr_trc20` (`round`, `addr`, `trc20`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='live 分红详情';

CREATE TABLE `tron_live`.`win_trc20_div_info` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `round` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `total_token` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计已冻结 win 数',
  `amount` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红数',
  `start` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
  `end` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '结束分红时间戳',
  `state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  `trc20` char(34) NOT NULL DEFAULT '' COMMENT 'trc20地址',
  `currency` VARCHAR(4) NOT NULL DEFAULT '',
  `created_at` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '',
  `updated_at` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '',
  PRIMARY KEY (`log_id`),
  UNIQUE INDEX `index_round_trc20` (`round`, `trc20`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='win 分红总览';

CREATE TABLE `tron_live`.`win_trc20_div_detail` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `round` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `token` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期玩家持有 win 数',
  `amount` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家Token数',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '分红交易ID',
  `trc20` char(34) NOT NULL DEFAULT '' COMMENT 'trc20地址',
  `currency` VARCHAR(4) NOT NULL DEFAULT '',
  `created_at` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '',
  `updated_at` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '',
  PRIMARY KEY (`log_id`),
  UNIQUE INDEX `index_round_addr_trc20` (`round`, `addr`, `trc20`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='win 分红详情';
