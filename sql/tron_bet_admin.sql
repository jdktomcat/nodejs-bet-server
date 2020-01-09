-- MySQL dump 10.13  Distrib 5.7.27, for Linux (x86_64)
--
-- Host: 69.162.94.166    Database: tron_bet_admin
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

DROP DATABASE IF EXISTS `tron_bet_admin`;
CREATE DATABASE `tron_bet_admin`;
USE `tron_bet_admin`;

--
-- Table structure for table `act_end`
--

DROP TABLE IF EXISTS `act_end`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `act_end` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `end_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_burnt_log`
--

DROP TABLE IF EXISTS `ante_burnt_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_burnt_log` (
  `types` smallint(6) DEFAULT NULL COMMENT '1 dice burn, 2 rebought burn, 3 company brun, 4 others',
  `call_addr` char(40) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `tx_id` char(64) DEFAULT NULL,
  UNIQUE KEY `log_idddd` (`types`,`call_addr`,`amount`,`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_holders_balance_v2`
--

DROP TABLE IF EXISTS `ante_holders_balance_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_holders_balance_v2` (
  `addr` char(34) DEFAULT NULL,
  `balance` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ante_holders_v2`
--

DROP TABLE IF EXISTS `ante_holders_v2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ante_holders_v2` (
  `addr` char(34) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_player_order`
--

DROP TABLE IF EXISTS `dice_player_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_player_order` (
  `addr` varchar(50) DEFAULT NULL,
  `tx_id` varchar(128) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `sign` varchar(140) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  KEY `dice_player_order_addr` (`addr`),
  KEY `dice_player_order_tx_id` (`tx_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dice_user_order`
--

DROP TABLE IF EXISTS `dice_user_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dice_user_order` (
  `addr` varchar(50) DEFAULT NULL,
  `tx_id` varchar(128) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `sign` varchar(140) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  KEY `dice_user_order_addr` (`addr`),
  KEY `dice_user_order_addr_order` (`addr`,`order_id`),
  KEY `dice_user_order_tx_id` (`tx_id`),
  KEY `dice_user_order_ts` (`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `histline`
--

DROP TABLE IF EXISTS `histline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `histline` (
  `date` int(11) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `profit` float DEFAULT NULL,
  `cnt` int(11) DEFAULT NULL,
  `users` int(11) DEFAULT NULL,
  `newuser` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_cate_data`
--

DROP TABLE IF EXISTS `live_cate_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_cate_data` (
  `ts` bigint(20) DEFAULT NULL,
  `days` int(11) DEFAULT NULL,
  `cate` varchar(32) DEFAULT NULL,
  `game` varchar(32) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `profit` bigint(20) DEFAULT NULL,
  `playCnt` int(11) DEFAULT NULL,
  `userCnt` int(11) DEFAULT NULL,
  `userIncCnt` int(11) DEFAULT '0',
  `usd` double(11,2) DEFAULT NULL COMMENT 'usd',
  `eur` double(11,2) DEFAULT NULL COMMENT 'eur',
  `cny` double(11,2) DEFAULT NULL COMMENT 'cny',
  UNIQUE KEY `days_game` (`game`,`days`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `live_group_data`
--

DROP TABLE IF EXISTS `live_group_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `live_group_data` (
  `ts` bigint(20) DEFAULT NULL,
  `days` int(11) DEFAULT NULL,
  `cate` varchar(32) DEFAULT NULL,
  `game` varchar(32) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `profit` bigint(20) DEFAULT NULL,
  `playCnt` int(11) DEFAULT NULL,
  `userCnt` int(11) DEFAULT NULL,
  `userIncCnt` int(11) DEFAULT '0',
  UNIQUE KEY `days_game` (`game`,`days`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `moon_round_info`
--

DROP TABLE IF EXISTS `moon_round_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `moon_round_info` (
  `round` int(11) NOT NULL,
  `tx_id` char(64) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `crashAt` int(11) DEFAULT NULL,
  PRIMARY KEY (`round`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `moon_user_order`
--

DROP TABLE IF EXISTS `moon_user_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `moon_user_order` (
  `round` int(11) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `addr` varchar(35) DEFAULT NULL,
  `mentor` varchar(35) DEFAULT NULL,
  `crashAt` int(11) DEFAULT NULL,
  `autoAt` int(11) DEFAULT NULL,
  `escapeAt` int(11) DEFAULT NULL,
  `win` bigint(20) DEFAULT NULL,
  `referralAmount` int(11) DEFAULT NULL,
  `minedAnte` int(11) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `sign` varchar(131) DEFAULT NULL,
  `tx_id` varchar(65) DEFAULT NULL,
  UNIQUE KEY `moon_user_order_unikey_t` (`round`,`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sum_data`
--

DROP TABLE IF EXISTS `sum_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sum_data` (
  `ts` bigint(20) DEFAULT NULL,
  `days` int(11) DEFAULT NULL,
  `game` varchar(32) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `profit` bigint(20) DEFAULT NULL,
  `playCnt` int(11) DEFAULT NULL,
  `userCnt` int(11) DEFAULT NULL,
  `userIncCnt` int(11) DEFAULT '0',
  `usd` double(11,2) DEFAULT NULL COMMENT 'usd',
  `eur` double(11,2) DEFAULT NULL COMMENT 'eur',
  `cny` double(11,2) DEFAULT NULL COMMENT 'cny',
  UNIQUE KEY `days_game` (`game`,`days`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sum_data_detail`
--

DROP TABLE IF EXISTS `sum_data_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sum_data_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` int(10) NOT NULL COMMENT '平台：1、ANTE,2、LIVE',
  `channel` int(10) NOT NULL COMMENT '渠道，1：波场，2：ANTE持有者，3：LIVE持有者，4：排行榜，5：供应商, 6:win持有者',
  `supplier` varchar(255) DEFAULT NULL COMMENT '供应商',
  `ts` bigint(20) NOT NULL COMMENT '创建时间',
  `days` int(11) NOT NULL,
  `amount` bigint(255) NOT NULL DEFAULT '0' COMMENT '流水',
  `proportion` varchar(255) DEFAULT NULL COMMENT '计提比例',
  `bonus_trx` double(10,0) NOT NULL DEFAULT '0' COMMENT '分佣金额',
  `usd` double(11,2) DEFAULT NULL COMMENT 'usdt估值',
  `eur` double(11,2) DEFAULT NULL COMMENT 'eur估值',
  `cny` double(11,2) DEFAULT NULL COMMENT 'cny估值',
  `profit` bigint(255) DEFAULT '0' COMMENT '总盈利',
  PRIMARY KEY (`id`),
  UNIQUE KEY `pcsd` (`platform`,`channel`,`supplier`,`days`)
) ENGINE=InnoDB AUTO_INCREMENT=724 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tmplogs`
--

DROP TABLE IF EXISTS `tmplogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tmplogs` (
  `date` int(11) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `profit` float DEFAULT NULL,
  `cnt` int(11) DEFAULT NULL,
  `users` int(11) DEFAULT NULL,
  `newuser` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `total_data`
--

DROP TABLE IF EXISTS `total_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `total_data` (
  `ts` bigint(20) DEFAULT NULL,
  `days` int(11) DEFAULT NULL,
  `game` varchar(32) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `profit` bigint(20) DEFAULT NULL,
  `playCnt` int(11) DEFAULT NULL,
  `userCnt` int(11) DEFAULT NULL,
  `userIncCnt` int(11) DEFAULT '0',
  UNIQUE KEY `days_game` (`game`,`days`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `total_data_detail`
--

DROP TABLE IF EXISTS `total_data_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `total_data_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` int(10) NOT NULL COMMENT '平台：1、ANTE,2、LIVE',
  `channel` int(10) NOT NULL COMMENT '渠道，1：波场，2：ANTE持有者，3：LIVE持有者，4：排行榜，5：供应商',
  `supplier` varchar(255) DEFAULT NULL COMMENT '供应商',
  `ts` int(11) NOT NULL COMMENT '创建时间',
  `days` int(11) NOT NULL,
  `amount` bigint(255) NOT NULL DEFAULT '0' COMMENT '流水',
  `proportion` varchar(255) DEFAULT NULL COMMENT '计提比例',
  `bonus_trx` double(10,0) NOT NULL DEFAULT '0' COMMENT '分佣金额',
  `usd` int(11) DEFAULT NULL COMMENT 'usdt估值',
  `eur` int(11) DEFAULT NULL COMMENT 'eur估值',
  `cny` int(11) DEFAULT NULL COMMENT 'cny估值',
  PRIMARY KEY (`id`),
  KEY `pcsd` (`platform`,`channel`,`supplier`,`days`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `update_notice`
--

DROP TABLE IF EXISTS `update_notice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `update_notice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(128) DEFAULT NULL,
  `content` mediumtext,
  `language` varchar(10) DEFAULT NULL,
  `update_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(64) DEFAULT NULL,
  `passwd` varchar(64) DEFAULT NULL,
  `role` int(11) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wheel_round_info`
--

DROP TABLE IF EXISTS `wheel_round_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wheel_round_info` (
  `round` int(11) NOT NULL,
  `tx_id` char(64) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `number` int(11) DEFAULT NULL,
  PRIMARY KEY (`round`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wheel_solo_order`
--

DROP TABLE IF EXISTS `wheel_solo_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wheel_solo_order` (
  `room_id` int(10) unsigned NOT NULL COMMENT 'solo房间号',
  `roll` float unsigned DEFAULT '0' COMMENT '转盘值',
  `seat_id` smallint(6) NOT NULL DEFAULT '0' COMMENT '座位号',
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
  `playerCnt` smallint(6) NOT NULL DEFAULT '0' COMMENT '房间上限人数, 最大为4, 最小为2',
  `status` smallint(6) NOT NULL DEFAULT '0' COMMENT '当前状态, 1, 正常解决, 2超时撤销',
  `settleTx` char(130) DEFAULT '' COMMENT '解决TX',
  `createTs` bigint(20) unsigned DEFAULT '0' COMMENT '房间创建时间',
  `endTs` bigint(20) unsigned DEFAULT '0' COMMENT '房间结算或者撤销时间',
  PRIMARY KEY (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='区块扫描信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wheel_user_order`
--

DROP TABLE IF EXISTS `wheel_user_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wheel_user_order` (
  `round` int(11) DEFAULT NULL,
  `amount` bigint(20) DEFAULT NULL,
  `addr` varchar(35) DEFAULT NULL,
  `aindex` smallint(6) DEFAULT NULL,
  `mentor` varchar(35) DEFAULT NULL,
  `roll` int(11) DEFAULT NULL,
  `number` int(11) DEFAULT NULL,
  `win` bigint(20) DEFAULT NULL,
  `referralAmount` int(11) DEFAULT NULL,
  `minedAnte` int(11) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  `result_hash` char(64) DEFAULT NULL,
  `salt` char(32) DEFAULT NULL,
  `luckyNum` int(11) DEFAULT NULL,
  `sign` varchar(131) DEFAULT NULL,
  `tx_id` char(130) DEFAULT NULL,
  UNIQUE KEY `wheel_user_order_unikey_t_v2` (`round`,`addr`,`aindex`,`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-11-05  8:34:40



-- 新增活动页计算新用户导流
CREATE TABLE `activity_count` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(64) DEFAULT NULL,
  `address` varchar(64) DEFAULT NULL,
  `ts` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_count_index1` (`type`),
  KEY `activity_count_index2` (`address`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8;