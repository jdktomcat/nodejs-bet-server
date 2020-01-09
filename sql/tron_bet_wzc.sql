-- MySQL dump 10.13  Distrib 5.7.27, for Linux (x86_64)
--
-- Host: 69.162.94.166    Database: tron_bet_wzc
-- ------------------------------------------------------
-- Server version	5.7.26

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

DROP DATABASE IF EXISTS `tron_bet_wzc`;
CREATE DATABASE `tron_bet_wzc`;
USE `tron_bet_wzc`;

--
-- Table structure for table `ante_addr`
--

DROP TABLE IF EXISTS `ante_addr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_addr` (
  `addr` char(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_dividends`
--

DROP TABLE IF EXISTS `ante_dividends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_dividends` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `ver` int(10) unsigned NOT NULL DEFAULT '1' COMMENT '期数',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `ante` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期玩家持有ANTE数(单位sun)',
  `trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家TRX数（单位sun）',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期奖池总trx(单位sun)',
  `total_ante` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '截止本期共释放ANTE数（单位sun）',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '分红交易ID',
  `state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '状态 0:无 1:已快照 2:已发送 3:已确认 4:交易失败',
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `index_ver_addr` (`ver`,`addr`) USING HASH
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='分红统计表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_dividends_v1`
--

DROP TABLE IF EXISTS `ante_dividends_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_dividends_v1` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `ver` int(10) unsigned NOT NULL DEFAULT '1' COMMENT '期数',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `ante` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期玩家持有ANTE数(单位sun)',
  `trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家TRX数（单位sun）',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期奖池总trx(单位sun)',
  `total_ante` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '截止本期共释放ANTE数（单位sun）',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '分红交易ID',
  `state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '状态 0:无 1:已快照 2:已发送 3:已确认 4:交易失败',
  `btt` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家btt数（单位sun）',
  `btt_total` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期奖池总btt(单位sun)',
  `btt_tx` char(64) NOT NULL DEFAULT '' COMMENT 'BTT分红交易ID',
  `btt_state` tinyint(4) NOT NULL DEFAULT '0' COMMENT '状态 0:无 1:已快照 2:已发送 3:已确认 4:交易失败',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='分红统计表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_finder`
--

DROP TABLE IF EXISTS `ante_finder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_finder` (
  `addr` char(34) DEFAULT NULL,
  `balance` float DEFAULT NULL,
  `cache` float DEFAULT NULL,
  `freeze` float DEFAULT NULL,
  `unfreezingAmount` float DEFAULT NULL,
  UNIQUE KEY `address_round` (`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_hoter_v1`
--

DROP TABLE IF EXISTS `ante_hoter_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_hoter_v1` (
  `addr` char(40) DEFAULT NULL,
  `pool` bigint(20) DEFAULT NULL,
  `wallet` bigint(20) DEFAULT NULL,
  `staker` bigint(20) DEFAULT NULL,
  `unfreeze` bigint(20) DEFAULT NULL,
  `total` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_send_logs`
--

DROP TABLE IF EXISTS `ante_send_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_send_logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `addr` char(34) DEFAULT NULL,
  `amont` bigint(20) DEFAULT NULL,
  `tx_id` char(130) DEFAULT NULL,
  `balance` bigint(20) DEFAULT '0',
  `status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ante_send_logs_id` (`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_token_holder`
--

DROP TABLE IF EXISTS `ante_token_holder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_token_holder` (
  `addr` char(34) NOT NULL DEFAULT '' COMMENT 'ANTE持有者地址（持有过也算）',
  `last_tx_id` char(64) NOT NULL DEFAULT '' COMMENT '最后转入交易ID',
  PRIMARY KEY (`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='ANTE币持有者补充信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_transfer`
--

DROP TABLE IF EXISTS `ante_transfer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_transfer` (
  `contract` char(64) DEFAULT NULL,
  `fromAddr` char(34) DEFAULT NULL,
  `toAddr` char(34) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_ver`
--

DROP TABLE IF EXISTS `ante_ver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_ver` (
  `ver` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `total_ante` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计已释放ANTE数(单位sun)',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红TRX(单位sun)',
  `mark_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '统计分红数据时间戳',
  `send_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
  `div_state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  PRIMARY KEY (`ver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='ANTE分红总揽';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_ver_v1`
--

DROP TABLE IF EXISTS `ante_ver_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_ver_v1` (
  `ver` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `total_ante` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计已释放ANTE数(单位sun)',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红TRX(单位sun)',
  `mark_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '统计分红数据时间戳',
  `send_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
  `div_state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  `btt_total` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红BTT(单位sun)',
  `btt_tx` char(64) NOT NULL DEFAULT '' COMMENT '提取BTT交易ID',
  `btt_state` tinyint(4) NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  PRIMARY KEY (`ver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='ANTE分红总揽';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_ver_v2`
--

DROP TABLE IF EXISTS `ante_ver_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_ver_v2` (
  `ver` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `total_ante` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计已释放ANTE数(单位sun)',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红TRX(单位sun)',
  `mark_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '统计分红数据时间戳',
  `send_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
  `div_state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  PRIMARY KEY (`ver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='ANTE分红总揽v2';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `btt_dividends_v1`
--

DROP TABLE IF EXISTS `btt_dividends_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `btt_dividends_v1` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `ver` int(10) unsigned NOT NULL DEFAULT '1' COMMENT '期数',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `dice` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期玩家持有DICE数(单位sun)',
  `win` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期玩家持有DICE数(单位sun)',
  `btt` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家BTT数（单位sun）',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '分红交易ID',
  `send_ts` bigint(20) NOT NULL DEFAULT '0' COMMENT '发送时间戳',
  `state` tinyint(3) unsigned NOT NULL DEFAULT '1' COMMENT '状态 0:无 1:已快照 2:已发送 3:已确认 4:交易失败',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1048533 DEFAULT CHARSET=utf8 COMMENT='BTT分红详情表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `btt_ver_v1`
--

DROP TABLE IF EXISTS `btt_ver_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `btt_ver_v1` (
  `ver` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `total_dice` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '质押总DICE数(单位sun)',
  `total_win` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '质押总WIN数(单位sun)',
  `total_btt` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红总BTT数(单位sun)',
  `dice_rate` int(11) NOT NULL,
  `win_rate` int(11) NOT NULL,
  `mark_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '统计分红数据时间戳',
  `send_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '提取BTT交易ID',
  `div_state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  PRIMARY KEY (`ver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='btt分红总揽(dice+win)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crash_detail`
--

DROP TABLE IF EXISTS `crash_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `crash_detail` (
  `round` int(10) unsigned NOT NULL COMMENT '游戏轮次',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '玩家地址',
  `no` smallint(5) unsigned DEFAULT '0' COMMENT '入场顺序',
  `join_ts` bigint(20) unsigned DEFAULT '0' COMMENT '玩家加入时间戳',
  `amount` int(11) unsigned DEFAULT '0' COMMENT '投注金额',
  `auto_out` float unsigned DEFAULT '0' COMMENT '自动逃脱倍率',
  `out_ts` bigint(20) unsigned DEFAULT '0' COMMENT '逃脱时间戳',
  `cashed_out` float unsigned DEFAULT '0' COMMENT '兑现点/退出点',
  `win_sun` float DEFAULT '0' COMMENT '收益(sun)',
  `referral_sun` float unsigned DEFAULT '0' COMMENT '推荐人收益(sun)',
  `name` varchar(64) DEFAULT '',
  PRIMARY KEY (`round`,`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='爆点游戏详情表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `crash_info`
--

DROP TABLE IF EXISTS `crash_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `crash_info` (
  `round` int(10) unsigned NOT NULL COMMENT 'Crash游戏轮次',
  `hash` char(64) DEFAULT '' COMMENT '随机Hash',
  `may_result` float unsigned DEFAULT '0' COMMENT '预测爆点值',
  `result` float unsigned DEFAULT '0' COMMENT '爆点值',
  `count` smallint(6) unsigned DEFAULT '0' COMMENT '参与人数',
  `win_count` smallint(6) unsigned DEFAULT '0' COMMENT '获胜人数',
  `total` int(11) unsigned DEFAULT '0' COMMENT '总参与金额',
  `payout` float unsigned DEFAULT '0' COMMENT '总赔付',
  `waiting_ts` bigint(20) unsigned DEFAULT '0' COMMENT '投注开始时间戳',
  `pending_ts` bigint(20) unsigned DEFAULT '0' COMMENT '投注结束时间戳',
  `begin_ts` bigint(20) unsigned DEFAULT '0' COMMENT '游戏开始时间戳',
  `end_ts` bigint(20) unsigned DEFAULT '0' COMMENT '游戏结束时间戳（爆点时间戳）',
  `begin_tx_id` char(64) DEFAULT '' COMMENT '开始游戏交易ID',
  `end_tx_id` char(64) DEFAULT '' COMMENT '结算游戏交易ID',
  PRIMARY KEY (`round`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='爆点游戏信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_block`
--

DROP TABLE IF EXISTS `dice_block`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_block` (
  `block_num` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '区块号',
  `block_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '当前区块时间戳',
  `txs_count` smallint(6) unsigned NOT NULL DEFAULT '0' COMMENT '当前区块交易数',
  `total_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '当前区块下注金额(单位:sun)',
  `payout_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '当前区块赔付金额(单位:sun)',
  `play_times` smallint(6) unsigned NOT NULL DEFAULT '0' COMMENT '当前区块用户游戏次数',
  `win_times` smallint(6) unsigned NOT NULL DEFAULT '0' COMMENT '当前区块用户胜利次数',
  `all_bet_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计总下注额(单位:sun)',
  `all_payout_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计总赔付额(单位:sun)',
  `all_play_times` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计用户总游戏次数',
  `all_win_times` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计用户总胜利次数',
  PRIMARY KEY (`block_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='dice统计信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_dividends_v1`
--

DROP TABLE IF EXISTS `dice_dividends_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_dividends_v1` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `ver` int(10) unsigned NOT NULL DEFAULT '1' COMMENT '期数',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `dice` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期玩家持有DICE数(单位sun)',
  `trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家TRX数（单位sun）',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期奖池总trx(单位sun)',
  `total_dice` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '截止本期共释放DICE数（单位sun）',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '分红交易ID',
  `state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '状态 0:无 1:已快照 2:已发送 3:已确认 4:交易失败',
  `btt` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家btt数（单位sun）',
  `btt_total` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期奖池总btt(单位sun)',
  `btt_tx` char(64) NOT NULL DEFAULT '' COMMENT 'BTT分红交易ID',
  `btt_state` tinyint(4) NOT NULL DEFAULT '0' COMMENT '状态 0:无 1:已快照 2:已发送 3:已确认 4:交易失败',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=998527 DEFAULT CHARSET=utf8 COMMENT='分红统计表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_events_roll_0`
--

DROP TABLE IF EXISTS `dice_events_roll_0`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_events_roll_0` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `order_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '订单编号，用户名下顺序递增且唯一',
  `direction` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '预测方向 0:小于  1:大于',
  `number` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '游戏预测值',
  `roll` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '游戏结果值',
  `amount_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '下注金额',
  `payout_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '赔付金额',
  `mentor` char(34) NOT NULL DEFAULT '' COMMENT '推荐人地址',
  `referral_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '推荐人收益',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '相关交易ID',
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `index_tx_id` (`tx_id`) USING HASH
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='dice游戏异常日志(roll === 0)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_events_v0`
--

DROP TABLE IF EXISTS `dice_events_v0`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_events_v0` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `order_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '订单编号，用户名下顺序递增且唯一',
  `direction` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '预测方向 0:小于  1:大于',
  `number` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '游戏预测值',
  `roll` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '游戏结果值',
  `amount_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '下注金额',
  `payout_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '赔付金额',
  `mentor` char(34) NOT NULL DEFAULT '' COMMENT '推荐人地址',
  `referral_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '推荐人收益',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '相关交易ID',
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `index_addr_order` (`addr`,`order_id`) USING HASH,
  UNIQUE KEY `index_tx_id` (`tx_id`) USING HASH
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='dice游戏日志(版本0/合约0)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_events_v1`
--

DROP TABLE IF EXISTS `dice_events_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_events_v1` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `order_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '订单编号，用户名下顺序递增且唯一',
  `direction` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '预测方向 0:小于  1:大于',
  `number` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '游戏预测值',
  `roll` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '游戏结果值',
  `amount_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '下注金额',
  `payout_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '赔付金额',
  `mentor` char(34) NOT NULL DEFAULT '' COMMENT '推荐人地址',
  `referral_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '推荐人收益',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '相关交易ID',
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `index_addr_order` (`addr`,`order_id`) USING HASH,
  UNIQUE KEY `index_tx_id` (`tx_id`) USING HASH
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='dice游戏日志(版本1/合约1)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_events_v2`
--

DROP TABLE IF EXISTS `dice_events_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_events_v2` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `order_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '订单编号，用户名下顺序递增且唯一',
  `direction` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '预测方向 0:小于  1:大于',
  `number` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '游戏预测值',
  `roll` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '游戏结果值',
  `amount_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '下注金额',
  `payout_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '赔付金额',
  `mentor` char(34) NOT NULL DEFAULT '' COMMENT '推荐人地址',
  `referral_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '推荐人收益',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '相关交易ID',
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `index_addr_order` (`addr`,`order_id`) USING HASH,
  UNIQUE KEY `index_tx_id` (`tx_id`) USING HASH
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='dice游戏日志(版本2/合约2)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_events_v3`
--

DROP TABLE IF EXISTS `dice_events_v3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_events_v3` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `order_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '订单编号，用户名下顺序递增且唯一',
  `direction` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '预测方向 0:小于  1:大于',
  `number` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '游戏预测值',
  `roll` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '游戏结果值',
  `amount_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '下注金额',
  `payout_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '赔付金额',
  `mentor` char(34) NOT NULL DEFAULT '' COMMENT '推荐人地址',
  `referral_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '推荐人收益',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '相关交易ID',
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `index_addr_order` (`addr`,`order_id`),
  UNIQUE KEY `index_tx_id` (`tx_id`)
) ENGINE=InnoDB AUTO_INCREMENT=76347983 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='dice游戏日志(版本3/合约3)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_players`
--

DROP TABLE IF EXISTS `dice_players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_players` (
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `total` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计用户总流水(单位sun)',
  `payout` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计向用户总赔付额(单位sun)',
  `play_times` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '累计用户游戏次数',
  `win_times` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '累计用户胜利次数',
  `mentor` char(34) NOT NULL DEFAULT '' COMMENT '推荐人地址',
  `referral` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '推荐人收益',
  `first_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间戳/首次游戏时间戳',
  `lastest_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '最后操作时间戳/最后游戏时间戳',
  `moon_total` bigint(20) unsigned DEFAULT '0',
  `moon_payout` bigint(20) unsigned DEFAULT '0',
  `wheel_payout` bigint(20) unsigned DEFAULT '0',
  `wheel_total` bigint(20) unsigned DEFAULT '0',
  `moon_play_times` int(11) unsigned DEFAULT '0',
  `wheel_play_times` int(11) unsigned DEFAULT '0',
  `name` char(34) DEFAULT '' COMMENT '玩家名称',
  `img` int(11) DEFAULT '10000' COMMENT '头像ID',
  PRIMARY KEY (`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='用户数据统计表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_rank_weekly`
--

DROP TABLE IF EXISTS `dice_rank_weekly`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_rank_weekly` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `start_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '开始统计时间戳',
  `end_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '截止统计时间戳',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '玩家地址',
  `cur_total_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '当前投注总额(单位sun)',
  `total_sun_at_start` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '开始统计时投注总额(单位sun)',
  PRIMARY KEY (`log_id`),
  KEY `index_start_ts` (`start_ts`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='周排行榜';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_txs`
--

DROP TABLE IF EXISTS `dice_txs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_txs` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `block_num` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '交易所在区块编号',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '交易ID',
  `tx_result` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '交易执行结果 1:成功 0:失败',
  `energy` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '能量消耗',
  `net` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '带宽消耗',
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `index_tx_id` (`tx_id`) USING HASH,
  KEY `index_block_num` (`block_num`)
) ENGINE=InnoDB AUTO_INCREMENT=185579575 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='交易记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_ver_v1`
--

DROP TABLE IF EXISTS `dice_ver_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_ver_v1` (
  `ver` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `total_dice` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计已释放dice数(单位sun)',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红TRX(单位sun)',
  `mark_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '统计分红数据时间戳',
  `send_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
  `div_state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  `btt_total` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红BTT(单位sun)',
  `btt_tx` char(64) NOT NULL DEFAULT '' COMMENT '提取BTT交易ID',
  `btt_state` tinyint(4) NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  PRIMARY KEY (`ver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='ANTE分红总揽';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_login`
--

DROP TABLE IF EXISTS `log_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `log_login` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `addr` char(34) DEFAULT '' COMMENT '用户地址',
  `login_ts` bigint(20) unsigned DEFAULT '0' COMMENT '登陆时间戳',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='登陆日志表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_rain`
--

DROP TABLE IF EXISTS `log_rain`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `log_rain` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增ID',
  `rain_id` int(11) NOT NULL DEFAULT '0' COMMENT '红包ID',
  `sender` char(34) NOT NULL DEFAULT '' COMMENT '发送人地址',
  `total_sun` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '红包总金额（单位sun）',
  `count` smallint(5) unsigned NOT NULL DEFAULT '0' COMMENT '红包个数',
  `send_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送时间戳',
  `receiver` char(34) NOT NULL DEFAULT '' COMMENT '领取人地址',
  `no` smallint(6) unsigned NOT NULL DEFAULT '0' COMMENT '领取顺序',
  `amount` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '领取数量（单位sun）',
  `receive_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '领取时间',
  `tx_id` char(64) DEFAULT '' COMMENT '交易ID',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='红包表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_task`
--

DROP TABLE IF EXISTS `log_task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `log_task` (
  `log_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `round` int(10) unsigned DEFAULT '0' COMMENT '每日任务轮次',
  `addr` char(34) COLLATE utf8_croatian_ci DEFAULT '' COMMENT '领奖地址',
  `lv` smallint(5) unsigned DEFAULT '0' COMMENT '玩家等级',
  `task_id` smallint(5) unsigned DEFAULT '0' COMMENT '任务编号',
  `need` smallint(5) unsigned DEFAULT '0' COMMENT '达标数值',
  `now` smallint(5) unsigned DEFAULT '0' COMMENT '当前数值',
  `trx` int(10) unsigned DEFAULT '0' COMMENT '奖励TRX数',
  `tx_id` char(64) COLLATE utf8_croatian_ci DEFAULT '' COMMENT '发奖TX_HASH',
  `send_ts` bigint(20) unsigned DEFAULT '0' COMMENT '发奖时间戳',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=121055 DEFAULT CHARSET=utf8 COLLATE=utf8_croatian_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rank_award`
--

DROP TABLE IF EXISTS `rank_award`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rank_award` (
  `round` int(10) unsigned NOT NULL COMMENT '轮次',
  `rank` smallint(5) unsigned NOT NULL DEFAULT '9999' COMMENT '玩家排名',
  `addr` char(34) DEFAULT '' COMMENT '玩家地址',
  `total_bet_sun` bigint(20) unsigned DEFAULT '0' COMMENT '当期总下注额,单位sun',
  `trx` int(10) unsigned DEFAULT '0' COMMENT '奖励TRX数量',
  `ante` int(10) unsigned DEFAULT '0' COMMENT '奖励ANTE数量',
  `create_ts` bigint(20) unsigned DEFAULT '0' COMMENT '排名截止时间戳/记录生成时间戳',
  `trx_tx` char(64) DEFAULT '' COMMENT '发送TRX奖励交易ID',
  `ante_tx` char(64) DEFAULT '' COMMENT '发送ANTE奖励交易ID',
  `trx_tx_status` tinyint(3) unsigned DEFAULT '0' COMMENT 'TRX奖励发送状态 = 0:无需发奖 1:未发送 2:正在确认 3:交易失败 99:交易成功',
  `ante_tx_status` tinyint(3) unsigned DEFAULT '0' COMMENT 'ANTE奖励发送状态 = 0:无需发奖 1:未发送 2:正在确认 3:交易失败 99:交易成功',
  PRIMARY KEY (`round`,`rank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='定期排行榜';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rank_award_v1`
--

DROP TABLE IF EXISTS `rank_award_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rank_award_v1` (
  `round` int(10) unsigned NOT NULL COMMENT '轮次',
  `rank` smallint(5) unsigned NOT NULL DEFAULT '9999' COMMENT '玩家排名',
  `addr` char(34) DEFAULT '' COMMENT '玩家地址',
  `total_bet_sun` bigint(20) unsigned DEFAULT '0' COMMENT '当期总下注额,单位sun',
  `trx` int(10) unsigned DEFAULT '0' COMMENT '奖励TRX数量',
  `ante` int(10) unsigned DEFAULT '0' COMMENT '奖励ANTE数量',
  `create_ts` bigint(20) unsigned DEFAULT '0' COMMENT '排名截止时间戳/记录生成时间戳',
  `trx_tx` char(64) DEFAULT '' COMMENT '发送TRX奖励交易ID',
  `ante_tx` char(64) DEFAULT '' COMMENT '发送ANTE奖励交易ID',
  `trx_tx_status` tinyint(3) unsigned DEFAULT '0' COMMENT 'TRX奖励发送状态 = 0:无需发奖 1:未发送 2:正在确认 3:交易失败 99:交易成功',
  `ante_tx_status` tinyint(3) unsigned DEFAULT '0' COMMENT 'ANTE奖励发送状态 = 0:无需发奖 1:未发送 2:正在确认 3:交易失败 99:交易成功',
  PRIMARY KEY (`round`,`rank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='小时排行榜';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rank_list`
--

DROP TABLE IF EXISTS `rank_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rank_list` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `round` int(10) unsigned DEFAULT '0' COMMENT '轮次',
  `start_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '开始统计时间戳',
  `end_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '截止统计时间戳',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '玩家地址',
  `cur_total_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '当前投注总额(单位sun)',
  `total_sun_at_start` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '开始统计时投注总额(单位sun)',
  PRIMARY KEY (`log_id`),
  KEY `index_round` (`round`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='日排行榜';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rank_list_v1`
--

DROP TABLE IF EXISTS `rank_list_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rank_list_v1` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `round` int(10) unsigned DEFAULT '0' COMMENT '轮次',
  `start_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '开始统计时间戳',
  `end_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '截止统计时间戳',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '玩家地址',
  `cur_total_sun` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '当前投注总额(单位sun)',
  `total_sun_at_start` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '开始统计时投注总额(单位sun)',
  `all_users_bet_trx` int(10) unsigned DEFAULT '0' COMMENT '统计时间区间内所有玩家下注总数(TRX)',
  PRIMARY KEY (`log_id`),
  KEY `index_round` (`round`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2752587 DEFAULT CHARSET=utf8 COMMENT='小时排行榜';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trc10_dice_order`
--

DROP TABLE IF EXISTS `trc10_dice_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `trc10_dice_order` (
  `log_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) DEFAULT NULL,
  `addr` varchar(34) DEFAULT NULL,
  `token` int(11) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `direction` smallint(6) DEFAULT NULL,
  `number` int(11) DEFAULT NULL,
  `roll` int(11) DEFAULT NULL,
  `win` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `order_tx` char(64) DEFAULT NULL,
  `result_tx` char(64) DEFAULT NULL,
  `sign` varchar(130) DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `address_round` (`addr`,`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trc10_dice_order_v2`
--

DROP TABLE IF EXISTS `trc10_dice_order_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `trc10_dice_order_v2` (
  `log_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) DEFAULT NULL,
  `addr` varchar(34) DEFAULT NULL,
  `token` int(11) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `direction` smallint(6) DEFAULT NULL,
  `number` int(11) DEFAULT NULL,
  `roll` int(11) DEFAULT NULL,
  `win` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `order_tx` char(64) DEFAULT NULL,
  `result_tx` char(64) DEFAULT NULL,
  `sign` varchar(130) DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `address_round` (`addr`,`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=665361 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trc20_dice_order`
--

DROP TABLE IF EXISTS `trc20_dice_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `trc20_dice_order` (
  `log_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) DEFAULT NULL,
  `addr` varchar(34) DEFAULT NULL,
  `token` varchar(34) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `direction` smallint(6) DEFAULT NULL,
  `number` int(11) DEFAULT NULL,
  `roll` int(11) DEFAULT NULL,
  `win` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `order_tx` char(64) DEFAULT NULL,
  `result_tx` char(64) DEFAULT NULL,
  `sign` varchar(130) DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  UNIQUE KEY `address_round` (`addr`,`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=231598 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wheel_detail`
--

DROP TABLE IF EXISTS `wheel_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wheel_detail` (
  `log_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `round` int(10) unsigned NOT NULL COMMENT '游戏轮次',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '玩家地址',
  `amount` int(11) unsigned DEFAULT '0' COMMENT '投注金额',
  `number` float unsigned DEFAULT '0' COMMENT '投注倍率',
  `roll` float unsigned DEFAULT '0' COMMENT '击中倍率',
  `win` float DEFAULT '0' COMMENT '收益(sun)',
  `referral` float unsigned DEFAULT '0' COMMENT '推荐人收益(sun)',
  `name` varchar(64) DEFAULT '',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17401281 DEFAULT CHARSET=utf8 COMMENT='转盘游戏详玩家下注记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wheel_info`
--

DROP TABLE IF EXISTS `wheel_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wheel_room`
--

DROP TABLE IF EXISTS `wheel_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wheel_room` (
  `room_id` int(10) unsigned NOT NULL COMMENT 'solo房间号',
  `hash` char(64) DEFAULT '' COMMENT '随机Hash',
  `salt` char(32) DEFAULT '' COMMENT '产生随机值的salt',
  `seed` char(64) DEFAULT '' COMMENT '产生随机值的salt',
  `roll` float unsigned DEFAULT '0' COMMENT '转盘值',
  `angle` float unsigned DEFAULT '0' COMMENT '旋转角度',
  `seat_id` smallint(6) NOT NULL DEFAULT '0' COMMENT '座位号',
  `player1` char(34) NOT NULL DEFAULT '' COMMENT '玩家1地址',
  `player2` char(34) NOT NULL DEFAULT '' COMMENT '玩家2地址',
  `player3` char(34) NOT NULL DEFAULT '' COMMENT '玩家3地址',
  `player4` char(34) NOT NULL DEFAULT '' COMMENT '玩家4地址',
  `player1Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家1下单tx',
  `player2Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家2下单tx',
  `player3Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家3下单tx',
  `player4Tx` char(130) NOT NULL DEFAULT '' COMMENT '玩家4下单tx',
  `amount` int(11) unsigned DEFAULT '0' COMMENT '投注金额',
  `playerCnt` smallint(6) NOT NULL DEFAULT '0' COMMENT '房间上限人数, 最大为4, 最小为2',
  `status` smallint(6) NOT NULL DEFAULT '0' COMMENT '当前状态, 1, 正常解决, 2超时撤销',
  `settleTx` char(130) DEFAULT '' COMMENT '解决TX',
  `createTs` bigint(20) unsigned DEFAULT '0' COMMENT '房间创建时间',
  `endTs` bigint(20) unsigned DEFAULT '0' COMMENT '房间结算或者撤销时间',
  PRIMARY KEY (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='转盘游戏solo房间信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `win_dividends_v1`
--

DROP TABLE IF EXISTS `win_dividends_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `win_dividends_v1` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `ver` int(10) unsigned NOT NULL DEFAULT '1' COMMENT '期数',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `win` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期玩家持有DICE数(单位sun)',
  `trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家TRX数（单位sun）',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期奖池总trx(单位sun)',
  `total_win` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '截止本期共释放DICE数（单位sun）',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '分红交易ID',
  `state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '状态 0:无 1:已快照 2:已发送 3:已确认 4:交易失败',
  `btt` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家btt数（单位sun）',
  `btt_total` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期奖池总btt(单位sun)',
  `btt_tx` char(64) NOT NULL DEFAULT '' COMMENT 'BTT分红交易ID',
  `btt_state` tinyint(4) NOT NULL DEFAULT '0' COMMENT '状态 0:无 1:已快照 2:已发送 3:已确认 4:交易失败',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3436286 DEFAULT CHARSET=utf8 COMMENT='分红统计表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `win_ver_v1`
--

DROP TABLE IF EXISTS `win_ver_v1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `win_ver_v1` (
  `ver` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `total_win` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计已释放dice数(单位sun)',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红TRX(单位sun)',
  `mark_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '统计分红数据时间戳',
  `send_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
  `div_state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  `btt_total` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红BTT(单位sun)',
  `btt_tx` char(64) NOT NULL DEFAULT '' COMMENT '提取BTT交易ID',
  `btt_state` tinyint(4) NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  PRIMARY KEY (`ver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='WIN分红总揽';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-11-05  8:34:23
