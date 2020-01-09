-- MySQL dump 10.13  Distrib 5.7.27, for Linux (x86_64)
--
-- Host: 192.169.80.102    Database: tron_live
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

DROP DATABASE IF EXISTS `tron_live`;
CREATE DATABASE `tron_live`;
USE `tron_live`;

--
-- Table structure for table `live_account`
--

DROP TABLE IF EXISTS `live_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_account` (
  `uid` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(64) DEFAULT NULL,
  `passwd` varchar(128) DEFAULT NULL,
  `head` varchar(128) DEFAULT NULL,
  `lv` smallint(6) DEFAULT '1',
  `nickName` varchar(128) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  `currency` varchar(32) DEFAULT 'BTC',
  `sessionId` varchar(64) DEFAULT NULL,
  `userkey` varchar(64) DEFAULT NULL,
  `sportsSession` varchar(64) DEFAULT NULL,
  `registerTs` bigint(20) DEFAULT NULL,
  `loginTs` bigint(20) DEFAULT NULL,
  `bindStatus` smallint(6) DEFAULT '0',
  PRIMARY KEY (`uid`),
  UNIQUE KEY `email_idx` (`email`),
  UNIQUE KEY `sessionId_idx` (`sessionId`),
  UNIQUE KEY `userkey_idx` (`userkey`),
  UNIQUE KEY `sportsSession_idx` (`sportsSession`),
  UNIQUE KEY `nickName` (`nickName`)
) ENGINE=InnoDB AUTO_INCREMENT=33707 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_action_log`
--

DROP TABLE IF EXISTS `live_action_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_action_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `addr` varchar(64) DEFAULT NULL,
  `GPGameId` varchar(64) DEFAULT NULL,
  `EMGameId` varchar(64) DEFAULT NULL,
  `TransactionId` varchar(64) DEFAULT NULL,
  `GPId` int(11) DEFAULT NULL,
  `RoundId` varchar(64) DEFAULT NULL,
  `Device` varchar(32) DEFAULT NULL,
  `Amount` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `txId` varchar(160) DEFAULT NULL,
  `RoundStatus` varchar(32) DEFAULT NULL,
  `action` varchar(32) DEFAULT NULL,
  `txStatus` smallint(5) unsigned DEFAULT '1',
  `AddsAmount` float DEFAULT '0',
  PRIMARY KEY (`logId`),
  UNIQUE KEY `TransactionId_unikey` (`TransactionId`),
  KEY `live_action_log_addr_idx` (`addr`),
  KEY `action_index` (`ts`)
) ENGINE=InnoDB AUTO_INCREMENT=121365017 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_action_log_v2`
--

DROP TABLE IF EXISTS `live_action_log_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_action_log_v2` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `addr` varchar(64) DEFAULT NULL,
  `GPGameId` varchar(64) DEFAULT NULL,
  `EMGameId` varchar(64) DEFAULT NULL,
  `TransactionId` varchar(64) DEFAULT NULL,
  `GPId` int(11) DEFAULT NULL,
  `RoundId` varchar(64) DEFAULT NULL,
  `Device` varchar(32) DEFAULT NULL,
  `Amount` float DEFAULT NULL,
  `AddsAmount` float DEFAULT '0',
  `ts` bigint(20) DEFAULT NULL,
  `txId` varchar(160) DEFAULT NULL,
  `RoundStatus` varchar(32) DEFAULT NULL,
  `action` varchar(32) DEFAULT NULL,
  `currency` varchar(32) DEFAULT NULL,
  `txStatus` smallint(5) unsigned DEFAULT '1',
  PRIMARY KEY (`logId`),
  UNIQUE KEY `TransactionId_unikey` (`TransactionId`),
  KEY `live_action_log_v2_addr_idx` (`addr`),
  KEY `live_action_log_v2_TransactionId_idx` (`TransactionId`),
  KEY `live_action_log_v2_ts_idx` (`ts`)
) ENGINE=InnoDB AUTO_INCREMENT=261863 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_airdrop_log`
--

DROP TABLE IF EXISTS `live_airdrop_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_airdrop_log` (
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
  UNIQUE KEY `addr_startTs_endTs` (`addr`,`startTs`,`endTs`),
  UNIQUE KEY `addr` (`addr`,`startTs`)
) ENGINE=InnoDB AUTO_INCREMENT=15840410 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_amount_rank_log`
--

DROP TABLE IF EXISTS `live_amount_rank_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_amount_rank_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `round` int(11) NOT NULL,
  `addr` varchar(34) DEFAULT NULL,
  `amount` bigint(20) NOT NULL,
  `wardAmount` bigint(20) NOT NULL,
  `txId` varchar(160) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`logId`),
  UNIQUE KEY `round_addr` (`round`,`addr`)
) ENGINE=InnoDB AUTO_INCREMENT=647 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_balance`
--

DROP TABLE IF EXISTS `live_balance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_balance` (
  `uid` bigint(20) DEFAULT NULL,
  `currency` varchar(32) DEFAULT NULL,
  `addr` varchar(128) DEFAULT NULL,
  `tag` varchar(128) DEFAULT NULL,
  `balance` bigint(20) unsigned DEFAULT '0',
  UNIQUE KEY `uid_addr` (`uid`,`currency`),
  UNIQUE KEY `currency_addr` (`currency`,`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_bet_info`
--

DROP TABLE IF EXISTS `live_bet_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_bet_info` (
  `round` int(11) DEFAULT NULL,
  `addr` varchar(64) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `win` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  UNIQUE KEY `round` (`round`,`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_cb_deposit_log`
--

DROP TABLE IF EXISTS `live_cb_deposit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_cb_deposit_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `uid` bigint(20) DEFAULT NULL,
  `currency` varchar(32) DEFAULT NULL,
  `addr` varchar(128) DEFAULT NULL,
  `tag` varchar(64) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `txId` varchar(160) DEFAULT NULL,
  PRIMARY KEY (`logId`),
  UNIQUE KEY `txId` (`txId`)
) ENGINE=InnoDB AUTO_INCREMENT=2372 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_cb_withdraw_log`
--

DROP TABLE IF EXISTS `live_cb_withdraw_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_cb_withdraw_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `uid` bigint(20) DEFAULT NULL,
  `email` varchar(64) DEFAULT NULL,
  `orderId` varchar(64) DEFAULT NULL,
  `currency` varchar(32) DEFAULT NULL,
  `addr` varchar(128) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `startTs` bigint(20) DEFAULT NULL,
  `endTs` bigint(20) DEFAULT NULL,
  `txId` varchar(160) DEFAULT NULL,
  `status` smallint(6) DEFAULT '0',
  PRIMARY KEY (`logId`),
  UNIQUE KEY `orderId` (`orderId`)
) ENGINE=InnoDB AUTO_INCREMENT=837 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_charge_log`
--

DROP TABLE IF EXISTS `live_charge_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_charge_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `addr` varchar(64) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `txId` varchar(160) DEFAULT NULL,
  PRIMARY KEY (`logId`),
  UNIQUE KEY `txId` (`txId`),
  KEY `live_charge_log_addr_idx` (`addr`)
) ENGINE=InnoDB AUTO_INCREMENT=1082453 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_div_detail`
--

DROP TABLE IF EXISTS `live_div_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_div_detail` (
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
) ENGINE=InnoDB AUTO_INCREMENT=1924303 DEFAULT CHARSET=utf8 COMMENT='live token分红详情';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_div_info`
--

DROP TABLE IF EXISTS `live_div_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_div_info` (
  `round` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '分红期数',
  `total_token` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '累计已冻结trx数(单位sun)',
  `total_trx` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '本期分红TRX(单位sun)',
  `mark_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '统计分红数据时间戳',
  `send_ts` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '发送分红时间戳',
  `div_state` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '分红状态 0:等待统计 1:等待分红 2:分红完毕',
  `rank_trx` bigint(20) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`round`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='live token分红总揽';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_expr`
--

DROP TABLE IF EXISTS `live_expr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_expr` (
  `addr` varchar(64) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `win` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  UNIQUE KEY `addr` (`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_forgot_pass`
--

DROP TABLE IF EXISTS `live_forgot_pass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_forgot_pass` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(64) DEFAULT NULL,
  `ip` varchar(32) DEFAULT NULL,
  `code` varchar(64) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`logId`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_login_code`
--

DROP TABLE IF EXISTS `live_login_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_login_code` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(64) DEFAULT NULL,
  `code` varchar(32) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`logId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_login_log`
--

DROP TABLE IF EXISTS `live_login_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_login_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `addr` char(34) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`logId`)
) ENGINE=InnoDB AUTO_INCREMENT=500567 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_payout_rank_log`
--

DROP TABLE IF EXISTS `live_payout_rank_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_payout_rank_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `round` int(11) NOT NULL,
  `addr` varchar(34) DEFAULT NULL,
  `amount` bigint(20) NOT NULL,
  `wardAmount` bigint(20) NOT NULL,
  `txId` varchar(160) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`logId`),
  UNIQUE KEY `round_addr` (`round`,`addr`)
) ENGINE=InnoDB AUTO_INCREMENT=637 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_profit_log`
--

DROP TABLE IF EXISTS `live_profit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_profit_log` (
  `days` int(11) NOT NULL,
  `profit` bigint(20) NOT NULL,
  PRIMARY KEY (`days`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_register_code`
--

DROP TABLE IF EXISTS `live_register_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_register_code` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(64) DEFAULT NULL,
  `code` varchar(32) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`logId`)
) ENGINE=InnoDB AUTO_INCREMENT=206 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_user`
--

DROP TABLE IF EXISTS `live_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_user` (
  `addr` varchar(64) NOT NULL,
  `nickName` varchar(128) DEFAULT NULL,
  `level` int(11) DEFAULT '1',
  `exps` bigint(20) DEFAULT '0',
  `trx` bigint(8) unsigned DEFAULT '0',
  `sessionId` varchar(64) DEFAULT NULL,
  `loginTs` bigint(20) DEFAULT NULL,
  `userkey` varchar(64) DEFAULT NULL,
  `sportsSession` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`addr`),
  UNIQUE KEY `ids_unique_session` (`sessionId`),
  UNIQUE KEY `ids_unique_userKey` (`userkey`),
  UNIQUE KEY `ids_unique_sportsSession` (`sportsSession`),
  KEY `live_user_sessuid_idx` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_withdraw_log`
--

DROP TABLE IF EXISTS `live_withdraw_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_withdraw_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `orderId` varchar(64) DEFAULT NULL,
  `addr` varchar(64) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `lefts` bigint(20) DEFAULT NULL,
  `startTs` bigint(20) DEFAULT NULL,
  `endTs` bigint(20) DEFAULT NULL,
  `txId` varchar(160) DEFAULT NULL,
  `status` smallint(6) DEFAULT '0',
  PRIMARY KEY (`logId`),
  UNIQUE KEY `orderId` (`orderId`)
) ENGINE=InnoDB AUTO_INCREMENT=794016 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `makeup_air_drop`
--

DROP TABLE IF EXISTS `makeup_air_drop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `makeup_air_drop` (
  `addr` varchar(64) DEFAULT NULL,
  `airDropAmount` bigint(20) DEFAULT NULL,
  `status` smallint(6) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `robot`
--

DROP TABLE IF EXISTS `robot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `robot` (
  `addr` varchar(64) DEFAULT NULL,
  `privateKey` varchar(120) DEFAULT NULL,
  `sessionId` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sports_bet_detail_log`
--

DROP TABLE IF EXISTS `sports_bet_detail_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sports_bet_detail_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `addr` varchar(64) DEFAULT NULL,
  `transactionId` bigint(20) DEFAULT NULL,
  `betslipId` bigint(20) DEFAULT NULL,
  `currency` varchar(4) DEFAULT NULL,
  `sumAmount` bigint(20) DEFAULT NULL,
  `types` varchar(32) DEFAULT NULL,
  `betK` float DEFAULT NULL,
  `betId` bigint(20) DEFAULT NULL,
  `sportId` bigint(20) DEFAULT NULL,
  `eventId` bigint(20) DEFAULT NULL,
  `tournamentId` bigint(20) DEFAULT NULL,
  `categoryId` bigint(20) DEFAULT NULL,
  `live` smallint(6) DEFAULT NULL,
  `competitorName` varchar(256) DEFAULT NULL,
  `outcomeName` varchar(64) DEFAULT NULL,
  `scheduled` bigint(20) DEFAULT NULL,
  `odds` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`logId`),
  UNIQUE KEY `betId_key` (`betId`),
  KEY `transactionId_logIdx` (`transactionId`)
) ENGINE=InnoDB AUTO_INCREMENT=386009 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sports_result_log`
--

DROP TABLE IF EXISTS `sports_result_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sports_result_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `addr` varchar(64) DEFAULT NULL,
  `transactionId` bigint(20) DEFAULT NULL,
  `betTransactionId` bigint(20) DEFAULT NULL,
  `bonusId` bigint(20) DEFAULT NULL,
  `betslipId` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `currency` varchar(4) DEFAULT NULL,
  `action` varchar(12) DEFAULT NULL,
  `reason` varchar(128) DEFAULT NULL,
  `status` smallint(6) DEFAULT NULL,
  PRIMARY KEY (`logId`),
  UNIQUE KEY `transactionId_key` (`transactionId`)
) ENGINE=InnoDB AUTO_INCREMENT=169389 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sports_transaction_log`
--

DROP TABLE IF EXISTS `sports_transaction_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sports_transaction_log` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `addr` varchar(64) DEFAULT NULL,
  `transactionId` bigint(20) DEFAULT NULL,
  `betslipId` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `status` smallint(6) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `win` bigint(20) DEFAULT '0',
  `crossRateEuro` float DEFAULT NULL,
  `action` varchar(12) DEFAULT NULL,
  `currency` varchar(4) DEFAULT NULL,
  `adAmount` bigint(20) DEFAULT '0',
  PRIMARY KEY (`logId`),
  UNIQUE KEY `transactionId_key` (`transactionId`),
  KEY `sports_transaction_log_ts_idx` (`ts`),
  KEY `sports_transaction_log_status_idx` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=272931 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `swagger_transaction_log`
--

DROP TABLE IF EXISTS `swagger_transaction_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `swagger_transaction_log` (
  `transactionId` varchar(64) DEFAULT NULL,
  `uid` bigint(20) DEFAULT NULL,
  `email` varchar(64) DEFAULT NULL,
  `round` varchar(64) DEFAULT NULL,
  `isFree` smallint(6) DEFAULT '0',
  `gameId` int(11) DEFAULT NULL,
  `currency` varchar(32) DEFAULT NULL,
  `bet` varchar(32) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `win` bigint(20) DEFAULT '0',
  `adAmount` bigint(20) DEFAULT '0',
  `resultTxId` varchar(64) DEFAULT '',
  `status` smallint(5) unsigned DEFAULT '1',
  `ts` bigint(20) DEFAULT '0',
  UNIQUE KEY `transactionIdIDX` (`transactionId`),
  UNIQUE KEY `resultTxIdIDX` (`resultTxId`),
  KEY `swagger_transaction_log_ts_idx` (`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-11-05  8:33:39


CREATE TABLE `live_online_game` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor` varchar(64) DEFAULT NULL,
  `game_id` varchar(64) DEFAULT NULL,
  `game_name` varchar(64) DEFAULT NULL,
  `type` varchar(64) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `live_online_game_index1` (`vendor`),
  KEY `live_online_game_index2` (`game_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8;
