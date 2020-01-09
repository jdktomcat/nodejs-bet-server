-- MySQL dump 10.13  Distrib 5.7.27, for Linux (x86_64)
--
-- Host: 192.169.80.102    Database: tronbet_poker_log
-- ------------------------------------------------------
-- Server version	5.7.25-log

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

--
-- Table structure for table `poker_confirm_log`
--

DROP DATABASE IF EXISTS `tronbet_poker_log`;
CREATE DATABASE `tronbet_poker_log`;
USE `tronbet_poker_log`;


DROP TABLE IF EXISTS `poker_confirm_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poker_confirm_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '日志Id',
  `txID` varchar(128) NOT NULL COMMENT '被确认的txID',
  `addr` varchar(64) NOT NULL COMMENT '玩家地址',
  `blockId` int(11) NOT NULL COMMENT '区块号',
  `tableId` int(11) NOT NULL COMMENT '桌号',
  `trxAmount` bigint(20) NOT NULL COMMENT '金额',
  `oldBalance` bigint(20) NOT NULL COMMENT '确认前金额',
  `newBalance` bigint(20) NOT NULL COMMENT '确认后金额',
  `backAmount` bigint(20) NOT NULL DEFAULT '0' COMMENT '退回的金额',
  `seatNo` smallint(6) NOT NULL COMMENT '座位号',
  `gameNo` int(11) NOT NULL COMMENT '游戏回合号',
  `optime` int(11) NOT NULL COMMENT '操作时间',
  PRIMARY KEY (`logId`)
) ENGINE=InnoDB AUTO_INCREMENT=260964 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poker_jackpot_log`
--

DROP TABLE IF EXISTS `poker_jackpot_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poker_jackpot_log` (
  `jackpotId` bigint(20) NOT NULL,
  `winner` char(64) DEFAULT NULL,
  `tableId` bigint(20) DEFAULT NULL,
  `round` bigint(20) DEFAULT NULL,
  `cardType` char(20) DEFAULT NULL,
  `jackpotType` int(11) DEFAULT NULL,
  `trx` bigint(20) DEFAULT NULL,
  `pool` bigint(20) DEFAULT NULL,
  `reachTs` bigint(20) DEFAULT NULL,
  `reachTx` char(160) DEFAULT NULL,
  `getTs` bigint(20) DEFAULT NULL,
  `getTx` char(160) DEFAULT NULL,
  `status` int(11) DEFAULT '0',
  PRIMARY KEY (`jackpotId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poker_payin_log`
--

DROP TABLE IF EXISTS `poker_payin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poker_payin_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '日志Id',
  `txID` varchar(128) NOT NULL COMMENT '交易TX',
  `addr` varchar(128) NOT NULL COMMENT '玩家地址',
  `tableId` int(11) NOT NULL COMMENT '桌号',
  `trxAmount` bigint(20) NOT NULL COMMENT '金额',
  `optime` int(11) NOT NULL COMMENT '操作时间',
  PRIMARY KEY (`logId`)
) ENGINE=InnoDB AUTO_INCREMENT=261088 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poker_payout_log`
--

DROP TABLE IF EXISTS `poker_payout_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poker_payout_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '日志Id',
  `sysTxID` varchar(128) NOT NULL COMMENT '内部TX',
  `txID` varchar(128) NOT NULL COMMENT '交易TX',
  `addr` varchar(64) NOT NULL COMMENT '玩家地址',
  `tableId` int(11) NOT NULL COMMENT '桌号',
  `trxAmount` bigint(20) NOT NULL COMMENT '金额',
  `optype` smallint(6) NOT NULL DEFAULT '0' COMMENT '退款类型(提款/回退)',
  `optime` int(11) NOT NULL COMMENT '操作时间',
  PRIMARY KEY (`logId`)
) ENGINE=InnoDB AUTO_INCREMENT=159852 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poker_payout_retry_log`
--

DROP TABLE IF EXISTS `poker_payout_retry_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poker_payout_retry_log` (
  `logId` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '日志Id',
  `sysTxID` varchar(128) NOT NULL COMMENT '系统内部TX',
  `txID` varchar(128) NOT NULL COMMENT '链TX',
  `trxAmount` bigint(20) NOT NULL COMMENT 'TRX数量',
  `paytime` int(11) NOT NULL COMMENT '调用时间',
  `tableId` int(11) NOT NULL DEFAULT '0' COMMENT '桌号',
  PRIMARY KEY (`logId`)
) ENGINE=InnoDB AUTO_INCREMENT=2607 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poker_revenue_log`
--

DROP TABLE IF EXISTS `poker_revenue_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poker_revenue_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '日志Id',
  `addr` varchar(64) NOT NULL COMMENT '钱包地址',
  `tableId` int(11) NOT NULL COMMENT '桌编号',
  `no` int(11) NOT NULL DEFAULT '0' COMMENT '游戏轮次',
  `cointype` varchar(8) NOT NULL DEFAULT 'TRX' COMMENT '币种',
  `amount` bigint(20) NOT NULL COMMENT '数量充入/赢为正,提款/输为负',
  `action` smallint(6) NOT NULL COMMENT '操作类型',
  `optime` bigint(20) NOT NULL COMMENT 'UNIXTIMESTAMP',
  `oldAmount` bigint(20) NOT NULL DEFAULT '0' COMMENT '操作前数量',
  `newAmount` bigint(20) NOT NULL DEFAULT '0' COMMENT '操作后数量',
  PRIMARY KEY (`logId`)
) ENGINE=InnoDB AUTO_INCREMENT=5612692 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poker_sng_log`
--

DROP TABLE IF EXISTS `poker_sng_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poker_sng_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `table_id` int(11) NOT NULL DEFAULT '0' COMMENT '桌号',
  `table_no` int(11) NOT NULL,
  `table_type` smallint(6) NOT NULL DEFAULT '0' COMMENT '游戏类型',
  `sng_rank` smallint(6) NOT NULL DEFAULT '0' COMMENT '名次',
  `uid` char(34) NOT NULL,
  `table_buyin` bigint(20) NOT NULL COMMENT '本局总买入',
  `player_buyin` bigint(20) NOT NULL,
  `payout` bigint(20) NOT NULL,
  `ts` bigint(20) NOT NULL DEFAULT '0' COMMENT '赔付',
  PRIMARY KEY (`logId`),
  KEY `poker_sng_log_ts_idx` (`ts`)
) ENGINE=InnoDB AUTO_INCREMENT=3982 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poker_statistics_log`
--

DROP TABLE IF EXISTS `poker_statistics_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poker_statistics_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `table_id` int(11) NOT NULL DEFAULT '0' COMMENT '桌号',
  `table_no` int(11) NOT NULL DEFAULT '0' COMMENT '手号',
  `uid` char(255) NOT NULL DEFAULT '' COMMENT '玩家地址',
  `bet` bigint(20) NOT NULL DEFAULT '0' COMMENT '有效下注',
  `payout` bigint(20) NOT NULL DEFAULT '0' COMMENT '赔付',
  `fee` bigint(20) NOT NULL DEFAULT '0' COMMENT '抽成',
  `ts` bigint(20) NOT NULL DEFAULT '0' COMMENT '时间戳',
  PRIMARY KEY (`logId`),
  UNIQUE KEY `index_id_no_uid` (`table_id`,`table_no`,`uid`),
  KEY `index_ts` (`ts`)
) ENGINE=InnoDB AUTO_INCREMENT=8031617 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rake_airdrop_log`
--

DROP TABLE IF EXISTS `rake_airdrop_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rake_airdrop_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `addr` varchar(64) DEFAULT NULL,
  `startTs` bigint(20) DEFAULT NULL,
  `endTs` bigint(20) DEFAULT NULL,
  `betAmount` bigint(20) NOT NULL,
  `adAmount` bigint(20) NOT NULL,
  `txId` varchar(160) DEFAULT NULL,
  `status` smallint(6) DEFAULT '0',
  `confirmedStatus` smallint(6) DEFAULT '0',
  PRIMARY KEY (`logId`),
  UNIQUE KEY `addr_startTs_endTs` (`addr`,`startTs`,`endTs`)
) ENGINE=InnoDB AUTO_INCREMENT=4448536 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rake_div_detail`
--

DROP TABLE IF EXISTS `rake_div_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rake_div_detail` (
  `log_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增日志ID',
  `round` int(10) unsigned NOT NULL DEFAULT '1' COMMENT '期数',
  `addr` char(34) NOT NULL DEFAULT '' COMMENT '用户地址',
  `token` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期玩家持有TOken数(单位sun)',
  `trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期应分玩家TRX数（单位sun）',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期奖池总trx(单位sun)',
  `total_token` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '截止本期共释放Token数（单位sun）',
  `tx_id` char(64) NOT NULL DEFAULT '' COMMENT '分红交易ID',
  `state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '状态 0:无 1:已快照 2:已发送 3:已确认 4:交易失败',
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=649590 DEFAULT CHARSET=utf8 COMMENT='rake token分红详情';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rake_div_info`
--

DROP TABLE IF EXISTS `rake_div_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rake_div_info` (
  `round` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `total_token` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计已冻结trx数(单位sun)',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红TRX(单位sun)',
  `rank_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红TRX(单位sun)',
  `mark_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '统计分红数据时间戳',
  `send_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
  `div_state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  PRIMARY KEY (`round`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='rake token分红总揽';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-11-05  8:33:54
