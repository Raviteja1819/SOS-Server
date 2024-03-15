CREATE DATABASE  IF NOT EXISTS `aid` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `aid`;
-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: aid
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `anonymousreports`
--

DROP TABLE IF EXISTS `anonymousreports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anonymousreports` (
  `UserId` varchar(255) NOT NULL,
  `Reportedaccount` varchar(255) NOT NULL,
  `place` varchar(255) NOT NULL,
  `Date` date NOT NULL,
  `Time` time NOT NULL,
  `status` varchar(255) NOT NULL,
  `coordinates` point NOT NULL,
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anonymousreports`
--

LOCK TABLES `anonymousreports` WRITE;
/*!40000 ALTER TABLE `anonymousreports` DISABLE KEYS */;
/*!40000 ALTER TABLE `anonymousreports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bloodemergency`
--

DROP TABLE IF EXISTS `bloodemergency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloodemergency` (
  `UserId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `hospitalname` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `bloodtype` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `coordinates` point DEFAULT NULL,
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bloodemergency`
--

LOCK TABLES `bloodemergency` WRITE;
/*!40000 ALTER TABLE `bloodemergency` DISABLE KEYS */;
/*!40000 ALTER TABLE `bloodemergency` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bloodrequirement`
--

DROP TABLE IF EXISTS `bloodrequirement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bloodrequirement` (
  `UserId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `hospitalname` varchar(255) NOT NULL,
  `Date` date NOT NULL,
  `bloodtype` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `coordinates` point DEFAULT NULL,
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bloodrequirement`
--

LOCK TABLES `bloodrequirement` WRITE;
/*!40000 ALTER TABLE `bloodrequirement` DISABLE KEYS */;
/*!40000 ALTER TABLE `bloodrequirement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `callbackrequests`
--

DROP TABLE IF EXISTS `callbackrequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `callbackrequests` (
  `UserId` varchar(255) NOT NULL,
  `Reportedaccount` varchar(255) NOT NULL,
  `place` varchar(255) NOT NULL,
  `Date` date NOT NULL,
  `Time` time NOT NULL,
  `status` varchar(255) NOT NULL,
  `coordinates` point NOT NULL,
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `callbackrequests`
--

LOCK TABLES `callbackrequests` WRITE;
/*!40000 ALTER TABLE `callbackrequests` DISABLE KEYS */;
/*!40000 ALTER TABLE `callbackrequests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emergencycontacts`
--

DROP TABLE IF EXISTS `emergencycontacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emergencycontacts` (
  `UserId` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Mobilenumber` varchar(255) NOT NULL,
  `relation` varchar(255) NOT NULL,
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emergencycontacts`
--

LOCK TABLES `emergencycontacts` WRITE;
/*!40000 ALTER TABLE `emergencycontacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `emergencycontacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newprofilesignups`
--

DROP TABLE IF EXISTS `newprofilesignups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newprofilesignups` (
  `UserId` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `Mobile` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `bloodtype` varchar(255) NOT NULL,
  `coordinates` point NOT NULL,
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newprofilesignups`
--

LOCK TABLES `newprofilesignups` WRITE;
/*!40000 ALTER TABLE `newprofilesignups` DISABLE KEYS */;
/*!40000 ALTER TABLE `newprofilesignups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `peoplenearbyavailable`
--

DROP TABLE IF EXISTS `peoplenearbyavailable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `peoplenearbyavailable` (
  `UserId` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Phone` varchar(255) NOT NULL,
  `coordinates` point NOT NULL,
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `peoplenearbyavailable`
--

LOCK TABLES `peoplenearbyavailable` WRITE;
/*!40000 ALTER TABLE `peoplenearbyavailable` DISABLE KEYS */;
/*!40000 ALTER TABLE `peoplenearbyavailable` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reportedissues`
--

DROP TABLE IF EXISTS `reportedissues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reportedissues` (
  `UserId` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Phone` varchar(255) NOT NULL,
  `Date` date NOT NULL,
  `status` varchar(255) NOT NULL,
  `coordinates` point NOT NULL,
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reportedissues`
--

LOCK TABLES `reportedissues` WRITE;
/*!40000 ALTER TABLE `reportedissues` DISABLE KEYS */;
/*!40000 ALTER TABLE `reportedissues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserId` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Mobile` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `bloodtype` varchar(255) NOT NULL,
  `coordinates` point NOT NULL,
  PRIMARY KEY (`UserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-03-16  0:00:12
