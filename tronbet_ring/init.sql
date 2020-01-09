CREATE TABLE `wheel_info` (
  `round` int(10) unsigned NOT NULL COMMENT 'wheel游戏轮次',
  `hash` char(64) DEFAULT '' COMMENT '随机Hash',
  `salt` char(32) DEFAULT '' COMMENT '产生随机值的salt',
  `roll` float unsigned DEFAULT '0' COMMENT '转盘值',
  `angle` float unsigned DEFAULT '0' COMMENT '旋转角度',
  `luckyNum` smallint(6) unsigned DEFAULT '0' COMMENT '幸运数字',
  `count2x` smallint(6) unsigned DEFAULT '0' COMMENT '2倍参与人数',
  `count3x` smallint(6) unsigned DEFAULT '0' COMMENT '3倍参与人数',
  `count5x` smallint(6) unsigned DEFAULT '0' COMMENT '5倍参与人数',
  `count50x` smallint(6) unsigned DEFAULT '0' COMMENT '50倍参与人数',
  `total2x` int(11) unsigned DEFAULT '0' COMMENT '2倍参与金额',
  `total3x` int(11) unsigned DEFAULT '0' COMMENT '3倍参与金额',
  `total5x` int(11) unsigned DEFAULT '0' COMMENT '5倍参与金额',
  `total50x` int(11) unsigned DEFAULT '0' COMMENT '50倍参与金额',
  `payout` float unsigned DEFAULT '0' COMMENT '总赔付',
  `waiting_ts` bigint(20) unsigned DEFAULT '0' COMMENT '投注开始时间戳',
  `settling_ts` bigint(20) unsigned DEFAULT '0' COMMENT '投注结束时间戳',
  `begin_tx_id` char(64) DEFAULT '' COMMENT '开始游戏交易ID',
  `end_tx_id` char(64) DEFAULT '' COMMENT '结算游戏交易ID',
  PRIMARY KEY (`round`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='转盘游戏信息表';


CREATE TABLE `wheel_detail` (
  `log_id` int8 not NULL PRIMARY KEY auto_increment,
  `round` int(10) unsigned NOT NULL COMMENT '游戏轮次',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '玩家地址',
  `amount` int(11) unsigned DEFAULT '0' COMMENT '投注金额',
  `number` float unsigned DEFAULT '0' COMMENT '投注倍率',
  `roll` float unsigned DEFAULT '0' COMMENT '击中倍率',
  `win` float DEFAULT '0' COMMENT '收益(sun)',
  `referral` float unsigned DEFAULT '0' COMMENT '推荐人收益(sun)',
  `name` varchar(64) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='转盘游戏详玩家下注记录'


CREATE TABLE `wheel_room` (
  `room_id` int(10) unsigned NOT NULL COMMENT 'solo房间号',
  `hash` char(64) DEFAULT '' COMMENT '随机Hash',
  `salt` char(32) DEFAULT '' COMMENT '产生随机值的salt',
  `seed` char(64) DEFAULT '' COMMENT '产生随机值的salt',
  `roll` float unsigned DEFAULT '0' COMMENT '转盘值',
  `angle` float unsigned DEFAULT '0' COMMENT '旋转角度',
  `seat_id` smallint NOT NULL DEFAULT 0 COMMENT '座位号',
  `player1` char(34) NOT NULL DEFAULT '' COMMENT '玩家1地址',
  `player2` char(34) NOT NULL DEFAULT '' COMMENT '玩家2地址',
  `player3` char(34) NOT NULL DEFAULT '' COMMENT '玩家3地址',
  `player4` char(34) NOT NULL DEFAULT '' COMMENT '玩家4地址',
  `player1Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家1下单tx',
  `player2Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家2下单tx',
  `player3Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家3下单tx',
  `player4Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家4下单tx',
  `amount` int(11) unsigned DEFAULT '0' COMMENT '投注金额',
  `playerCnt` smallint NOT NULL DEFAULT 0 COMMENT '房间上限人数, 最大为4, 最小为2',
  `status` smallint NOT NULL DEFAULT 0 COMMENT '当前状态, 1, 正常解决, 2超时撤销',
  `settleTx` char(130) DEFAULT '' COMMENT '解决TX',
  `createTs` bigint(20) unsigned DEFAULT '0' COMMENT '房间创建时间',
  `endTs` bigint(20) unsigned DEFAULT '0' COMMENT '房间结算或者撤销时间',
  PRIMARY KEY (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='转盘游戏solo房间信息';



CREATE TABLE `wheel_solo_order` (
  `room_id` int(10) unsigned NOT NULL COMMENT 'solo房间号',
  `roll` float unsigned DEFAULT '0' COMMENT '转盘值',
  `seat_id` smallint NOT NULL DEFAULT 0 COMMENT '座位号',
  `player1` char(34) NOT NULL DEFAULT '' COMMENT '玩家1地址',
  `player2` char(34) NOT NULL DEFAULT '' COMMENT '玩家2地址',
  `player3` char(34) NOT NULL DEFAULT '' COMMENT '玩家3地址',
  `player4` char(34) NOT NULL DEFAULT '' COMMENT '玩家4地址',
  `winAddr` char(34) NOT NULL DEFAULT '' COMMENT '玩家4地址',
  `win` bigint(11) unsigned DEFAULT '0' COMMENT '赢得奖励',
  `player1Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家1下单tx',
  `player2Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家2下单tx',
  `player3Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家3下单tx',
  `player4Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家4下单tx',
  `amount` bigint(11) unsigned DEFAULT '0' COMMENT '投注金额',
  `playerCnt` smallint NOT NULL DEFAULT 0 COMMENT '房间上限人数, 最大为4, 最小为2',
  `status` smallint NOT NULL DEFAULT 0 COMMENT '当前状态, 1, 正常解决, 2超时撤销',
  `settleTx` char(130) DEFAULT '' COMMENT '解决TX',
  `createTs` bigint(20) unsigned DEFAULT '0' COMMENT '房间创建时间',
  `endTs` bigint(20) unsigned DEFAULT '0' COMMENT '房间结算或者撤销时间',
  PRIMARY KEY (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='区块扫描信息';


