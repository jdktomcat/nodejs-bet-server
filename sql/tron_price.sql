-- MySQL dump 10.13  Distrib 8.0.16, for macos10.14 (x86_64)
--
-- Host: localhost    Database: tron_price
-- ------------------------------------------------------
-- Server version	8.0.16

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
-- Current Database: `tron_price`
--

DROP DATABASE IF EXISTS `tron_price`;
CREATE DATABASE `tron_price`;
USE `tron_price`;

--
-- Table structure for table `TRX_EUR`
--

DROP TABLE IF EXISTS `TRX_EUR`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `TRX_EUR` (
  `tid` int(11) NOT NULL AUTO_INCREMENT,
  `price` decimal(10,3) NOT NULL,
  `count` decimal(10,3) NOT NULL,
  `last_updated` bigint(20) NOT NULL,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`tid`),
  KEY `idx_last_updated` (`last_updated` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TRX_EUR`
--

LOCK TABLES `TRX_EUR` WRITE;
/*!40000 ALTER TABLE `TRX_EUR` DISABLE KEYS */;
/*!40000 ALTER TABLE `TRX_EUR` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TRX_USD`
--

DROP TABLE IF EXISTS `TRX_USD`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `TRX_USD` (
  `tid` int(11) NOT NULL AUTO_INCREMENT,
  `price` decimal(10,3) NOT NULL,
  `count` decimal(10,3) NOT NULL,
  `last_updated` bigint(20) NOT NULL,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`tid`),
  KEY `idx_last_updated` (`last_updated` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TRX_USD`
--

LOCK TABLES `TRX_USD` WRITE;
/*!40000 ALTER TABLE `TRX_USD` DISABLE KEYS */;
/*!40000 ALTER TABLE `TRX_USD` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `USD_EUR`
--

DROP TABLE IF EXISTS `USD_EUR`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `USD_EUR` (
  `tid` int(11) NOT NULL AUTO_INCREMENT,
  `price` decimal(10,3) NOT NULL,
  `count` decimal(10,3) NOT NULL,
  `last_updated` bigint(20) NOT NULL,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`tid`),
  KEY `idx_last_updated` (`last_updated` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `USD_EUR`
--

LOCK TABLES `USD_EUR` WRITE;
/*!40000 ALTER TABLE `USD_EUR` DISABLE KEYS */;
/*!40000 ALTER TABLE `USD_EUR` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-09-20 16:38:27
